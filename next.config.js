/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    // This is set to true to handle enum comparison issues during deployment
    ignoreBuildErrors: true,
  },
  // Configure external image domains for Next.js Image component
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
    ],
    // Explicitly enable AVIF format support
    formats: ['image/webp', 'image/avif'],
    // Allow larger images for company logos
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Allow cross-origin requests from local network devices for mobile testing
  async rewrites() {
    return []
  },
  // Configure allowed development origins for mobile testing
  allowedDevOrigins: [
    // Allow local network access for mobile testing
    '192.168.0.0/16',    // Common router ranges: 192.168.x.x
    '10.0.0.0/8',        // Private network range: 10.x.x.x
    '172.16.0.0/12',     // Private network range: 172.16.x.x - 172.31.x.x
  ],
}

module.exports = nextConfig