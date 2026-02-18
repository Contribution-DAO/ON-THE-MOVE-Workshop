import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { ENV } from "./env";

export function getKeypair() {
  const { scheme, secretKey } = decodeSuiPrivateKey(ENV.SUI_PRIVATE_KEY);
  if (scheme !== "ED25519") throw new Error(`Unsupported scheme: ${scheme}`);
  const keypair = Ed25519Keypair.fromSecretKey(secretKey);
  return { keypair, address: keypair.toSuiAddress() };
}
