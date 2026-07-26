import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
export const signAccess = (u: { id: string; role: string }) => jwt.sign(u, env.jwtAccess, { expiresIn: "15m" });
export const signRefresh = (u: { id: string; role: string }) => jwt.sign(u, env.jwtRefresh, { expiresIn: "30d" });
