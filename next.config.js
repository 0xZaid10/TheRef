/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // genlayer-js is ESM-only — tell webpack to transpile it instead of
  // trying to require() it as CommonJS on the server side.
  transpilePackages: ["genlayer-js"],
  webpack: (config) => {
    config.externals.push(
      "pino-pretty",
      "lokijs",
      "encoding",
      "@react-native-async-storage/async-storage"
    );

    // charset:true tells webpack to add charset=utf-8 to script tags
    // so the browser interprets the bundle as UTF-8 (fixes bignumber.js +/- chars)
    if (config.output) {
      config.output.charset = true;
    }

    return config;
  },
};

module.exports = nextConfig;
