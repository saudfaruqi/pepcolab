// lib/shopifyClient.ts
export async function shopifyClientFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  buyerCountry?: string
): Promise<T> {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables, buyerCountry }),
  })
  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(json.errors[0].message)
  }
  return json.data as T
}