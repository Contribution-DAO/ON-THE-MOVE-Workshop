import { deepbook, type BalanceManager } from "@mysten/deepbook-v3";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { ENV } from "./env";

export function createDeepbookClient(args: {
    address: string;
    balanceManagers?: Record<string, BalanceManager>;
}) {
    return new SuiGrpcClient({
        network: ENV.NETWORK,
        baseUrl: ENV.FULLNODE_URL,
    }).$extend(
        deepbook({
            address: args.address,
            balanceManagers: args.balanceManagers,
        }),
    );
}

export function getBalanceManagers(): Record<string, BalanceManager> | undefined {
    if (!ENV.BALANCE_MANAGER_ID) return undefined;
    const balanceManagers: { [k: string]: BalanceManager } = {
        [ENV.BALANCE_MANAGER_KEY]: { address: ENV.BALANCE_MANAGER_ID },
    };
    return balanceManagers;
}
