import "dotenv/config";
import { main, runTx } from "../lib/tx";
import { getKeypair } from "../lib/sui";
import { createDeepbookClient } from "../lib/deepbook";

main(async () => {
    const { keypair, address } = getKeypair();
    const client = createDeepbookClient({ address });

    const res = await runTx({
        client,
        signer: keypair,
        build: (tx) => {
            tx.add(client.deepbook.balanceManager.createAndShareBalanceManager());
        },
    });

    console.dir(res, { depth: null });
});
