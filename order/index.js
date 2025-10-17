import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import { authenticateToken, authenticateService } from './middleware/auth.js';

const { Pool } = pkg;
dotenv.config();

const app = express();
const PORT = 4001;

// PostgreSQL connection pool
// db details
const DATABASE_URL = process.env.DATABASE_URL
const pool = new Pool({ 
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Use true in production with proper certificates
    }
});

// Database initialization
const initDb = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                order_id VARCHAR(255) UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                transaction_id VARCHAR(255) NOT NULL,
                conversation_id VARCHAR(255),
                transaction_reference VARCHAR(255),
                third_party_reference VARCHAR(255),
                amount DECIMAL(10, 2) NOT NULL,
                cart JSONB NOT NULL,
                customer_phone VARCHAR(20),
                status VARCHAR(50) DEFAULT 'paid',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        
        // Create index for faster lookups
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
            CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON orders(transaction_id);
            CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
        `);
        
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
    } finally {
        client.release();
    }
};

// Initialize database
initDb();

// MIDDLEWARE
// ============================================================================
app.use(express.json());
app.use(cors());

// ORDER MANAGEMENT

/**
 * Create a new order from payment success
 * Called by payment service after successful payment
 * Protected by service-to-service authentication
 */

const apiRouter = express.Router()

apiRouter.post('/orders', authenticateService, async (req, res) => {
    console.log('\n📦 New order received from payment service');
    
    const client = await pool.connect();
    try {
        const {
            userId,
            transactionId,
            conversationId,
            transactionReference,
            thirdPartyReference,
            amount,
            cart,
            customerPhone,
            timestamp
        } = req.body;

        // Validate required fields
        if (!userId || !transactionId || !amount || !cart) {
            return res.status(400).json({
                success: false,
                message: 'Missing required order fields'
            });
        }

        // Generate unique order ID
        const orderId = `ORD${Date.now()}`;
        const createdAt = timestamp || new Date().toISOString();

        // Insert order into database
        const result = await client.query(
            `INSERT INTO orders (
                order_id, user_id, transaction_id, conversation_id,
                transaction_reference, third_party_reference, amount,
                cart, customer_phone, status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`,
            [
                orderId,
                userId,
                transactionId,
                conversationId,
                transactionReference,
                thirdPartyReference,
                amount,
                JSON.stringify(cart),
                customerPhone,
                'paid',
                createdAt,
                createdAt
            ]
        );

        const dbOrder = result.rows[0];
        
        // Format response
        const order = {
            orderId: dbOrder.order_id,
            userId: dbOrder.user_id,
            transactionId: dbOrder.transaction_id,
            conversationId: dbOrder.conversation_id,
            transactionReference: dbOrder.transaction_reference,
            thirdPartyReference: dbOrder.third_party_reference,
            amount: parseFloat(dbOrder.amount),
            cart: dbOrder.cart,
            customerPhone: dbOrder.customer_phone,
            status: dbOrder.status,
            createdAt: dbOrder.created_at,
            updatedAt: dbOrder.updated_at
        };

        console.log(`✅ Order created: ${order.orderId}`);
        console.log(`   Amount: ${amount} MZN`);
        console.log(`   Items: ${cart.length}`);
        console.log(`   Transaction: ${transactionId}\n`);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });

    } catch (error) {
        console.error('❌ Error creating order:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * Get all orders for the authenticated user
 * Protected by user authentication
 */
apiRouter.get('/orders', authenticateToken, async (req, res) => {
    console.log(`📋 Fetching orders for user ${req.user.userId}`);
    
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
            [req.user.userId]
        );

        const userOrders = result.rows.map(row => ({
            orderId: row.order_id,
            userId: row.user_id,
            transactionId: row.transaction_id,
            conversationId: row.conversation_id,
            transactionReference: row.transaction_reference,
            thirdPartyReference: row.third_party_reference,
            amount: parseFloat(row.amount),
            cart: row.cart,
            customerPhone: row.customer_phone,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
        
        res.json({
            success: true,
            count: userOrders.length,
            data: userOrders
        });
    } catch (error) {
        console.error('❌ Error fetching orders:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * Get order by ID
 * Protected by user authentication
 */
apiRouter.get('/orders/:orderId', authenticateToken, async (req, res) => {
    const { orderId } = req.params;
    
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT * FROM orders WHERE order_id = $1 AND user_id = $2`,
            [orderId, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const row = result.rows[0];
        const order = {
            orderId: row.order_id,
            userId: row.user_id,
            transactionId: row.transaction_id,
            conversationId: row.conversation_id,
            transactionReference: row.transaction_reference,
            thirdPartyReference: row.third_party_reference,
            amount: parseFloat(row.amount),
            cart: row.cart,
            customerPhone: row.customer_phone,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('❌ Error fetching order:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * Get order by transaction ID
 * Protected by user authentication
 */
apiRouter.get('/orders/transaction/:transactionId', authenticateToken, async (req, res) => {
    const { transactionId } = req.params;
    
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT * FROM orders WHERE transaction_id = $1 AND user_id = $2`,
            [transactionId, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const row = result.rows[0];
        const order = {
            orderId: row.order_id,
            userId: row.user_id,
            transactionId: row.transaction_id,
            conversationId: row.conversation_id,
            transactionReference: row.transaction_reference,
            thirdPartyReference: row.third_party_reference,
            amount: parseFloat(row.amount),
            cart: row.cart,
            customerPhone: row.customer_phone,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('❌ Error fetching order:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * Health check
 */
apiRouter.get('/health', async (req, res) => {
    try {
        // Check database connection
        const client = await pool.connect();
        const result = await client.query('SELECT COUNT(*) FROM orders');
        const ordersCount = parseInt(result.rows[0].count);
        client.release();

        res.json({
            status: 'ok',
            service: 'Order Service',
            database: 'connected',
            ordersCount: ordersCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'error',
            service: 'Order Service',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.use('/api', apiRouter)
// ============================================================================
// START SERVER
// ============================================================================
app.listen(PORT, () => {
    console.log('\n🚀 Order Service Started');
    console.log(`📦 Running on http://localhost:${PORT}`);
    console.log(`💚 Health check: GET /api/health`);
    console.log(`📋 List orders: GET /orders\n`);
    console.log(`📋 List orders: GET /api/orders`);
    console.log(`📋 List orders: GET /api/orders/:orderId`);
    console.log(`📋 List orders: GET /api/orders/transaction/:transactionId`);
});
