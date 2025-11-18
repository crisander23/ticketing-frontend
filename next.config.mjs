// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://26.251.194.56:7230/:path*', // your backend
      },
    ];
  },
};

export default nextConfig;
