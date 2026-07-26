import { Schema, model, Types } from "mongoose";
import { NOTIFICATION_TYPES } from "@baxparrow/shared";

const notificationSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    href: { type: String },
    meta: { type: Schema.Types.Mixed },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, readAt: 1 });

export const Notification = model("Notification", notificationSchema);
