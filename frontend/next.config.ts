import type { NextConfig } from 'next'

const BACKEND_URL = process.env.BACKEND_URL || 'https://print-code.k1god.com'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: 'img.freepik.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${BACKEND_URL}/:path*`,
      },
    ]
  },
}

export default nextConfig
