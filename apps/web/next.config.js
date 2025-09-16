/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["next-tiny-rx-store"],

  // Enable static export for GitHub Pages
  output: "export",

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Base path for GitHub Pages (will be automatically set by GitHub Actions)
  basePath:
    process.env.NODE_ENV === "production" ? process.env.BASE_PATH || "" : "",

  // Ensure trailing slash is disabled for better compatibility
  trailingSlash: false,
};

module.exports = nextConfig;
