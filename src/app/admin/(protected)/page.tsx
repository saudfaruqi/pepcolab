// src/app/admin/(protected)/page.tsx
import { getRecentOrders } from '@/lib/orderStore'
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

export default async function AdminOrdersPage() {
  const [orders, catalogue] = await Promise.all([getRecentOrders(200), loadCatalogueVariants()])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[#0D0D0D]">Orders</h1>
        <p className="text-sm text-[#0D0D0D]/50">
          Most recent {orders.length} order{orders.length === 1 ? '' : 's'}. Includes STRABL
          payment-link orders and standard checkout — status shown as recorded at time of order.
        </p>
      </div>
      <OrdersTable orders={orders} catalogue={catalogue} />
    </div>
  )
}
