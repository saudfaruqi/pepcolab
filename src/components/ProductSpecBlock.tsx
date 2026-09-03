// src/components/ProductSpecBlock.tsx
//
// The shared specification / storage / documentation / supply block that
// appears on every product page.
//
// WHY THIS EXISTS
// Until now this ~120-word block was pasted into all 37 Shopify product
// DESCRIPTIONS. Identical text, 37 times, inside the field a crawler reads as
// the page's primary content. To Google that is 37 near-duplicate pages, and
// it suppresses all of them — including the ones that should rank easily on
// their own compound name.
//
// Rendering it from here instead means the information still appears on every
// page (customers genuinely want it), but exactly once in the template rather
// than 37 times in indexed body copy. The description field now carries only
// what is unique to each compound.
//
// It also means the testing claim, the dispatch markets and the research-use
// statement live in ONE place. Those three were the exact lines that had
// drifted out of sync across the catalogue — descriptions still said
// "manufacturer's certificate" and "across the UAE and UK" long after the
// site's marketing had moved on. That cannot happen again from here.

const TESTING_LAB = 'Freedom Diagnostics'

interface Props {
  /** Storage line for this compound — comes from the product data. */
  storage?: string
  /** Formats this compound ships in, e.g. "Pen, Vial". */
  format?: string
  /** Presentation, e.g. "10mg, 20mg". */
  presentation?: string
}

const LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  color: 'rgba(13,13,13,.4)',
  marginBottom: 8,
}

const BODY: React.CSSProperties = {
  fontSize: 13.5,
  lineHeight: 1.75,
  color: 'rgba(13,13,13,.65)',
  margin: 0,
}

const SECTION: React.CSSProperties = {
  padding: '16px 0',
  borderTop: '1px solid rgba(13,13,13,.08)',
}

export default function ProductSpecBlock({ storage, format, presentation }: Props) {
  return (
    <div style={{ marginTop: 24 }}>
      {(format || presentation) && (
        <div style={SECTION}>
          <div style={LABEL}>Supply</div>
          <p style={BODY}>
            {format && <>Available in {format.toLowerCase()} format{format.includes(',') ? 's' : ''}. </>}
            {presentation && <>Presentation: {presentation}. </>}
            Held in stock and dispatched from PepcoLab inventory in temperature-controlled
            packaging across the United Arab Emirates. United Kingdom dispatch is in
            preparation.
          </p>
        </div>
      )}

      {storage && (
        <div style={SECTION}>
          <div style={LABEL}>Storage &amp; handling</div>
          <p style={BODY}>{storage}</p>
        </div>
      )}

      <div style={SECTION}>
        <div style={LABEL}>Documentation</div>
        <p style={BODY}>
          Every batch is tested by {TESTING_LAB}, an independent third-party laboratory.
          The certificate of analysis reports identity, purity by HPLC, the method used and
          the test date, and is matched to the specific lot number printed on the unit you
          receive — not a generic reference document. Certificates are published and
          searchable by lot number in the{' '}
          <a href="/certificates" style={{ color: '#0D0D0D', fontWeight: 600 }}>
            certificate library
          </a>
          .
        </p>
      </div>

      <div style={SECTION}>
        <p style={{ ...BODY, fontSize: 12.5, color: 'rgba(13,13,13,.45)' }}>
          For laboratory research use only. Not for human consumption, therapeutic use,
          diagnostic procedures or veterinary applications. PepcoLab does not provide dosing,
          administration or protocol guidance.
        </p>
      </div>
    </div>
  )
}