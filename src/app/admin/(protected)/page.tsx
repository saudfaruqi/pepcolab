// src/app/admin/(protected)/page.tsx
import { getRecentOrders } from '@/lib/orderStore'
import OrdersTable from './OrdersTable'

export const dynamic = 'force-dynamic' // always fresh — this is an admin dashboard, never cache order data

export default async function AdminOrdersPage() {
  const orders = await getRecentOrders(200)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[#0D0D0D]">Orders</h1>
        <p className="text-sm text-[#0D0D0D]/50">
          Most recent {orders.length} order{orders.length === 1 ? '' : 's'}. Includes STRABL
          payment-link orders and standard checkout — status shown as recorded at time of order.
        </p>
      </div>
      <OrdersTable orders={orders} />
    </div>
  )
}
