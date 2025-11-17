// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://26.34.16.193:7230/:path*', // your backend
      },
    ];
  },
};

export default nextConfig;
