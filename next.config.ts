import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/campaigns/create',
        destination: '/campaigns/new',
        permanent: true,
      },
      {
        source: '/dashboard',
        destination: '/campaigns',
        permanent: true,
      },
      {
        source: '/product-analytics',
        destination: '/campaigns',
        permanent: true,
      },
      {
        source: '/product-analytics/:path*',
        destination: '/campaigns',
        permanent: true,
      },
      {
        source: '/keywords',
        destination: '/campaigns',
        permanent: true,
      },
      {
        source: '/search-terms',
        destination: '/campaigns',
        permanent: true,
      },
      {
        source: '/ai-insights',
        destination: '/campaigns',
        permanent: true,
      },
      {
        source: '/automation-rules',
        destination: '/campaigns',
        permanent: true,
      },
      {
        source: '/billing',
        destination: '/campaigns',
        permanent: true,
      },
      {
        source: '/reports',
        destination: '/campaigns',
        permanent: true,
      },
      {
        source: '/campaigns/settings',
        destination: '/campaigns',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
