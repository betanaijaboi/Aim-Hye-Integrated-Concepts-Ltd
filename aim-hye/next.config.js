/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.nbplc.com" },
      { protocol: "https", hostname: "assets.untappd.com" },
      { protocol: "https", hostname: "**.untappd.com" },
    ],
  },
};

module.exports = nextConfig;
