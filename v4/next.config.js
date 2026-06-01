/** @type {import('next').NextConfig} */
const nextConfig = {
  // Leaflet はブラウザ専用のため SSR を無効化
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
  // Google アバター画像を許可
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
};

module.exports = nextConfig;
