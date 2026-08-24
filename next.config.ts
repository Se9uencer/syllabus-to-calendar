import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Parent directory has a package-lock.json that would otherwise become
  // Turbopack's workspace root and break local next resolution.
  turbopack: {
    root,
  },
};

export default nextConfig;
