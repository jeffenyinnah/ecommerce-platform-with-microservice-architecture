import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticateService } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = 4002;


// MIDDLEWARE
// ============================================================================
app.use(express.json());
app.use(cors());

/**
 * Send email notification
 * Protected by service-to-service authentication
 */

const apiRouter = express.Router()
apiRouter.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Email Service',
        timestamp: new Date().toISOString()
    });
});
apiRouter.post('/send-email', authenticateService, (req,res)=>{
    const useId = "1234"
    const {cart,total,customerPhone}=req.body;
    const orderItems = cart.map(item=>`${item.name} - ${item.quantity} - ${item.price} MZN`).join('\n');
    console.log(`Sending email to ${useId} whose phone number is ${customerPhone} with order items ${orderItems} and total ${total}`);
    res.status(200).json({message:'Email sent successfully'});
});

app.use('/api', apiRouter)

app.listen(PORT,()=>{
    console.log(`Email server is running on port ${PORT}`);
    console.log(`💚 Health check: GET /api/health\n`);
    console.log(`📱 Send email: POST /api/send-email`);
});
