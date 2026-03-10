import { main, runTx } from "../lib/tx";
import { getKeypair } from "../lib/sui";
import { createDeepbookClient, getBalanceManagers } from "../lib/deepbook";
import { ENV } from "../lib/env";
import { Transaction } from "@mysten/sui/transactions";

main(async () => {
  const { keypair, address } = getKeypair();
  const client = createDeepbookClient({ address, balanceManagers: getBalanceManagers() });

  const res = await runTx({
    client,
    signer: keypair,
    include: { effects: true, objectTypes: true },
    build: (tx: Transaction) => {
      client.deepbook.balanceManager.withdrawAllFromManager(ENV.BALANCE_MANAGER_KEY, "SUI", address)(tx);
    },
  });

  console.dir(res, { depth: null });
});
