import type { NextConfig } from 'next';

const backendBaseUrl = (process.env.BACKEND_API_URL || 'http://localhost:4000').replace(
  /\/+$/,
  ''
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['mongodb'],
  outputFileTracingIncludes: {
    '/**': ['./data/**/*'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
