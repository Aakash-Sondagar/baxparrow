import { Schema, model } from "mongoose";
const categorySchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  image: String,
  parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
  order: { type: Number, default: 0 },
}, { timestamps: true });
export const Category = model("Category", categorySchema);
