/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This line explicitly sets the project root and silences the lockfile warning.
  outputFileTracingRoot: __dirname,
  serverRuntimeConfig: {
    COUCHDB_URL: process.env.COUCHDB_URL,
  },
  // Add this webpack config to handle the 'fs' module issue with face-api.js
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
