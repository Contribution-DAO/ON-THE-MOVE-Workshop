import chalk from "chalk";
import { createBotClient } from "../client.js";
import { config } from "../config.js";
import { getAIResponse } from "./ai.js";
import { getEncryptionKey } from "../encryption.js";

type PollingState = {
  lastMessageCount: bigint;
  lastCursor: bigint | null;
  channelId: string;
};

const history: Record<string, { role: "user" | "assistant"; content: string }[]> = {};
const pollState: Record<string, PollingState> = {};
const keyCache: Record<string, Awaited<ReturnType<typeof getEncryptionKey>>> = {};

// contract caps ciphertext at 512 bytes; leave room for the AES-GCM tag
const MAX_BYTES = 480;

function trimErr(msg: string) {
  if (msg.includes("MoveAbort")) return msg.length > 600 ? msg.slice(0, 600) + "…" : msg;
  return msg.length > 200 ? msg.slice(0, 200) + "…" : msg;
}

function trimBytes(s: string, max: number) {
  const bytes = new TextEncoder().encode(s);
  if (bytes.length <= max) return s;
  let i = max - 3;
  while (i > 0 && (bytes[i] & 0xc0) === 0x80) i--;
  return new TextDecoder().decode(bytes.slice(0, i)) + "...";
}

async function pollAndReply(channelId: string, memberCapId: string) {
  const { client, messagingClient, keypair } = createBotClient();
  const me = keypair.toSuiAddress();

  if (!keyCache[channelId]) {
    keyCache[channelId] = await getEncryptionKey(messagingClient, channelId, me);
  }
  const encryptedKey = keyCache[channelId];

  // first poll — anchor at current count so we skip the backlog
  if (!pollState[channelId]) {
    const [ch] = await messagingClient.getChannelObjectsByChannelIds({
      channelIds: [channelId],
      userAddress: me,
    });
    pollState[channelId] = {
      lastMessageCount: BigInt(ch.messages_count),
      lastCursor: null,
      channelId,
    };
    console.log(chalk.gray(`init ${channelId.slice(0, 10)} @ ${ch.messages_count} msgs`));
    return;
  }

  const state = pollState[channelId];
  const { messages } = await messagingClient.getLatestMessages({
    channelId,
    userAddress: me,
    pollingState: state,
  });
  if (messages.length === 0) return;

  for (const msg of messages) {
    if (msg.sender === me) continue;

    const who = msg.sender.slice(0, 8);
    console.log(chalk.cyan(`[${who}]`), msg.text);

    history[channelId] ??= [];
    const reply = trimBytes(await getAIResponse(msg.text, history[channelId]), MAX_BYTES);

    try {
      const { digest } = await messagingClient.executeSendMessageTransaction({
        signer: keypair,
        channelId,
        memberCapId,
        message: reply,
        encryptedKey,
      });
      // wait for finality so the next send sees the new channel version
      await client.waitForTransaction({ digest });

      const preview = reply.length > 80 ? reply.slice(0, 80) + "…" : reply;
      console.log(chalk.green("[bot]"), preview);
      console.log(chalk.gray("     "), config.suiscanTxUrl(digest));

      history[channelId].push({ role: "user", content: msg.text });
      history[channelId].push({ role: "assistant", content: reply });
      if (history[channelId].length > 20) history[channelId] = history[channelId].slice(-20);
    } catch (err: any) {
      console.log(chalk.red("send failed:"), trimErr(err.message));
      // drop cached key — might be stale after a member was added
      delete keyCache[channelId];
    }
  }

  // don't touch lastCursor — advancing it paginates backward through history
  state.lastMessageCount += BigInt(messages.length);
}

async function main() {
  const { messagingClient, keypair } = createBotClient();
  const me = keypair.toSuiAddress();

  console.log(chalk.blue("bot starting"), chalk.gray(me));
  console.log(chalk.gray(`poll every ${config.botPollIntervalMs}ms`));

  const { memberships } = await messagingClient.getChannelMemberships({ address: me });
  const channels = new Map<string, string>(
    memberships.map((m: any) => [m.channel_id, m.member_cap_id]),
  );

  if (channels.size === 0) {
    console.log(chalk.yellow("not a member of any channel. invite this wallet first:"));
    console.log(`  npm run dev -- invite <channelId> ${me}`);
    process.exit(0);
  }

  console.log(chalk.gray(`watching ${channels.size} channel(s):`));
  channels.forEach((_, id) => console.log(chalk.gray(" "), id));

  // Groq + Sui finality can exceed the interval — skip ticks if still busy
  let busy = false;
  const poll = async () => {
    if (busy) return;
    busy = true;
    try {
      for (const [id, cap] of channels) {
        try {
          await pollAndReply(id, cap);
        } catch (err: any) {
          console.log(chalk.red(`poll ${id.slice(0, 8)}:`), err.message);
        }
      }
    } finally {
      busy = false;
    }
  };

  await poll();
  setInterval(poll, config.botPollIntervalMs);
  console.log(chalk.green("ready.") + " (ctrl-c to stop)\n");
}

main().catch((err) => {
  console.error(chalk.red("crashed:"), err);
  process.exit(1);
});
