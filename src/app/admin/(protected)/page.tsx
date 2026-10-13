// src/app/admin/(protected)/page.tsx
import Link from 'next/link'
import { listAllOrders } from '@/lib/orderStore'
import { getProducts } from '@/lib/shopify'
import OrdersTable, { type CatalogueVariant } from './OrdersTable'

export const dynamic = 'force-dynamic' // always fresh — this is an admin dashboard, never cache order data

// The variant list for the "Change item" picker. Loaded server-side so the
// browser never needs a Shopify token. A catalogue failure only disables the
// picker — the orders list must still load.
async function loadCatalogueVariants(): Promise<CatalogueVariant[]> {
  try {
    const products = (await getProducts(250, 'AE')) as any[]
    const out: CatalogueVariant[] = []
    for (const p of products) {
      for (const v of p.variants || []) {
        const price = Number(v.price)
        if (!Number.isFinite(price) || price <= 0) continue
        out.push({
          variantId: String(v.id),
          productTitle: String(p.title),
          variantTitle: String(v.title),
          price,
          available: Boolean(v.availableForSale),
        })
      }
    }
    return out.sort((a, b) => a.productTitle.localeCompare(b.productTitle) || a.price - b.price)
  } catch (err) {
    console.error('[admin] Could not load catalogue for the Change item picker:', err)
    return []
  }
}

const PAGE_SIZE = 200

// ?show=N loads the newest N orders (in steps of PAGE_SIZE). Every status is
// listed — paid, awaiting payment, failed, abandoned, refunded — and the
// table filters them. Nothing is capped at a fixed number any more.
export default async function AdminOrdersPage({ searchParams }: { searchParams?: { show?: string } }) {
  const requested = Number(searchParams?.show)
  const show = Number.isFinite(requested) && requested > 0 ? Math.min(Math.ceil(requested / PAGE_SIZE) * PAGE_SIZE, 5000) : PAGE_SIZE
  const [{ orders, total }, catalogue] = await Promise.all([listAllOrders(show, 0), loadCatalogueVariants()])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[#0D0D0D]">Orders</h1>
        <p className="text-sm text-[#0D0D0D]/50">
          {total <= orders.length
            ? `All ${total} order${total === 1 ? '' : 's'}`
            : `Newest ${orders.length} of ${total} orders`}
          {' '}— every status, including failed, abandoned and awaiting payment. STRABL payment-link
          orders and standard checkout.
        </p>
      </div>
      <OrdersTable orders={orders} catalogue={catalogue} />
      {total > orders.length && (
        <div className="mt-4 text-center">
          <Link
            href={`/admin?show=${show + PAGE_SIZE}`}
            className="inline-block rounded-md border border-[#0D0D0D]/15 bg-white px-4 py-2 text-sm font-medium text-[#0D0D0D]"
          >
            Show {Math.min(PAGE_SIZE, total - orders.length)} more
          </Link>
        </div>
      )}
    </div>
  )
}
