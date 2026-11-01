// Server-only password hashing using Node's scrypt.
// Lightweight, no extra deps, fine for a kids app.
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const test = scryptSync(password, salt, 64)
  const real = Buffer.from(hash, 'hex')
  if (test.length !== real.length) return false
  return timingSafeEqual(test, real)
}

// 4-digit parent PIN — same algo, shorter input.
export const hashPin = hashPassword
export const verifyPin = verifyPassword
