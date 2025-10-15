# Order Management Service

Manages orders created from successful payments.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Service
```bash
node index.js
```

The service runs on **port 4001** by default.

## 📡 API Endpoints

### POST `/orders`
Create a new order (called by payment service).

**Request:**
```json
{
  "transactionId": "MP123...",
  "conversationId": "abc123...",
  "transactionReference": "TXN123...",
  "thirdPartyReference": "ABC123",
  "amount": 200,
  "cart": [...],
  "customerPhone": "258845760448",
  "timestamp": "2025-10-09T12:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "ORD1234567890",
    "transactionId": "MP123...",
    "amount": 200,
    "status": "paid",
    "createdAt": "2025-10-09T12:00:00.000Z"
  }
}
```

### GET `/orders`
Get all orders.

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

### GET `/orders/:orderId`
Get a specific order by order ID.

### GET `/orders/transaction/:transactionId`
Get an order by M-Pesa transaction ID.

### GET `/health`
Health check endpoint.

## 🔄 How It Works

1. **Customer** makes a purchase on the frontend
2. **Payment Service** processes M-Pesa payment
3. **Payment Service** calls **Order Service** (this service)
4. **Order Service** creates and stores the order
5. Order can be retrieved by ID or transaction ID

## 🎯 Integration with Payment Service

The payment service automatically calls this service after successful payments:

```javascript
// Payment service (after payment success)
POST http://localhost:4001/orders
```

No manual intervention needed - it's automatic!

## 💾 Data Storage

Currently uses **in-memory storage** (array).

**For production:**
- Replace with a database (MongoDB, PostgreSQL, etc.)
- Add data persistence
- Implement data backup

## 🔧 Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4001` | Server port |

## 🛡️ Security

- Validate all incoming data
- Add authentication between services
- Rate limit endpoints
- Log all transactions

## 📊 Future Enhancements

- [ ] Database integration
- [ ] Order status updates
- [ ] Email notifications
- [ ] Order history for customers
- [ ] Admin dashboard
- [ ] Export orders to CSV
- [ ] Order search and filtering
- [ ] Webhook support

## 🔗 Related Services

- **Payment Service** (port 4000) - Processes M-Pesa payments
- **Frontend** (port 3000) - User interface

---

**Service Status:** Ready for development/testing

