import { Schema, model } from "mongoose";

const itemSub = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    color: String,
    size: String,
    qty: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", unique: true, sparse: true },
    guestKey: { type: String, unique: true, sparse: true },
    items: [itemSub],
  },
  { timestamps: true }
);

export const Cart = model("Cart", cartSchema);
