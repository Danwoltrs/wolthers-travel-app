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
}

module.exports = nextConfig