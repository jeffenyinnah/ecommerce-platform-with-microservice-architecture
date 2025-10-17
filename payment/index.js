import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { authenticateToken } from './middleware/auth.js';

// ============================================================================
// CONFIGURATION
// ============================================================================
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// M-Pesa Configuration
const MPESA_CONFIG = {
    apiHost: process.env.MPESA_API_HOST || 'api.sandbox.vm.co.mz',
    bearerToken: process.env.MPESA_BEARER_TOKEN || '',
    serviceProviderCode: process.env.MPESA_SERVICE_PROVIDER_CODE || '171717',
    defaultPhone: '258845760448' // Default test phone number
};

// Service URLs
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:4001';
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:4002';
// ============================================================================
// MIDDLEWARE
// ============================================================================
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true
}));

// ============================================================================
// STARTUP VALIDATION
// ============================================================================
console.log('\n🔍 M-Pesa Payment Service Starting...');
if (!MPESA_CONFIG.bearerToken) {
    console.error('❌ ERROR: MPESA_BEARER_TOKEN not configured in .env file\n');
} else {
    console.log('✅ Configuration loaded successfully');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format phone number to Mozambique format (258XXXXXXXXX)
 */
function formatPhoneNumber(phone) {
    return phone.startsWith('258') ? phone : `258${phone}`;
}

/**
 * Generate unique transaction reference
 */
function generateTransactionRef() {
    return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

/**
 * Generate unique third party reference
 */
function generateThirdPartyRef() {
    return Math.random().toString(36).substring(2, 12).toUpperCase();
}

// ============================================================================
// ORDER SERVICE INTEGRATION
// ============================================================================

/**
 * Send order to order service after successful payment
 * @param {Object} orderData - Order information
 * @returns {Promise<Object>} Order creation result
 */
async function createOrder(orderData) {
    try {
        console.log('📦 Sending order to order service...');
        
        const response = await axios.post(`${ORDER_SERVICE_URL}/orders`, orderData, {
            headers: {
                'x-api-key': process.env.SERVICE_API_KEY // Service-to-service authentication
            },
            timeout: 5000
        });

        console.log(`✅ Order created: ${response.data.data?.orderId}`);
        return {
            success: true,
            data: response.data.data
        };
    } catch (error) {
        console.error('⚠️  Failed to create order:', error.message);
        // Don't fail the payment if order service is down
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Send email notification after successful order
 * @param {Array} cart - Cart items
 * @param {number} total - Total amount
 * @param {string} customerPhone - Customer phone number
 * @returns {Promise<Object>} Email result
 */
async function sendEmail(cart, total, customerPhone) {
    try {
        console.log('📧 Sending email notification...');
        
        const response = await axios.post(`${EMAIL_SERVICE_URL}/send-email`, {
            cart,
            total,
            customerPhone
        }, {
            headers: {
                'x-api-key': process.env.SERVICE_API_KEY // Service-to-service authentication
            },
            timeout: 5000
        });

        console.log('✅ Email sent successfully');
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('⚠️  Failed to send email:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================================================
// M-PESA API INTEGRATION
// ============================================================================

/**
 * Process M-Pesa C2B payment
 * @param {number} amount - Amount to charge
 * @param {string} phoneNumber - Customer phone number
 * @param {string} transactionRef - Unique transaction reference
 * @param {string} thirdPartyRef - Business reference
 * @returns {Promise<Object>} Payment result
 */
async function processMpesaPayment(amount, phoneNumber, transactionRef, thirdPartyRef) {
    const endpoint = `https://${MPESA_CONFIG.apiHost}:18352/ipg/v1x/c2bPayment/singleStage/`;
    
    const payload = {
        input_TransactionReference: transactionRef,
        input_CustomerMSISDN: formatPhoneNumber(phoneNumber),
        input_Amount: amount.toString(),
        input_ThirdPartyReference: thirdPartyRef,
        input_ServiceProviderCode: MPESA_CONFIG.serviceProviderCode
    };

    try {
        console.log('🚀 Initiating M-Pesa payment:', { amount, phone: payload.input_CustomerMSISDN });
        
        const response = await axios.post(endpoint, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'developer.mpesa.vm.co.mz',
                'Authorization': `Bearer ${MPESA_CONFIG.bearerToken}`
            },
            timeout: 30000
        });

        console.log('✅ Payment successful:', response.data.output_ResponseDesc);
        
        return {
            success: true,
            statusCode: response.status,
            data: response.data
        };
    } catch (error) {
        console.error('❌ Payment failed:', error.response?.data || error.message);
        
        return {
            success: false,
            statusCode: error.response?.status || 500,
            error: error.response?.data || error.message
        };
    }
}

// ============================================================================
// API ROUTES
// ============================================================================

const apiRouter = express.Router()
/**
 * Health check endpoint
 */
apiRouter.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'M-Pesa Payment Gateway',
        timestamp: new Date().toISOString()
    });
});

/**
 * Payment processing endpoint
 * Protected by user authentication
 */
apiRouter.post('/payment', authenticateToken, async (req, res) => {
    // ⏱️ Start timing
    const startTime = Date.now();
    const timings = {};
    
    console.log('\n📨 New payment request received');
    
    try {
        const { cart, total, customerPhone } = req.body;

        // Validate total amount
        if (!total || total <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing total amount'
            });
        }

        // Use provided phone or default test phone
        const phone = customerPhone || MPESA_CONFIG.defaultPhone;
        
        console.log(`💳 Processing: ${total} MZN, ${cart?.length || 0} items`);

        // Generate unique references
        const transactionRef = generateTransactionRef();
        const thirdPartyRef = generateThirdPartyRef();

        // ⏱️ Time M-Pesa payment
        const paymentStart = Date.now();
        const result = await processMpesaPayment(total, phone, transactionRef, thirdPartyRef);
        timings.mpesaPayment = Date.now() - paymentStart;

        if (result.success && result.statusCode === 201) {
            // Payment successful
            const responseData = {
                success: true,
                message: 'Payment processed successfully',
                data: {
                    transactionId: result.data.output_TransactionID,
                    conversationId: result.data.output_ConversationID,
                    responseCode: result.data.output_ResponseCode,
                    responseDesc: result.data.output_ResponseDesc,
                    transactionReference: transactionRef,
                    thirdPartyReference: thirdPartyRef,
                    amount: total,
                    cart: cart
                }
            };

            // ⏱️ Time order creation
            const orderStart = Date.now();
            const orderResult = await createOrder({
                userId: req.user.userId, // Add user ID from authenticated token
                transactionId: result.data.output_TransactionID,
                conversationId: result.data.output_ConversationID,
                transactionReference: transactionRef,
                thirdPartyReference: thirdPartyRef,
                amount: total,
                cart: cart,
                customerPhone: phone,
                timestamp: new Date().toISOString()
            });
            timings.orderCreation = Date.now() - orderStart;

            // Include order ID in response if order was created
            if (orderResult.success) {
                responseData.data.orderId = orderResult.data.orderId;
            }

            // ⏱️ Time email sending
            const emailStart = Date.now();
            const emailResult = await sendEmail(cart, total, phone);
            timings.emailSending = Date.now() - emailStart;

            // ⏱️ Calculate total time
            timings.total = Date.now() - startTime;

            // Convert to seconds
            const timingsInSeconds = {
                mpesaPayment: (timings.mpesaPayment / 1000).toFixed(2),
                orderCreation: (timings.orderCreation / 1000).toFixed(2),
                emailSending: (timings.emailSending / 1000).toFixed(2),
                total: (timings.total / 1000).toFixed(2)
            };

            // Add timing information to response
            responseData.data.performance = {
                mpesaPayment: `${timingsInSeconds.mpesaPayment}s`,
                orderCreation: `${timingsInSeconds.orderCreation}s`,
                emailSending: `${timingsInSeconds.emailSending}s`,
                total: `${timingsInSeconds.total}s`
            };

            console.log('\n⏱️  Performance Metrics:');
            console.log(`   M-Pesa Payment: ${timingsInSeconds.mpesaPayment}s`);
            console.log(`   Order Creation: ${timingsInSeconds.orderCreation}s`);
            console.log(`   Email Sending: ${timingsInSeconds.emailSending}s`);
            console.log(`   Total Time: ${timingsInSeconds.total}s\n`);

            return res.status(200).json(responseData);
        } else {
            // Payment failed
            return res.status(result.statusCode || 500).json({
                success: false,
                message: 'Payment failed',
                error: result.error
            });
        }

    } catch (error) {
        console.error('❌ Server error:', error.message);
        
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

app.use('/api', apiRouter)
// ============================================================================
// START SERVER
// ============================================================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📱 M-Pesa endpoint: POST /api/payment`);
    console.log(`💚 Health check: GET /api/health\n`);
});
