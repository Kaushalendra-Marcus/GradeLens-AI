/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    // Fix PackFileCacheStrategy failure when path contains space (MY PROJECTS)
    config.cache = { type: "memory" };
    return config;
  },
};
export default nextConfig;
