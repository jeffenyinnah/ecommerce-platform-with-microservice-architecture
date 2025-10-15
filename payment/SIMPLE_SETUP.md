# ✅ Simple M-Pesa Setup (Working Method)

## 🎯 Key Changes Made:

1. **Added port `:18352`** to the endpoint (this was missing!)
2. **Using pre-generated bearer token** instead of generating it
3. **Phone number auto-formatting** (adds 258 if missing)
4. **Better error handling**

---

## 📝 Setup Steps:

### Step 1: Update your `.env` file

```env
MPESA_BEARER_TOKEN=your_bearer_token_here
```

That's it! Just one line needed.

---

### Step 2: Get your Bearer Token

**Option A: From M-Pesa Developer Portal**
1. Go to: https://developer.mpesa.vm.co.mz
2. Login
3. Go to your app
4. Copy the **Bearer Token** (the long encrypted string)

**Option B: Generate it yourself (if portal doesn't show it)**
You'll need to encrypt your API key with their public key. But the portal usually provides a ready-made token.

---

### Step 3: Restart your server

```bash
node index.js
```

You should see:
```
✅ M-Pesa credentials loaded
   Bearer Token length: XXX characters
   Service Provider Code: 171717
   API Host: api.sandbox.vm.co.mz
   Environment: SANDBOX
```

---

### Step 4: Test it!

```bash
curl -X POST http://localhost:4000/payment \
  -H "Content-Type: application/json" \
  -d '{
    "cart": [{"name": "Test", "price": 10}],
    "total": 10,
    "customerPhone": "845760448"
  }'
```

**Note:** Phone can be with or without `258` - it auto-formats!
- `"845760448"` → converts to `"258845760448"` ✅
- `"258845760448"` → stays as is ✅

---

## 🔑 Key Differences from Before:

| Before | Now (Working) |
|--------|---------------|
| `https://api.sandbox.vm.co.mz/ipg/v1x/c2bPayment/singleStage/` | `https://api.sandbox.vm.co.mz:18352/ipg/v1x/c2bPayment/singleStage/` |
| Generated token from public key | Use pre-generated bearer token |
| Required 3 env variables | Only 1 env variable needed |
| Manual phone formatting | Auto-formats phone numbers |

The **missing port `:18352`** was the main issue!

---

## 📱 Request Format:

```javascript
{
  "cart": [...],           // Array of items (optional)
  "total": 100,           // Required: amount in MZN
  "customerPhone": "..."  // Required: phone number
}
```

---

## ✅ Success Response:

```javascript
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "transactionId": "MP230101...",
    "conversationId": "a1b2c3d4...",
    "responseCode": "INS-0",
    "responseDesc": "Request processed successfully",
    "transactionReference": "TXN1696867200000...",
    "thirdPartyReference": "ABCD123456",
    "amount": 100,
    "cart": [...]
  }
}
```

---

## 🎉 That's it!

Much simpler than before! Just one environment variable and it works.

