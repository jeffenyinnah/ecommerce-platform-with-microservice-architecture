import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pkg from 'pg';

const { Pool } = pkg;
dotenv.config();

const app = express();
const PORT = 4003;
app.use(cors());
app.use(express.json());

// db details

const pool = new Pool({
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB 
});

// create db
const initDb = async () => {
    const client = await pool.connect();
    try {
        await client.query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )`);
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
    } finally {
        client.release();
    }
};
initDb();


// register
app.post("/register", async (req, res) => {
    const { email, password} = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const client = await pool.connect();
        await client.query(`INSERT INTO users (email, password) VALUES ($1, $2)`, [email, hashedPassword]);
        await client.release();
        res.status(201).json({
            success: true,
            message: "User registered successfully"
        });
        console.log(`User registered successfully: ${email}`);

    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to register user"
        });
    }
});

// login
app.post("/login", async (req, res) => {
    const { email, password } =  req.body;

    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * FROM users WHERE email = $1`, [email]);
        await client.release();
        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({error: "Invalid email or password"});
        }

        const accessToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                accessToken,
                refreshToken
            }
        });
        console.log(`User logged in successfully: ${email}`);

    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to login user"
        });
    }
})

// refresh token
app.post("/refresh-token", async (req, res) => {
    const {refreshToken} = req.body;
    try {
        const decoded = jwt.verify(refreshToken,process.env.JWT_SECRET);
        const accessToken = jwt.sign({ userId: decoded.userId, email: decoded.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            data: {
                accessToken
            }
        });
    } catch (error) {
        console.error("Error refreshing token:", error);
        res.status(500).json({
            success: false,
            message: "Failed to refresh token"
        })
    }
})

// logout
app.post("/logout", async (req, res) => {
    const {refreshToken} = req.body;
    try {
        // Verify the refresh token is valid (optional)
        let userId = 'unknown';
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
            userId = decoded.userId;
        }
        
        // For stateless JWT, we don't need to delete tokens from database
        // The client will clear tokens from localStorage
        console.log(`User logged out successfully: ${userId}`);
        
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
            data: {
                accessToken: null,
                refreshToken: null
            }
        });

    } catch (error) {
        console.error("Error logging out user:", error);
        // Still return success even if token verification fails
        // The client should clear tokens regardless
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
            data: {
                accessToken: null,
                refreshToken: null
            }
        });
    }
})


// port
app.listen(PORT,()=>{
    console.log(`Auth service is running on port ${PORT}`);
})

