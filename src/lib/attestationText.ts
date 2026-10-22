// src/lib/attestationText.ts
// The checkout research attestation wording (brief A10). Client-safe — used
// by the checkout box (components/CheckoutAttestation.tsx) and re-exported by
// lib/attestation.ts for the server, so the text shown is the text recorded.

export const ATTESTATION_TEXT =
  'I confirm I am 18 or over and that I am buying these materials for in-vitro laboratory research only. They will not be used in or on humans or animals.'

/** Version tag stored with each attestation; bump if ATTESTATION_TEXT changes. */
export const ATTESTATION_VERSION = 'research-v1'
