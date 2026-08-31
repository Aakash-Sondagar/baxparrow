import { Schema, model, Types } from "mongoose";
const addressSub = new Schema({
  firstName: String, lastName: String, address: String, city: String, pin: String,
}, { _id: false });
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: String,
  googleId: String,
  role: { type: String, enum: ["customer","wholesale","admin"], default: "customer" },
  addresses: [addressSub],
  resetTokenHash: { type: String },
  resetExpiresAt: { type: Date },
}, { timestamps: true });
export const User = model("User", userSchema);
export type UserDoc = { _id: Types.ObjectId; name: string; email: string; role: string; passwordHash?: string };
