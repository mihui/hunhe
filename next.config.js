/** @type {import('next').NextConfig} */

const nextConfig = {
  transpilePackages: [],
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img1.imgtp.com',
        port: '',
        pathname: '**',
      },
    ],
  }
};

export default nextConfig;
