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

    const res = await runTx({
        client,
        signer: keypair,
        build: (tx) => {
            tx.add(
                client.deepbook.deepBook.placeMarketOrder({
                    poolKey: POOL_KEY,
                    balanceManagerKey: ENV.BALANCE_MANAGER_KEY,
                    clientOrderId: `${Date.now()}`,
                    quantity: 1,
                    isBid: false,
                    payWithDeep: false,
                }),
            );
        },
    });

    console.dir(res, { depth: null });
});
