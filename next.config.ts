import type { NextConfig } from "next";
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingIncludes: {
    '/api/analyze': ['./data/knowledge/**/*'],
    '/api/knowledge': ['./data/knowledge/**/*'],
    '/api/knowledge/[id]': ['./data/knowledge/**/*'],
    '/knowledge': ['./data/knowledge/**/*'],
  },
};

export default nextConfig;
