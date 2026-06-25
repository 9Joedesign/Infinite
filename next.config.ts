import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  turbopack: {
    root: '..',
  },
  outputFileTracingIncludes: {
    '/api/analyze': ['./data/knowledge/**/*'],
    '/api/knowledge': ['./data/knowledge/**/*'],
    '/api/knowledge/[id]': ['./data/knowledge/**/*'],
    '/knowledge': ['./data/knowledge/**/*'],
  },
};

export default nextConfig;
