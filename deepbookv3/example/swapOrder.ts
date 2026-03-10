import "dotenv/config";
import { main, runTx } from "../lib/tx";
import { getKeypair } from "../lib/sui";
import { createDeepbookClient, getBalanceManagers } from "../lib/deepbook";

main(async () => {
    const { keypair, address } = getKeypair();
    const client = createDeepbookClient({
        address,
        balanceManagers: getBalanceManagers(),
    });

    const res = await runTx({
        client,
        signer: keypair,
        include: { effects: true, events: true, objectTypes: true },
        build: (tx) => {
            const [baseOut, quoteOut, deepOut] =
                client.deepbook.deepBook.swapExactBaseForQuote({
                    poolKey: "SUI_DBUSDC",
                    amount: 1,
                    deepAmount: 1,
                    minOut: 0.5,
                })(tx);

            tx.transferObjects([baseOut, quoteOut, deepOut], address);
        },
    });

    console.log("=== SWAP RESULT ===");
    console.dir(res, { depth: null });
});
