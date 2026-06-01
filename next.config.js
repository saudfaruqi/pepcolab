/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { 
    domains: [],
    unoptimized: true,  // required for static export
  },
}
module.exports = nextConfig