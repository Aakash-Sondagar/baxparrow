import { Schema, model } from "mongoose";
const lineSub = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product" },
  name: String, color: String, size: String, qty: Number, price: Number,
}, { _id: false });
const orderSchema = new Schema({
  orderNo: { type: String, required: true, unique: true },
  user: { type: Schema.Types.ObjectId, ref: "User" },
  items: [lineSub],
  amounts: { subtotal: Number, shipping: Number, gst: Number, total: Number },
  address: Schema.Types.Mixed,
  payment: {
    razorpayOrderId: String, razorpayPaymentId: String,
    status: { type: String, enum: ["pending","paid","failed"], default: "pending" },
  },
  shipment: { shiprocketId: String, awb: String, courier: String },
  status: { type: String, enum: ["pending","processing","shipped","delivered"], default: "pending" },
  timeline: [{ status: String, at: Date, note: String }],
}, { timestamps: true });
export const Order = model("Order", orderSchema);
