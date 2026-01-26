/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.ceres.gob.ar',
      },
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
  // NOTA: El proxy ahora se maneja mediante la ruta API en app/api/servicios-externos/[...path]/route.ts
  // Los rewrites tienen prioridad sobre las rutas API, por lo que se eliminó el rewrite anterior
};

module.exports = nextConfig;
