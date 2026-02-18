import "dotenv/config";
export type SuiNetwork = "testnet" | "mainnet";

export const ENV = {
    NETWORK: (process.env.NETWORK ?? "testnet") as SuiNetwork,
    FULLNODE_URL:
        process.env.SUI_FULLNODE_URL ??
        ((process.env.NETWORK ?? "testnet") === "mainnet"
            ? "https://fullnode.mainnet.sui.io:443"
            : "https://fullnode.testnet.sui.io:443"),

    SUI_PRIVATE_KEY: `${process.env.SUI_PRIVATE_KEY}`,
    BALANCE_MANAGER_KEY: process.env.BALANCE_MANAGER_KEY ?? "BM1",
    BALANCE_MANAGER_ID: process.env.BALANCE_MANAGER_ID ?? "",
};
