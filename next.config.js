/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['api.ceres.gob.ar'],

  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
