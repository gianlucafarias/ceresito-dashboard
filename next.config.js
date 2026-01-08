/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['api.ceres.gob.ar'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pps.whatsapp.net',
    }
  ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.cache = false;
    }
    return config;
  },
  // Proxy para evitar problemas de CORS en desarrollo
  async rewrites() {
    return [
      {
        source: '/api/servicios-externos/:path*',
        destination: `${process.env.NEXT_PUBLIC_SERVICES_API_URL || 'http://localhost:3001'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
