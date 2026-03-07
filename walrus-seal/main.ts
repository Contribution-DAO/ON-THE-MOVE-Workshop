import { SuiJsonRpcClient, JsonRpcHTTPTransport } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { SealClient, SessionKey, EncryptedObject } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex, toHex } from "@mysten/sui/utils";
import { CONFIG } from "./lib/env.js";
import { uploadBlob, downloadBlob } from "./lib/walrus.js";

const RPC_URL = "https://fullnode.testnet.sui.io:443";
let suiClient: SuiJsonRpcClient;
let sealClient: SealClient;

async function main() {
  console.log("Starting the Walrus x Seal Privacy Demo...");

  // 1. Setup Network
  await initClients();

  // 2. Setup Users
  const sender = getKeypair(CONFIG.SENDER_KEY);
  const receiver = getKeypair(CONFIG.RECEIVER_KEY);

  console.log(`👤 Sender:   ${sender.getPublicKey().toSuiAddress()}`);
  console.log(`👤 Receiver: ${receiver.getPublicKey().toSuiAddress()}`);

  // 3. Sender Flow
  const secretMessage =
    "Yo fam, this is exclusive content! 📸 (Secured by Seal)";
  const policyObjectId = await runSenderFlow(secretMessage, receiver, sender);

  // 4. Simulate Network Delay
  console.log("\n⏳ Chilling for 5s to let Walrus propagate...");
  await sleep(5000);

  // 5. Receiver Flow
  await runReceiverFlow(policyObjectId, receiver);

  console.log("\n✨ Boom! Mission accomplished.");
}

// ============================================================================
// WORKFLOWS
// ============================================================================

async function runSenderFlow(
  secret: string,
  recipient: Ed25519Keypair,
  sender: Ed25519Keypair,
): Promise<string> {
  console.log(`\n--- [Step 1] Sender Turn ---`);
  console.log(`🔒 Encrypting payload...`);

  // Encrypt locally
  const plainBytes = new TextEncoder().encode(secret);
  const { encryptedObject } = await sealClient.encrypt({
    threshold: 2,
    packageId: CONFIG.PACKAGE_ID!,
    id: toHex(new TextEncoder().encode(String(Date.now()))),
    data: plainBytes,
  });

  console.log(`-> Encrypted size: ${encryptedObject.byteLength} bytes`);

  // Upload to Walrus (Using our helper)
  const blobId = await uploadBlob(encryptedObject);
  console.log(`Walrus Blob ID: ${blobId}`);

  // Mint the Policy Object on Sui
  console.log("⛓️ Minting SecretMessage object on-chain...");
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONFIG.PACKAGE_ID}::message::create_secret_message`,
    arguments: [
      tx.pure.address(recipient.getPublicKey().toSuiAddress()),
      tx.pure.string(blobId),
    ],
  });

  const result = await suiClient.signAndExecuteTransaction({
    signer: sender,
    transaction: tx,
    options: { showObjectChanges: true },
  });

  // Find the new object ID
  const objectId = result.objectChanges?.find(
    (c) => c.type === "created",
  )?.objectId;
  if (!objectId) throw new Error("No created object");
  console.log(`Policy Object created: ${objectId}`);

  return objectId;
}

async function runReceiverFlow(
  policyObjectId: string,
  recipient: Ed25519Keypair,
) {
  console.log(`\n--- [Step 2] Receiver Turn ---`);
  console.log(`Fetching policy object: ${policyObjectId}`);

  // 1. Get Blob ID from Chain
  const obj = await suiClient.getObject({
    id: policyObjectId,
    options: { showContent: true },
  });

  const fields = (obj.data?.content as any)?.fields;
  if (!fields) throw new Error("Policy object is empty/invalid.");

  const blobId = fields.walrus_blob_id;
  console.log(`Found Walrus ID: ${blobId}`);

  // 2. Download from Walrus (Using our helper)
  const encryptedBytes = await downloadBlob(blobId);
  console.log(`-> Got ${encryptedBytes.byteLength} bytes`);

  // 3. Validation
  const info = EncryptedObject.parse(encryptedBytes);
  if (!info.id || !info.threshold) throw new Error("Data looks corrupted.");

  // 4. Session Key (Ephemeral security)
  console.log(`Generating temp session key...`);
  const recipientAddr = recipient.getPublicKey().toSuiAddress();
  const sessionKey = await SessionKey.create({
    address: recipientAddr,
    packageId: `${CONFIG.PACKAGE_ID}`,
    ttlMin: 10,
    signer: recipient,
    suiClient,
  });

  // 5. Build Proof (seal_approve)
  console.log("Building auth proof...");
  const tx = new Transaction();
  tx.setSender(recipientAddr);
  tx.moveCall({
    target: `${CONFIG.PACKAGE_ID}::message::seal_approve`,
    arguments: [
      tx.pure.vector("u8", fromHex(info.id)),
      tx.object(policyObjectId),
    ],
  });

  const txBytes = await tx.build({
    client: suiClient,
    onlyTransactionKind: true,
  });

  // 6. Decrypt
  console.log("Asking Key Servers to decrypt...");
  const decryptedBytes = await sealClient.decrypt({
    data: encryptedBytes,
    sessionKey,
    txBytes,
  });

  const msg = new TextDecoder().decode(decryptedBytes);
  console.log(`SUCCESS! Message: "${msg}"`);
}

async function initClients() {
  suiClient = new SuiJsonRpcClient({
    transport: new JsonRpcHTTPTransport({ url: RPC_URL }),
    network: CONFIG.SUI_NETWORK,
  });
  sealClient = new SealClient({
    suiClient,
    serverConfigs: CONFIG.KEY_SERVERS.map((id) => ({
      objectId: id,
      weight: 1,
    })),
    verifyKeyServers: false,
  });
}

function getKeypair(secretKey: string) {
  return Ed25519Keypair.fromSecretKey(decodeSuiPrivateKey(secretKey).secretKey);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error("FATAL ERROR:", e);
  process.exit(1);
});
