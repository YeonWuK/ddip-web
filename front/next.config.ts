import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // 실제 백엔드 이미지 서버 도메인을 여기에 추가하세요
      // 예: {
      //   protocol: 'https',
      //   hostname: 'your-backend-domain.com',
      //   port: '',
      //   pathname: '/**',
      // },
    ],
  },
};

export default nextConfig;
