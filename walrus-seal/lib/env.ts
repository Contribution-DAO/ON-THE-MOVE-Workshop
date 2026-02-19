import "dotenv/config";

// --- Env Checks ---
if (!process.env.SENDER_PRIVATE_KEY || !process.env.RECEIVER_PRIVATE_KEY) {
    throw new Error("Bro, you forgot the private keys in .env file.");
}

export const CONFIG = {
    // Keys
    SENDER_KEY: process.env.SENDER_PRIVATE_KEY,
    RECEIVER_KEY: process.env.RECEIVER_PRIVATE_KEY,

    // Network & Package
    SUI_NETWORK: process.env.SUI_NETWORK || "testnet",
    PACKAGE_ID: process.env.PACKAGE_ID,

    // Seal Key Servers (Testnet)
    KEY_SERVERS: [
        "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
        "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
    ],

    // Dummy 32-byte hex for initial encryption setup
    PLACEHOLDER_POLICY_ID: "0x" + "0".repeat(64),
};

// --- Walrus Endpoints ---
export const WALRUS_CONFIG = {
    EPOCHS: Number(process.env.WALRUS_EPOCHS ?? 1),

    PUBLISHERS: [
        "https://publisher.walrus-testnet.walrus.space",
        "https://wal-publisher-testnet.staketab.org",
        "https://walrus-testnet-publisher.redundex.com",
        "https://walrus-testnet-publisher.nodes.guru",
    ].filter(Boolean) as string[],

    AGGREGATORS: [
        "https://aggregator.walrus-testnet.walrus.space",
        "https://wal-aggregator-testnet.staketab.org",
        "https://walrus-testnet-aggregator.redundex.com",
        "https://walrus-testnet-aggregator.nodes.guru",
    ].filter(Boolean) as string[],
};