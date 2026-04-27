import type { NextConfig } from "next";

/** 프로덕션에서만 기본 응답에 CSP(상대 완화: Next 번들 + 인라인 스타일 필요). */
function buildContentSecurityPolicy(): string {
  const api = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"
  const ws = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws"
  let connectExtra = ""
  try {
    connectExtra = `${new URL(api).origin} ${new URL(ws).origin}`
  } catch {
    connectExtra = "http://localhost:8080 http://127.0.0.1:8080 ws://localhost:8080 ws://127.0.0.1:8080"
  }
  // Vite/Turbopack dev가 아닌 next start 기준. connect는 API·WS·(선택) Vercel Analytics
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    // Next 프로덕션 번들: 대부분 'self'로 충분. 인라인은 스타일/하이드레이션에 필요할 수 있음. eval은 지양(개발(HMR)은 CSP 비적용)
    "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // localhost 변형: 배포 URL은 NEXT_PUBLIC_* 로 반영
    `connect-src 'self' ${connectExtra} ` +
      "http://127.0.0.1:8080 http://localhost:8080 " +
      "ws://127.0.0.1:8080 ws://localhost:8080 wss: ws: https: " +
      "https://vitals.vercel-insights.com",
    // react-daum-postcode(우편번호) iframe
    "frame-src 'self' https://postcode.map.daum.net https://t1.daumcdn.net",
    "frame-ancestors 'self'",
    "form-action 'self'",
  ].join("; ")
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      // S3 이미지 버킷 (cloud.aws.s3.bucket=ddip-image, region=ap-northeast-2)
      {
        protocol: "https",
        hostname: "ddip-image.s3.ap-northeast-2.amazonaws.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    if (process.env.NODE_ENV !== "production") {
      return []
    }
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: buildContentSecurityPolicy(),
          },
        ],
      },
    ]
  },
};

export default nextConfig;
