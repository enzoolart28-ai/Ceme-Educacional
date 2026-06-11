import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera um servidor mínimo em .next/standalone para deploy enxuto via Docker.
  output: "standalone",
};

export default nextConfig;
