// src/app/admin/(protected)/marketing/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getCampaign } from '@/lib/marketing/store'
import CampaignEditor from './CampaignEditor'

export const dynamic = 'force-dynamic'

export default async function CampaignPage({ params }: { params: { id: string } }) {
  const campaign = await getCampaign(params.id)
  if (!campaign) notFound()
  return <CampaignEditor initial={campaign} />
}
