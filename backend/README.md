# Affiliate E-Commerce Backend

Production-ready Node.js/Express backend for affiliate e-commerce platform with MongoDB.

## Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## Project Structure

```
backend/
├── models/              # MongoDB schemas
│   ├── User.js         # User model with affiliate fields
│   ├── Product.js      # Product catalog
│   ├── Order.js        # Order tracking
│   ├── Commission.js   # Commission records
│   └── PaymentBatch.js # Bulk payout management
├── routes/             # Express routes
├── controllers/        # Route handlers
├── middleware/         # Express middleware
├── services/           # Business logic
├── utils/              # Utilities & constants
├── config/             # Configuration
└── server.js           # Entry point
```

## Models Overview

### User
- Roles: customer, affiliate, admin
- Affiliate-specific: commission rate, earnings, bank details
- Security: password hashing, verification tokens

### Product
- Pricing, stock, SKU management
- Per-product affiliate commission override
- SEO fields, ratings, sales tracking

### Order
- Complete lifecycle tracking
- Affiliate referral: affiliateId + affiliateCode
- Commission storage in order document
- Payment tracking, refund management

### Commission
- Individual commission records per order
- Status workflow: pending → approved → scheduled → paid
- Immutable commission rate (saved at order time)
- Payment batch association

### PaymentBatch
- Groups commissions for bulk payout
- Multiple payout methods: wire, ACH, PayPal, check, crypto
- Status workflow with approval chain
- Admin audit trail

## Key Features

### Affiliate Referral Tracking
```javascript
// Orders capture referral at purchase time
const order = {
  affiliateId: "...",      // Affiliate who referred
  affiliateCode: "AFF-...", // Ref code used
  affiliateCommission: {
    commissionAmount: 50,
    commissionPercentage: 10,
    status: "pending"       // Approval workflow
  }
}
```

### Commission Workflow
1. **Pending**: Order placed, commission calculated
2. **Approved**: Admin reviews and approves (30-day hold)
3. **Scheduled**: Added to payment batch
4. **Paid**: Funds transferred to affiliate
5. **Refunded**: If order refunded, commission reversed

### Payment Processing
- Batch process: group commissions → create batch → approve → process payment
- Multiple payout methods for flexibility
- Audit trail for compliance

## Environment Variables

```
# Database
MONGODB_URI=mongodb://localhost:27017/affiliate-ecommerce

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Stripe
STRIPE_SECRET_KEY=sk_test_...

# Affiliate
DEFAULT_AFFILIATE_COMMISSION_RATE=10
COMMISSION_HOLDING_PERIOD=30
```

## Scripts

- `npm run dev`: Start with Nodemon (auto-restart)
- `npm start`: Start production server
- `npm test`: Run tests
- `npm run seed`: Seed database with sample data

## Dependencies

- **mongoose**: MongoDB ODM
- **express**: Web framework
- **jsonwebtoken**: JWT authentication
- **bcryptjs**: Password hashing
- **cors**: Cross-origin requests
- **helmet**: Security headers
- **morgan**: Request logging

## API Endpoints (Future)

```
Auth:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/verify-email
POST   /api/auth/forgot-password

Affiliate:
GET    /api/affiliate/dashboard
GET    /api/affiliate/commissions
GET    /api/affiliate/referrals
GET    /api/affiliate/referral-link
PUT    /api/affiliate/profile
GET    /api/affiliate/payouts
POST   /api/affiliate/payout-request

Admin:
GET    /api/admin/dashboard
GET    /api/admin/commissions
POST   /api/admin/payment-batches
GET    /api/admin/payment-batches/:id
```

## Development

- MongoDB running locally or via connection string
- Node.js v18+
- npm or yarn

## Production Deployment

- Ensure `NODE_ENV=production`
- Use strong JWT secrets
- Configure SSL/HTTPS
- Use production MongoDB cluster (MongoDB Atlas)
- Implement rate limiting
- Add request logging
- Use process manager (PM2)
