// app/page.tsx
import dynamic from 'next/dynamic'

const HomePageContent = dynamic(
  () => import('@/components/HomePageContent'),
  { ssr: false }
)

export default function Home() {
  return <HomePageContent />
}