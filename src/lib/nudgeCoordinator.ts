// src/lib/nudgeCoordinator.ts
//
// Shared mutual exclusion for the site's floating "nudge" bubbles (the
// reconstitution calculator's prompt, the chat widget's prompt, and any
// future one). Without this, each nudge runs its own independent timer and
// has no idea the other exists — they end up flashing on screen at the same
// moment, which reads as a bug rather than two separate features.
//
// This is deliberately a plain module-level singleton, not context or a
// store: both widgets are mounted once, client-side, in the same page, so a
// module-scoped variable is already shared between them for free — no
// provider wiring needed.

type Listener = () => void

let activeId: string | null = null
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((fn) => fn())
}

/** Try to become the one visible nudge. Returns false if another nudge
 *  already holds the slot — the caller should back off and retry, or skip
 *  this cycle. Calling with the id that already holds the slot is a no-op
 *  success (so re-claiming from the same widget never fails). */
export function claimNudgeSlot(id: string): boolean {
  if (activeId !== null && activeId !== id) return false
  activeId = id
  return true
}

/** Give up the slot. Safe to call even if this id doesn't hold it. */
export function releaseNudgeSlot(id: string) {
  if (activeId === id) {
    activeId = null
    notify()
  }
}

/** Optional: get notified when the slot frees up, to retry sooner than a
 *  fixed backoff would. Neither widget currently needs this — the backoff
 *  retry is simple enough — but it's here if a third nudge makes contention
 *  frequent enough to want it. */
export function subscribeNudgeSlot(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}