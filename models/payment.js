const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true },
    status: { 
      type: String, 
      enum: ['initiated', 'validated', 'refunded'], 
      default: 'initiated', 
      required: true 
    },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String },
    amount: { type: Number, required: true },
    currency: { 
      type: String, 
      enum: ['BDT', 'USD'], // Add more currencies if needed 
      required: true 
    },
    refundAmount: { type: Number, default: 0 },
    refundDate: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, // Additional info
  },
  { timestamps: true } // Auto-creates `createdAt` and `updatedAt`
);

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
