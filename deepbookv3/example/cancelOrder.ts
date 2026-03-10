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
            tx.add(client.deepbook.deepBook.cancelAllOrders(POOL_KEY, ENV.BALANCE_MANAGER_KEY));
        },
    });
    console.log(res);
    let acct = await client.deepbook.account(POOL_KEY, ENV.BALANCE_MANAGER_KEY);
    console.log("=== ACCOUNT (available/locked) ===");
    console.dir(acct);
});
