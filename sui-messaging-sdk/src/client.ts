import { SuiClient } from "@mysten/sui/client";
import { SealClient } from "@mysten/seal";
import { messaging } from "@mysten/messaging";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { config } from "./config.js";

export function createKeypair(privateKey: string): Ed25519Keypair {
  const { scheme, secretKey } = decodeSuiPrivateKey(privateKey);
  if (scheme !== "ED25519") throw new Error(`Unsupported scheme: ${scheme}`);
  return Ed25519Keypair.fromSecretKey(secretKey);
}

export function createMessagingClient(keypair: Ed25519Keypair) {
  const client = new SuiClient({
    url: config.fullnodeUrl,
    network: config.network,
    mvr: {
      overrides: {
        packages: {
          "@local-pkg/sui-stack-messaging": config.messagingPackageId,
        },
      },
    },
  })
    .$extend(
      SealClient.asClientExtension({
        serverConfigs: config.sealServers,
      })
    )
    .$extend(
      messaging({
        walrusStorageConfig: {
          aggregator: config.walrus.aggregator,
          publisher: config.walrus.publisher,
          epochs: config.walrus.epochs,
        },
        sessionKeyConfig: {
          address: keypair.toSuiAddress(),
          ttlMin: 30,
          signer: keypair,
        },
      })
    );

  return { client, messagingClient: client.messaging, keypair };
}

// Shortcut: create client from .env private key
export function createUserClient() {
  const keypair = createKeypair(config.suiPrivateKey);
  return createMessagingClient(keypair);
}

// Shortcut: create bot client from .env bot key
export function createBotClient() {
  const keypair = createKeypair(config.botPrivateKey);
  return createMessagingClient(keypair);
}
