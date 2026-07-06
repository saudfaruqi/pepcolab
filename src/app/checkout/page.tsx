// src/app/checkout/page.tsx - Simple redirect
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to products if someone lands here directly
    router.push('/products')
  }, [router])
  
  return null
}