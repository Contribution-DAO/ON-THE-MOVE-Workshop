export async function getEncryptionKey(
  messagingClient: any,
  channelId: string,
  userAddress: string,
) {
  const channels = await messagingClient.getChannelObjectsByChannelIds({
    channelIds: [channelId],
    userAddress,
  });

  if (!channels || channels.length === 0) {
    throw new Error("Channel not found or you are not a member");
  }

  const ch = channels[0];
  return {
    $kind: "Encrypted" as const,
    encryptedBytes: new Uint8Array(ch.encryption_key_history.latest),
    version: ch.encryption_key_history.latest_version,
  };
}
