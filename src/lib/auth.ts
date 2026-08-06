import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

export type UserRole = "admin" | "user";

export type SessionPayload = {
  userId: number;
  email: string;
  name: string;
  role: UserRole;
  sessionToken: string;
  isExpired?: boolean;
  subscriptionStatus?: string;
  isSuspended?: boolean;
};

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set.");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.userId === "number" &&
      typeof payload.email === "string" &&
      typeof payload.name === "string" &&
      (payload.role === "admin" || payload.role === "user") &&
      typeof payload.sessionToken === "string"
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        sessionToken: payload.sessionToken,
      };
    }
    return null;
  } catch {
    return null;
  }
}
