// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:7230/:path*', // your backend
      },
    ];
  },
};

export default nextConfig;
