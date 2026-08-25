/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',

  reactStrictMode: false,
  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  devIndicators: false,

  images: {
    unoptimized: false,
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      {
        protocol: 'https',
        hostname: 'iyimvvserhdujsazrbji.supabase.co',
        // FIX: was scoped to '/storage/v1/object/public/**' only, which
        // rejects Supabase Storage URLs that aren't from a public bucket —
        // e.g. signed URLs ('/storage/v1/object/sign/**') or the image
        // render/transform endpoint ('/storage/v1/render/image/**').
        // Next's image optimizer 400s (broken icon) on any src whose path
        // doesn't match the pattern, even if the hostname matches. Widening
        // to the whole /storage/v1/** tree covers all of Supabase Storage's
        // URL shapes without opening up unrelated hosts.
        pathname: '/storage/v1/**',
      },
    ],
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2592000, // 30 days in seconds
    dangerouslyAllowSVG: true,
    qualities: [75, 90, 95, 100],
  },

  experimental: {
    optimizePackageImports: [
      'framer-motion',
      '@editorjs/editorjs',
      'react-hot-toast',
      'axios',
    ],
    scrollRestoration: true,
  },

  turbopack: {},

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
              name: 'common',
            },
          },
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;