import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Order } from "../models/Order.js";
import { signAccess, signRefresh } from "../utils/token.js";
import type { AuthReq } from "../middleware/auth.js";
import { sendWelcomeEmail } from "../services/mail.orders.js";

function session(user: { _id: unknown; name: string; email: string; role: string }) {
  const payload = { id: String(user._id), role: user.role };
  return {
    payload,
    body: {
      accessToken: signAccess(payload),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    },
  };
}

/** Claim guest orders that used this email so past checkouts show in account. */
async function claimGuestOrders(userId: string, email: string) {
  const e = email.trim().toLowerCase();
  if (!e) return;
  const esc = e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await Order.updateMany(
    {
      $and: [
        { $or: [{ user: null }, { user: { $exists: false } }] },
        { "address.email": { $regex: `^${esc}$`, $options: "i" } },
      ],
    },
    { $set: { user: userId } }
  );
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body;
  const emailNorm = String(email).trim().toLowerCase();
  if (await User.findOne({ email: emailNorm }))
    return res.status(409).json({ error: "Email already registered" });
  const passwordHash = await bcrypt.hash(password, 10);
  // Public signup always customer — never trust client role.
  const user = await User.create({
    name: String(name).trim(),
    email: emailNorm,
    passwordHash,
    role: "customer",
  });
  await claimGuestOrders(String(user._id), emailNorm);
  const { payload, body } = session(user);
  res.cookie("refresh", signRefresh(payload), { httpOnly: true, sameSite: "lax" });
  res.json(body);
  void sendWelcomeEmail(emailNorm, user.name).catch((err) =>
    console.error("[mail] welcome failed", emailNorm, err)
  );
}

export async function login(req: Request, res: Response) {
  const emailNorm = String(req.body.email).trim().toLowerCase();
  const { password } = req.body;
  const user = await User.findOne({ email: emailNorm });
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ error: "Invalid credentials" });
  if (user.role === "customer") await claimGuestOrders(String(user._id), emailNorm);
  const { payload, body } = session(user);
  res.cookie("refresh", signRefresh(payload), { httpOnly: true, sameSite: "lax" });
  res.json(body);
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie("refresh");
  res.json({ ok: true });
}

export async function me(req: AuthReq, res: Response) {
  const id = req.user?.id;
  const user = await User.findById(id).select("name email role").lean();
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
}
