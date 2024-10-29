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
    GoogleMapsAPIKey: process.env.GoogleMapsAPIKey,
    WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY,
    WALLET_PASSPHRASE: process.env.WALLET_PASSPHRASE,
    SERVER_URL: process.env.SERVER_URL,
    TZKT_URL: process.env.TZKT_URL,
    NEXT_PUBLIC_PARTNER_ID: process.env.NEXT_PUBLIC_PARTNER_ID,
    NEXT_PUBLIC_BAUTH_USERNAME: process.env.NEXT_PUBLIC_BAUTH_USERNAME,
    NEXT_PUBLIC_BAUTH_PASSWORD: process.env.NEXT_PUBLIC_BAUTH_PASSWORD,
    DirectusURL: process.env.DirectusURL,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*", // Adjust this to your specific origin if needed
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-Requested-With, Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};
module.exports = nextConfig
