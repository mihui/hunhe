/** @type {import('next').NextConfig} */

const nextConfig = {
  transpilePackages: [],
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'smms.app',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 's2.loli.net',
        port: '',
        pathname: '**',
      },
    ],
  }
};

export default nextConfig;
