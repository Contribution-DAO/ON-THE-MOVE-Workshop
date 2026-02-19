import { WALRUS_CONFIG } from "./env.js";

/**
 * Uploads raw bytes to Walrus.
 * It tries multiple publisher nodes until one works.
 */
export async function uploadBlob(data: Uint8Array): Promise<string> {
    let lastError: unknown = null;
    for (const baseUrl of WALRUS_CONFIG.PUBLISHERS) {
        const url = `${baseUrl}/v1/blobs?epochs=${WALRUS_CONFIG.EPOCHS}`;
        console.log(`☁️  Trying upload to: ${baseUrl}...`);
        try {
            const res = await fetch(url, {
                method: "PUT",
                body: data,
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const info = (await res.json()) as any;
            const blobId =
                info.newlyCreated?.blobObject?.blobId ||
                info.alreadyCertified?.blobId;

            if (!blobId) throw new Error("Invalid response format from Walrus");

            return blobId; // Success!
        } catch (e) {
            console.error(`-> Failed at ${baseUrl}, trying next...`);
            lastError = e;
        }
    }
    throw new Error(`All Walrus publishers failed. RIP. Error: ${lastError}`);
}

/**
 * Downloads raw bytes from Walrus.
 * It tries multiple aggregator nodes until one works.
 */
export async function downloadBlob(blobId: string): Promise<Uint8Array> {
    let lastError: unknown = null;
    for (const baseUrl of WALRUS_CONFIG.AGGREGATORS) {
        const url = `${baseUrl}/v1/blobs/${blobId}`;
        console.log(`⬇️  Trying download from: ${baseUrl}...`);
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const buffer = await res.arrayBuffer();
            return new Uint8Array(buffer); // Success!
        } catch (e) {
            console.error(`-> Node ${baseUrl} failed, trying next...`);
            lastError = e;
        }
    }
    throw new Error(`All Walrus aggregators failed. Blob might be gone.`);
}