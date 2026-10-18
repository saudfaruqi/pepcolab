// src/lib/metaCapi.ts
//
// Server half of Meta tracking: the Conversions API. Sends the same Lead
// event the browser Pixel sends, with the same event_id, so Meta counts it
// once — and still receives it when the browser copy is lost to an ad
// blocker or iOS tracking protection.
//
// Only called when the visitor gave marketing consent (the lead form sends
// that flag). Personal data is SHA-256 hashed before it leaves the server,
// as Meta requires. Silently does nothing when META_CAPI_TOKEN or the Pixel
// id is not configured, so the site works before the ad account exists.
//
// ENV: NEXT_PUBLIC_META_PIXEL_ID, META_CAPI_TOKEN,
//      META_TEST_EVENT_CODE (optional — only while testing in Events Manager)
import crypto from 'crypto'

const GRAPH_VERSION = 'v21.0'

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export interface CapiEvent {
  eventName: 'Lead' | 'PageView'
  eventId: string
  eventSourceUrl: string
  email?: string
  clientIp?: string
  userAgent?: string
  fbp?: string
  fbc?: string
  customData?: Record<string, string | number>
}

export async function sendMetaEvent(ev: CapiEvent): Promise<boolean> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const token = process.env.META_CAPI_TOKEN
  if (!pixelId || !token) return false

  const userData: Record<string, unknown> = {}
  if (ev.email) userData.em = [sha256(ev.email)]
  if (ev.clientIp) userData.client_ip_address = ev.clientIp
  if (ev.userAgent) userData.client_user_agent = ev.userAgent
  if (ev.fbp) userData.fbp = ev.fbp
  if (ev.fbc) userData.fbc = ev.fbc

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: ev.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: ev.eventId,
        action_source: 'website',
        event_source_url: ev.eventSourceUrl,
        user_data: userData,
        custom_data: ev.customData ?? {},
      },
    ],
  }
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(token)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )
    if (!res.ok) {
      console.error('[metaCapi] Meta rejected event:', res.status, (await res.text()).slice(0, 300))
      return false
    }
    return true
  } catch (err) {
    console.error('[metaCapi] Failed to send event:', err)
    return false
  }
}
