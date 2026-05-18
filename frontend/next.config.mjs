/** @type {import('next').NextConfig} */
const nextConfig = {
  // Stellar SDK uses Node.js built-ins; these need to be polyfilled/excluded
  // in the browser bundle.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Node built-ins not available in the browser
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        buffer: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
        child_process: false,
        worker_threads: false,
      };
    }
    return config;
  },
};

export default nextConfig;
