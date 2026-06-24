/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Cache optimized images for 7 days (default is 60s)
    minimumCacheTTL: 604800,
    // All product images are now local; keep remote patterns in case any are added later
    remotePatterns: [],
  },
};

module.exports = nextConfig;
