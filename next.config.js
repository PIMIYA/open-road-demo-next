/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify: true,
  // typescript: {
  //   // !! WARN !!
  //   // Dangerously allow production builds to successfully complete even if
  //   // your project has type errors.
  //   // !! WARN !!
  //   ignoreBuildErrors: true,
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
    GoogleMapsAPIKey: process.env.GoogleMapsAPIKey
  },

  // async headers() {
  //   return [
  //     {
  //       source: "/_next/:path*",
  //       headers: [
  //         {
  //           key: "Access-Control-Allow-Origin",
  //           value: "http://localhost:3000",
  //         },
  //       ],
  //     },
  //   ];
  // },

}
module.exports = nextConfig
