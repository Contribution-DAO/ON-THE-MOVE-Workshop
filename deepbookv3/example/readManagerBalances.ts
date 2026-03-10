import "dotenv/config";
import { main } from "../lib/tx";
import { getKeypair } from "../lib/sui";
import { createDeepbookClient, getBalanceManagers } from "../lib/deepbook";
import { ENV } from "../lib/env";

main(async () => {
    const { address } = getKeypair();
    const client = createDeepbookClient({
        address,
        balanceManagers: getBalanceManagers(),
    });

    const key = ENV.BALANCE_MANAGER_KEY;
    const [sui, usdc, deep] = await Promise.all([
        client.deepbook.checkManagerBalance(key, "SUI"),
        client.deepbook.checkManagerBalance(key, "DBUSDC"),
        client.deepbook.checkManagerBalance(key, "DEEP"),
    ]);

    console.log({ SUI: sui, DBUSDC: usdc, DEEP: deep });
});
