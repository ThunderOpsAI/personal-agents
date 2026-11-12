/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => [
    {
      source: '/',
      destination: '/index.html',
    },
    {
      source: '/setup',
      destination: '/setup.html',
    },
    {
      source: '/nephew',
      destination: '/setup.html',
    },
  ],
};

export default nextConfig;
