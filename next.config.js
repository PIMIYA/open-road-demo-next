/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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
        protocol: "https",
        hostname: "assets.akaswap.com",
        port: "",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "dummyimage.com",
        port: "",
        pathname: "/**",
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
    NEXT_PUBLIC_DIRECTUS_ADMIN_EMAIL:
      process.env.NEXT_PUBLIC_DIRECTUS_ADMIN_EMAIL,
    NEXT_PUBLIC_DIRECTUS_ADMIN_PASSWORD:
      process.env.NEXT_PUBLIC_DIRECTUS_ADMIN_PASSWORD,
    DIRECTUS: process.env.DIRECTUS,
    COMMENT_URL: process.env.COMMENT_URL,
  },
};
module.exports = nextConfig
