# M-Pesa Payment Gateway Service

A clean, simple Express.js service for processing M-Pesa payments in Mozambique.

## 📁 Project Structure

```
payment/
├── index.js          # Main server file
├── .env              # Environment variables (create this)
├── package.json      # Dependencies
└── README.md         # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file:

```env
MPESA_BEARER_TOKEN=your_bearer_token_here
MPESA_SERVICE_PROVIDER_CODE=171717
MPESA_API_HOST=api.sandbox.vm.co.mz
PORT=4000
```

### 3. Get Your Bearer Token

1. Visit: https://developer.mpesa.vm.co.mz
2. Login and navigate to your app
3. Copy the Bearer Token
4. Paste it in your `.env` file

### 4. Start the Server

```bash
node index.js
```

## 📡 API Endpoints

### POST `/payment`

Process a payment through M-Pesa.

**Request:**
```json
{
  "cart": [
    {
      "id": 1,
      "name": "Product Name",
      "price": 100,
      "quantity": 2
    }
  ],
  "total": 200,
  "customerPhone": "845760448"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "transactionId": "MP230101...",
    "conversationId": "abc123...",
    "responseCode": "INS-0",
    "responseDesc": "Request processed successfully",
    "amount": 200
  }
}
```

### GET `/health`

Check service health.

**Response:**
```json
{
  "status": "ok",
  "service": "M-Pesa Payment Gateway",
  "timestamp": "2025-10-09T12:00:00.000Z"
}
```

## 🔧 Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `MPESA_BEARER_TOKEN` | M-Pesa API bearer token | Required |
| `MPESA_SERVICE_PROVIDER_CODE` | Your merchant code | `171717` |
| `MPESA_API_HOST` | API host (sandbox/production) | `api.sandbox.vm.co.mz` |
| `PORT` | Server port | `4000` |

## 📱 Phone Number Format

Phone numbers are automatically formatted:
- Input: `845760448` → Output: `258845760448`
- Input: `258845760448` → Output: `258845760448`

## 🔒 Security

- Never commit `.env` file (already in `.gitignore`)
- Use HTTPS in production
- Rotate bearer tokens regularly
- Validate all inputs

## 🌍 Production Deployment

1. Change `MPESA_API_HOST` to `api.vm.co.mz`
2. Get production bearer token from M-Pesa
3. Use environment variables (not `.env` file)
4. Enable HTTPS
5. Add rate limiting
6. Implement logging and monitoring

## 📝 Code Structure

The code is organized into clear sections:

1. **Configuration** - Environment and settings
2. **Middleware** - Express middleware setup
3. **Startup Validation** - Check configuration on startup
4. **Helper Functions** - Utility functions
5. **M-Pesa Integration** - Payment processing logic
6. **API Routes** - Endpoint definitions
7. **Server Start** - Initialize server

## 🐛 Troubleshooting

**No logs in terminal:**
- Check if server is running
- Verify CORS is not blocking requests

**403 Forbidden:**
- Check bearer token is correct
- Verify service provider code matches your account

**Payment timeout:**
- Default timeout is 30 seconds
- Customer should check their phone for M-Pesa prompt

## 📚 Resources

- M-Pesa Developer Portal: https://developer.mpesa.vm.co.mz
- Documentation: Check developer portal for latest API docs

## ✅ Features

- ✨ Clean, organized code
- 🔐 Secure bearer token authentication
- 📞 Auto phone number formatting
- 🚀 Fast response times (30s timeout)
- 📊 Detailed logging
- 🛡️ Input validation
- 🔄 Unique transaction references
- 💚 Health check endpoint

---

**Need help?** Check the M-Pesa developer portal or review the code comments.

