import { Schema, model } from "mongoose";
const productSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  sku: { type: String, required: true, unique: true },
  category: { type: String, required: true, index: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  images: [String],
  colors: [String],
  sizes: [String],
  bulkPrice: Number,
  moq: Number,
  status: { type: String, enum: ["active","draft"], default: "active" },
}, { timestamps: true });
productSchema.index({ name: "text", description: "text" });
export const Product = model("Product", productSchema);
