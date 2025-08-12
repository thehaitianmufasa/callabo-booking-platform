/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig