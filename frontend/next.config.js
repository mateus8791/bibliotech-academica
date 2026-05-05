/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Ignora erros de ESLint no build (any, unused-vars pré-existentes)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignora erros de TypeScript no build
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    // A configuração 'remotePatterns' é a forma moderna e correta de definir fontes de imagens externas.
    remotePatterns: [
      {
        // Permite imagens de qualquer domínio que use o protocolo seguro HTTPS.
        protocol: 'https',
        hostname: '**',
      },
      {
        // Permite imagens de qualquer domínio que use o protocolo não seguro HTTP.
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;