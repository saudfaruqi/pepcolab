// src/middleware.ts
//
// ── CRITICAL PATH FIX (Sep 2026) ────────────────────────────────────────────
// This file previously lived at src/lib/middleware.ts. Next.js only loads
// middleware from the project root (`middleware.ts`) or, in a `src/` layout,
// from `src/middleware.ts`. Anywhere else it is an ordinary unused module —
// so none of the logic below has ever executed in production.
//
// Three things were silently dead as a result:
//   1. The 301 from the legacy "/products/{name}-uae" URLs to the neutral
//      canonical slug. The August SEO migration moved every canonical and
//      every statically-generated param onto the neutral slug while the
//      redirect that was supposed to carry the accumulated ranking signal
//      across never fired. Both URLs stayed reachable and Google was left
//      choosing between them.
//   2. The `x-buyer-country` request header, so nothing server-side ever saw
//      a resolved country.
//   3. The `pepcolab_country` cookie, so countryContext.tsx always fell
//      through to a `/api/country` network round-trip on first visit.
//
// DELETE src/lib/middleware.ts after adding this file. Leaving both in place
// is harmless at runtime but guarantees someone edits the dead one again.
// ────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// AE sells and ships. GB is a recognised market for content, currency
// context and messaging, but has no catalogue and no checkout yet — see
// lib/pricing.ts (UK_CHECKOUT_LIVE) for the single switch that turns UK
// selling on. Keeping GB here rather than collapsing it to AE is what lets
// a UK visitor be told the truth ("not dispatching to the UK yet") instead
// of being silently relabelled as a UAE customer.
const SUPPORTED_COUNTRIES = new Set(['AE', 'GB'])

const DEFAULT_COUNTRY = 'AE'

/* ── MAINTENANCE MODE ─────────────────────────────────────────────────────
   Turned on with NEXT_PUBLIC_MAINTENANCE_MODE=on and off by removing it.
   No deploy is needed to flip it on Vercel — change the env var and
   redeploy, or set it and use an instant rollback-free redeploy.

   WHY THE 503 LIVES HERE AND NOT IN A PAGE
   A Next.js page cannot set an arbitrary HTTP status. A rewrite to a
   /maintenance route would serve the notice with a 200, and a 200 is what
   does the damage: Google would crawl every URL, see "Under maintenance"
   as that page's content, and start replacing the real content in its
   index. Returning 503 + Retry-After from middleware tells Google the
   outage is temporary and to come back, so rankings are held.

   WHAT DELIBERATELY STAYS LIVE
   The matcher at the bottom of this file already excludes /api, /_next and
   anything with a file extension, and that exclusion is load-bearing here:

     /api/webhook/strabl  A payment can complete while the site is down. If
                          that webhook 503s, the customer is charged and the
                          order is never created. This must never be gated.
     /api/cron/*          Scheduled email and affiliate-hold jobs.
     /api/newsletter      Backs the "tell me when it's back" box below.
     /robots.txt          Google must still be able to read it.
     /sitemap.xml         Same.

   Nobody can reach the checkout UI anyway, since every page is gated, so
   leaving the API surface up costs nothing and avoids losing a paid order.
   ───────────────────────────────────────────────────────────────────── */
const MAINTENANCE_ON = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'off'

/** Set this in the environment. Visiting /?preview=<key> grants access. */
const BYPASS_KEY = process.env.MAINTENANCE_BYPASS_KEY || ''
const BYPASS_COOKIE = 'pepcolab_preview'
const BYPASS_MAX_AGE = 60 * 60 * 24 * 7 // a week, matching the expected outage

/* Google re-checks after roughly this long. 24h is the right value for an
   outage measured in days. NOTE: beyond about a week of continuous 503,
   Google starts dropping pages from the index rather than holding them —
   if this is still on after a week, it needs a different approach. */
const RETRY_AFTER_SECONDS = 60 * 60 * 24

const SUPPORT_EMAIL = 'hello@pepcolab.com'

function maintenanceHtml(): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Back shortly — PepcoLab</title>
<meta name="robots" content="noindex" />
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:#0D0D0D;color:#fff;min-height:100vh;display:flex;align-items:center;
    justify-content:center;padding:24px;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
    -webkit-font-smoothing:antialiased}
  .w{max-width:460px;width:100%}
  .m{font-size:30px;font-weight:800;letter-spacing:-.03em;line-height:1.05;margin-bottom:40px}
  .m span{display:block;font-weight:400;font-size:26px}
  h1{font-size:23px;font-weight:700;letter-spacing:-.02em;margin-bottom:14px}
  p{font-size:15.5px;line-height:1.7;color:rgba(255,255,255,.62);margin-bottom:14px}
  a{color:#fff}
  form{display:flex;gap:8px;flex-wrap:wrap;margin-top:28px}
  input{flex:1 1 200px;min-width:0;min-height:48px;padding:0 16px;font-size:16px;
    color:#fff;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);
    border-radius:999px;outline:none;font-family:inherit}
  input::placeholder{color:rgba(255,255,255,.35)}
  button{min-height:48px;padding:0 24px;font-size:15px;font-weight:700;color:#0D0D0D;
    background:#fff;border:none;border-radius:999px;cursor:pointer;font-family:inherit}
  button:disabled{opacity:.6;cursor:default}
  .msg{font-size:14px;margin-top:12px;min-height:20px;color:rgba(255,255,255,.62)}
  .ok{color:#6FD39B}
  .foot{margin-top:44px;font-size:12.5px;color:rgba(255,255,255,.3);line-height:1.7}
</style></head><body>
<div class="w">
  <div class="m">Pepco<span>Lab.</span></div>
  <h1>We're making some changes</h1>
  <p>The site is briefly offline while we update it. Everything will be back shortly — orders already placed are unaffected and will ship as normal.</p>
  <p>Need something in the meantime? Email <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> and we'll answer today.</p>
  <form id="f" novalidate>
    <input id="e" type="email" inputmode="email" autocomplete="email" placeholder="your@email.com" aria-label="Email address" required />
    <button id="b" type="submit">Tell me when it's back</button>
  </form>
  <div class="msg" id="m" role="status" aria-live="polite"></div>
  <div class="foot">PepcoLab &middot; SEE BEE DEE LIMITED (England &amp; Wales, 17072052)<br />For research use only &middot; Not for human consumption</div>
</div>
<script>
(function(){
  var f=document.getElementById('f'),e=document.getElementById('e'),
      b=document.getElementById('b'),m=document.getElementById('m');
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var v=(e.value||'').trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){m.className='msg';m.textContent='That email doesn\u2019t look right.';return}
    b.disabled=true;m.className='msg';m.textContent='Sending\u2026';
    fetch('/api/newsletter',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:v})})
      .then(function(r){return r.json().catch(function(){return{}}).then(function(d){return{ok:r.ok,d:d}})})
      .then(function(res){
        if(!res.ok){b.disabled=false;m.className='msg';m.textContent=(res.d&&res.d.error)||'Could not save that just now.';return}
        m.className='msg ok';m.textContent='Done \u2014 we\u2019ll email you the moment it\u2019s back.';
        f.style.display='none';
      })
      .catch(function(){b.disabled=false;m.className='msg';m.textContent='Could not save that just now.'});
  });
})();
</script>
</body></html>`
}

// Legacy product URLs from before the neutral-slug migration.
const LEGACY_PRODUCT_UAE_RE = /^\/products\/([^/]+)-uae\/?$/i

// DISCONTINUED-SKU REDIRECTS LIVE IN next.config.js, NOT HERE.
//
// The previous version of this file kept its own DISCONTINUED_PRODUCT_REDIRECTS
// map, and 'glp-1-tera-5mg' appeared in BOTH that map and next.config.js —
// pointing at two different destinations. next.config.js `redirects()` are
// evaluated before middleware runs, so the middleware entry could never
// execute and the disagreement was invisible.
//
// One source of truth avoids that permanently: add any discontinued or
// renamed product slug to the `redirects()` array in next.config.js. It is
// also the cheaper place for them — those are handled at the edge without
// invoking this function at all.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 0. MAINTENANCE GATE — before everything else, so no redirect or cookie
  //    work happens for a visitor who is only going to get the notice.
  if (MAINTENANCE_ON) {
    const offered = request.nextUrl.searchParams.get('preview')

    // Granting the bypass: /?preview=<key> sets the cookie and bounces to
    // the clean URL, so the key never stays in the address bar, never lands
    // in analytics, and never gets shared by accident when someone copies
    // the page they are looking at.
    if (BYPASS_KEY && offered === BYPASS_KEY) {
      const clean = request.nextUrl.clone()
      clean.searchParams.delete('preview')
      const pass = NextResponse.redirect(clean)
      pass.cookies.set(BYPASS_COOKIE, BYPASS_KEY, {
        maxAge: BYPASS_MAX_AGE,
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
      })
      return pass
    }

    const holder = request.cookies.get(BYPASS_COOKIE)?.value
    const bypassed = Boolean(BYPASS_KEY) && holder === BYPASS_KEY

    if (!bypassed) {
      return new NextResponse(maintenanceHtml(), {
        status: 503,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Retry-After': String(RETRY_AFTER_SECONDS),
          // Never let a CDN or browser cache the notice — otherwise people
          // keep seeing it after the site is back.
          'Cache-Control': 'no-store, must-revalidate',
          // Belt and braces alongside the meta tag in the page.
          'X-Robots-Tag': 'noindex',
        },
      })
    }
    // Bypassed: fall through to the normal middleware below.
  }

  // 1. Legacy "-uae" slug -> neutral canonical slug. Single hop, 301.
  const legacyMatch = pathname.match(LEGACY_PRODUCT_UAE_RE)
  if (legacyMatch) {
    const url = request.nextUrl.clone()
    url.pathname = `/products/${legacyMatch[1]}`
    return NextResponse.redirect(url, 301)
  }

  // 2. Resolve the buyer country.
  //
  // `request.geo` was Vercel-Edge-specific and is gone in Next 15; the header
  // is the stable source. `geo` is kept only as a defensive fallback.
  const detected =
    request.headers.get('x-vercel-ip-country') ??
    (request as { geo?: { country?: string } }).geo?.country ??
    DEFAULT_COUNTRY

  const country = SUPPORTED_COUNTRIES.has(detected) ? detected : DEFAULT_COUNTRY

  // The header has to go on the OUTGOING REQUEST, not the response, for
  // Server Components to read it via headers() during the same render.
  // Setting it on the response only reaches the browser's network tab.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-buyer-country', country)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Not httpOnly on purpose: countryContext.tsx reads it synchronously via
  // document.cookie on first paint, which is what avoids both the price
  // flash and the /api/country round-trip.
  response.cookies.set('pepcolab_country', country, {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
  })

  return response
}

export const config = {
  // Excludes _next assets, the API surface, and static files with an
  // extension (images, PDFs, the video, robots.txt, sitemap.xml) so the
  // middleware doesn't run — and set a cookie — on every asset request.
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}