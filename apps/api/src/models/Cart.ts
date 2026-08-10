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
    // Do NOT put unique/sparse on the path — null user on guest carts
    // collides under classic unique sparse indexes.
    user: { type: Schema.Types.ObjectId, ref: "User" },
    guestKey: { type: String },
    items: [itemSub],
  },
  { timestamps: true }
);

cartSchema.index(
  { user: 1 },
  {
    unique: true,
    name: "user_1_partial",
    partialFilterExpression: { user: { $exists: true, $type: "objectId" } },
  }
);
cartSchema.index(
  { guestKey: 1 },
  {
    unique: true,
    name: "guestKey_1_partial",
    partialFilterExpression: { guestKey: { $exists: true, $type: "string" } },
  }
);

export const Cart = model("Cart", cartSchema);

/** Drop legacy unique indexes that block multiple guest carts (user: null). */
export async function ensureCartIndexes() {
  const col = Cart.collection;
  try {
    const indexes = await col.indexes();
    for (const idx of indexes) {
      const name = idx.name;
      if (!name || name === "_id_") continue;
      // Old mongoose unique:true sparse indexes on path
      if (name === "user_1" || name === "guestKey_1") {
        await col.dropIndex(name);
        console.log("[cart] dropped legacy index", name);
      }
    }
  } catch (e: any) {
    console.warn("[cart] index cleanup:", e?.message ?? e);
  }
  await Cart.syncIndexes();
  // Guest docs must not store user:null (breaks uniqueness)
  const r = await Cart.updateMany({ user: null }, { $unset: { user: "" } });
  if (r.modifiedCount) console.log("[cart] unset null user on", r.modifiedCount, "docs");
}
