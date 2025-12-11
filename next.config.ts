import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui.shadcn.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.ultraself.space',
      },
      {
        protocol: 'https',
        hostname: 'api.ultraself.space',
      },
      {
        protocol: 'https',
        hostname: 'api.gameprovider.fun',
      },
      {
        protocol: 'https',
        hostname: 'images.gameprovider.fun',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add custom webpack rules if needed
    return config;
  },
  
  // Headers for better security and performance
  async headers() {
    return [
      {
        // Headers gerais para todas as rotas
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        // Permitir iframe do console.primebet.space para rotas com ?preview=true
        // Isso é necessário para o Editor Visual funcionar
        source: '/:path*',
        has: [
          {
            type: 'query',
            key: 'preview',
            value: 'true',
          },
        ],
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://console.primebet.space https://primebet.space http://localhost:3000",
          },
        ],
      },
      {
        // Bloquear iframe em rotas normais (sem preview)
        source: '/((?!api).*)',
        missing: [
          {
            type: 'query',
            key: 'preview',
          },
        ],
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
  
  // Redirects for better SEO
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
