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
};

module.exports = nextConfig;
