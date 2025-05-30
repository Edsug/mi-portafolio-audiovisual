/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración básica para imágenes remotas del backend
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mi-portafolio-backend-ca9g.onrender.com',
        port: '',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
  },

  // Variables de entorno públicas por defecto
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://mi-portafolio-backend-ca9g.onrender.com',
  },

  // Configuración básica para deployment
  trailingSlash: false,
  poweredByHeader: false,
  
  // Configuración para TypeScript y ESLint (no críticas)
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;