import "dotenv/config";
import { main, runTx } from "../lib/tx";
import { getKeypair } from "../lib/sui";
import { createDeepbookClient, getBalanceManagers } from "../lib/deepbook";
import { ENV } from "../lib/env";

main(async () => {
    const { keypair, address } = getKeypair();
    const client = createDeepbookClient({
        address,
        balanceManagers: getBalanceManagers(),
    });

    const POOL_KEY = "SUI_DBUSDC";
    const isBid = false; 
    const quantity = 20.0;
    const price = 1.2;
    const payWithDeep = false;
    const expireTimestamp = Date.now() + 60 * 60 * 1000;

    const can = await client.deepbook.canPlaceLimitOrder({
        poolKey: POOL_KEY,
        balanceManagerKey: ENV.BALANCE_MANAGER_KEY,
        price,
        quantity,
        isBid,
        payWithDeep,
        expireTimestamp,
    });
    console.log("canPlaceLimitOrder =", can);

    const res = await runTx({
        client,
        signer: keypair,
        build: (tx) => {
            tx.add(
                client.deepbook.deepBook.placeLimitOrder({
                    poolKey: POOL_KEY,
                    balanceManagerKey: ENV.BALANCE_MANAGER_KEY,
                    clientOrderId: `${Date.now()}`,
                    price,
                    quantity,
                    isBid,
                    payWithDeep,
                }),
            );
        },
    });

    console.dir(res, { depth: null });
    const acct = await client.deepbook.account(POOL_KEY, ENV.BALANCE_MANAGER_KEY);
    console.log("=== ACCOUNT (available/locked) ===");
    console.dir(acct, { depth: null });
});
