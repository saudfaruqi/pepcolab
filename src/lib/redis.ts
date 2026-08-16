// src/lib/redis.ts
//
// Vercel KV was sunset — it's now the "Upstash" integration under Vercel's
// Marketplace (Storage tab → Upstash → Redis product). That integration
// injects credentials as env vars, but the exact names vary by how it was
// set up: some show as KV_REST_API_URL/KV_REST_API_TOKEN (kept for
// backward compat with old Vercel KV code), others as
// UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN. Checking both rather
// than guessing which one your integration used.
//
// orderStore.ts and the newsletter route both import `redis` from here —
// this is the only file that should need to change if you ever swap
// providers again.
import { Redis } from '@upstash/redis'

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

if (!url || !token) {
  console.warn(
    '[redis] No Redis credentials found (checked KV_REST_API_URL/TOKEN and UPSTASH_REDIS_REST_URL/TOKEN). ' +
    'Connect the Upstash integration in Vercel → Storage, then redeploy.'
  )
}

export const redis = new Redis({
  url: url || '',
  token: token || '',
})