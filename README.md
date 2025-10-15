# Simple E-Commerce Shop with M-Pesa Payment Integration

A modern e-commerce application with M-Pesa payment integration for Mozambique.

## 🏗️ Architecture

```
sample/
├── client/              # Next.js frontend
│   ├── app/            # App router pages
│   │   └── page.tsx   # Main shop page
│   └── lib/
│       └── api.ts      # API client
│
└── payment/            # Express.js payment service
    ├── index.js        # Payment server
    └── .env            # Configuration (create this)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- M-Pesa developer account
- Bearer token from M-Pesa portal

### Installation

**1. Install Backend Dependencies:**
```bash
cd payment
npm install
```

**2. Install Frontend Dependencies:**
```bash
cd client
npm install
```

**3. Configure M-Pesa:**

Create `payment/.env`:
```env
MPESA_BEARER_TOKEN=your_bearer_token_here
MPESA_SERVICE_PROVIDER_CODE=171717
MPESA_API_HOST=api.sandbox.vm.co.mz
PORT=4000
```

**4. Start the Services:**

Terminal 1 (Payment Service):
```bash
cd payment
node index.js
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

**5. Open the App:**
```
http://localhost:3000
```

## 🎯 Features

### Frontend (Next.js)
- ✨ Modern, responsive UI
- 🛒 Shopping cart functionality
- ➕ Add/remove items
- 🔢 Quantity management
- 💳 Integrated checkout
- 📱 Mobile-friendly design

### Backend (Express.js)
- 🔐 Secure M-Pesa integration
- 📞 Auto phone number formatting
- ✅ Input validation
- 🚀 Fast payment processing
- 📊 Detailed logging
- 💚 Health checks

## 📡 API Integration

The frontend communicates with the backend through a clean API:

```typescript
// lib/api.ts
import { processPayment } from '@/lib/api';

const result = await processPayment({
  cart: [...],
  total: 100,
  customerPhone: '845760448' // Optional
});
```

## 🔧 Configuration

### Environment Variables

**Payment Service (`payment/.env`):**
```env
MPESA_BEARER_TOKEN=...        # Get from M-Pesa portal
MPESA_SERVICE_PROVIDER_CODE=  # Your merchant code
MPESA_API_HOST=               # sandbox or production
PORT=4000                      # Server port
```

**Frontend (`client/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 🏃 Development

### Run Payment Service
```bash
cd payment
node index.js
```

### Run Frontend Dev Server
```bash
cd client
npm run dev
```

### Build for Production
```bash
cd client
npm run build
npm start
```

## 🌍 Production Deployment

### Backend
1. Deploy to a Node.js hosting service (Heroku, Railway, etc.)
2. Set environment variables in hosting platform
3. Change `MPESA_API_HOST` to production (`api.vm.co.mz`)
4. Get production bearer token from M-Pesa
5. Enable HTTPS

### Frontend
1. Deploy to Vercel/Netlify
2. Set `NEXT_PUBLIC_API_URL` to your backend URL
3. Ensure CORS is configured for your frontend domain

## 📚 Documentation

- **Payment Service**: See `payment/README.md`
- **M-Pesa Setup**: See `payment/SIMPLE_SETUP.md`
- **API Reference**: Check `client/lib/api.ts`

## 🛡️ Security Best Practices

✅ Never commit `.env` files  
✅ Use environment variables in production  
✅ Enable HTTPS in production  
✅ Validate all user inputs  
✅ Rotate bearer tokens regularly  
✅ Implement rate limiting  
✅ Add request logging  
✅ Monitor for suspicious activity  

## 🐛 Troubleshooting

**Frontend can't reach backend:**
- Check both services are running
- Verify ports (3000 for frontend, 4000 for backend)
- Check CORS configuration

**Payment fails:**
- Verify bearer token in `.env`
- Check M-Pesa credentials
- Review backend logs
- Ensure service provider code is correct

**No response from M-Pesa:**
- Check internet connection
- Verify API host (sandbox vs production)
- Review M-Pesa API status

## 📦 Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Hooks

**Backend:**
- Node.js
- Express.js
- Axios
- dotenv

**Payment:**
- M-Pesa API (Mozambique)
- Bearer token authentication

## 🎨 Customization

### Add More Products

Edit `client/app/page.tsx`:
```typescript
const products: Product[] = [
  {
    id: 7,
    name: 'New Product',
    price: 99.99,
    image: 'https://...',
    description: 'Product description'
  },
  // ...
];
```

### Modify Payment Logic

Edit `payment/index.js` in the payment endpoint section.

### Add Database

Uncomment the database section in `payment/index.js`:
```javascript
// TODO: Save transaction to database here
// await saveTransaction(responseData);
```

## ✅ What's Been Done

✅ Clean, organized code structure  
✅ M-Pesa payment integration  
✅ Shopping cart functionality  
✅ Responsive UI design  
✅ Error handling  
✅ Input validation  
✅ Detailed logging  
✅ Health check endpoints  
✅ TypeScript types for API  
✅ Professional documentation  

## 🚀 Next Steps

- [ ] Add database integration
- [ ] Implement user authentication
- [ ] Add order history
- [ ] Email notifications
- [ ] Payment webhooks for status updates
- [ ] Product search and filtering
- [ ] Admin dashboard

---

**Made with ❤️ for Mozambique e-commerce**

