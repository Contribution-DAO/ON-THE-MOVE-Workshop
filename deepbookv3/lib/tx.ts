import { Transaction } from "@mysten/sui/transactions";

export async function runTx(args: {
    client: any;
    signer: any;
    build: (tx: Transaction) => void | Promise<void>;
    include?: any;
}) {
    const tx = new Transaction();
    await args.build(tx);

    return args.client.core.signAndExecuteTransaction({
        transaction: tx,
        signer: args.signer,
        include: args.include ?? { effects: true, objectTypes: true },
    });
}

export async function main(fn: () => Promise<void>) {
    try {
        await fn();
    } catch (e) {
        console.error(e);
        process.exitCode = 1;
    }
}
