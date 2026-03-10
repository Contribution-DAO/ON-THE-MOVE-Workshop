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

    const amountSui = 20; 
    const res = await runTx({
        client,
        signer: keypair,
        build: (tx) => {
            tx.add(
                client.deepbook.balanceManager.depositIntoManager(
                    ENV.BALANCE_MANAGER_KEY,
                    "SUI",
                    amountSui,
                ),
            );
        },
    });

    console.dir(res, { depth: null });
});
