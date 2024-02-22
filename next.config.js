/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify: true,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },

  // webpack: (config) => {
  //   config.resolve.fallback = { 
  //     ...config.resolve.fallback,

  //     fs: false,
  //     // path: false 
  //   };

  //   return config;
  // },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.akaswap.com',
        port: '',
        pathname: '/ipfs/**',
      },
    ],
  },

  env: {
    WalletRoleURL: process.env.WalletRoleURL,
    AkaDropURL: process.env.AkaDropURL,
  },

}
module.exports = nextConfig
