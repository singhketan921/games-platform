/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: ".",
  },
  experimental: {
    serverSourceMaps: false,
  },
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
