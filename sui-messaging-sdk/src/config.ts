import "dotenv/config";
import {
  TESTNET_MESSAGING_PACKAGE_CONFIG,
  MAINNET_MESSAGING_PACKAGE_CONFIG,
} from "@mysten/messaging";

const network = (process.env.NETWORK ?? "testnet") as "testnet" | "mainnet";

export const config = {
  suiPrivateKey: process.env.SUI_PRIVATE_KEY!,
  botPrivateKey: process.env.BOT_PRIVATE_KEY || process.env.SUI_PRIVATE_KEY!,
  network,
  groqApiKey: process.env.GROQ_API_KEY!,
  groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  botPollIntervalMs: parseInt(process.env.BOT_POLL_INTERVAL_MS || "5000"),

  // Sourced from @mysten/messaging so package IDs stay in sync if the SDK upgrades
  messagingPackageId:
    network === "mainnet"
      ? MAINNET_MESSAGING_PACKAGE_CONFIG.packageId
      : TESTNET_MESSAGING_PACKAGE_CONFIG.packageId,

  get fullnodeUrl(): string {
    return this.network === "mainnet"
      ? "https://fullnode.mainnet.sui.io:443"
      : "https://fullnode.testnet.sui.io:443";
  },

  suiscanTxUrl(digest: string): string {
    return `https://suiscan.xyz/${this.network}/tx/${digest}`;
  },

  sealServers: [
    {
      objectId: "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
      weight: 1,
    },
    {
      objectId: "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
      weight: 1,
    },
  ],

  walrus: {
    aggregator: "https://aggregator.walrus-testnet.walrus.space",
    publisher: "https://publisher.walrus-testnet.walrus.space",
    epochs: 1,
  },
};
