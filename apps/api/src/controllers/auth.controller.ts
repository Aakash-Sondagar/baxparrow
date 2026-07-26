import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signAccess, signRefresh } from "../utils/token.js";
export async function register(req: Request, res: Response) {
  const { name, email, password, role } = req.body;
  if (await User.findOne({ email })) return res.status(409).json({ error: "Email already registered" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role });
  const payload = { id: String(user._id), role: user.role };
  res.cookie("refresh", signRefresh(payload), { httpOnly: true, sameSite: "lax" });
  res.json({ accessToken: signAccess(payload), user: { id: user._id, name, email, role: user.role } });
}
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ error: "Invalid credentials" });
  const payload = { id: String(user._id), role: user.role };
  res.cookie("refresh", signRefresh(payload), { httpOnly: true, sameSite: "lax" });
  res.json({ accessToken: signAccess(payload), user: { id: user._id, name: user.name, email, role: user.role } });
}
export async function logout(_req: Request, res: Response) {
  res.clearCookie("refresh");
  res.json({ ok: true });
}
