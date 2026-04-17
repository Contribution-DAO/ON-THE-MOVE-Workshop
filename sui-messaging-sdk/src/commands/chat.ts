import chalk from "chalk";
import { createInterface } from "readline";
import { createUserClient } from "../client.js";
import { config } from "../config.js";
import { getEncryptionKey } from "../encryption.js";

const HISTORY_LIMIT = 10;
const POLL_MS = 3000;

export async function interactiveChat(channelId: string) {
  const { messagingClient, keypair } = createUserClient();
  const me = keypair.toSuiAddress();

  const memberCap = await messagingClient.getUserMemberCap(me, channelId);
  if (!memberCap) {
    console.log(chalk.red("not a member of this channel"));
    return;
  }
  const memberCapId = memberCap.id.id;
  const encryptedKey = await getEncryptionKey(messagingClient, channelId, me);

  banner(channelId, me);
  await showHistory(messagingClient, channelId, me);
  const stopPolling = await startPolling(messagingClient, channelId, me);

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green("> "),
  });
  rl.prompt();

  rl.on("line", async (line) => {
    const text = line.trim();

    if (text === "/quit" || text === "/exit") {
      stopPolling();
      rl.close();
      console.log(chalk.yellow("bye"));
      process.exit(0);
    }
    if (!text) return rl.prompt();

    try {
      const { digest } = await messagingClient.executeSendMessageTransaction({
        signer: keypair,
        channelId,
        memberCapId,
        message: text,
        encryptedKey,
      });
      const time = new Date().toLocaleTimeString();
      console.log(chalk.gray(time), chalk.green("you"), text);
      console.log(chalk.gray("       "), config.suiscanTxUrl(digest));
    } catch (err: any) {
      console.log(chalk.red("send failed:"), err.message);
    }
    rl.prompt();
  });

  rl.on("close", stopPolling);
}

function banner(channelId: string, me: string) {
  console.log(chalk.blue("wallet "), me);
  console.log(chalk.blue("channel"), channelId);
  console.log(chalk.gray("type a message to send, /quit to exit"));
  console.log(chalk.gray("—".repeat(40)));
}

async function showHistory(client: any, channelId: string, me: string) {
  const { messages } = await client.getChannelMessages({
    channelId,
    userAddress: me,
    limit: HISTORY_LIMIT,
    direction: "backward",
  });
  for (const msg of [...messages].reverse()) printMessage(msg, me);
}

async function startPolling(client: any, channelId: string, me: string) {
  const [ch] = await client.getChannelObjectsByChannelIds({
    channelIds: [channelId],
    userAddress: me,
  });
  const state = {
    lastMessageCount: BigInt(ch.messages_count),
    lastCursor: null as bigint | null,
    channelId,
  };

  const t = setInterval(async () => {
    try {
      const { messages } = await client.getLatestMessages({
        channelId,
        userAddress: me,
        pollingState: state,
      });
      for (const msg of messages) {
        if (msg.sender !== me) printMessage(msg, me);
      }
      // don't advance lastCursor — would paginate backward through history
      state.lastMessageCount += BigInt(messages.length);
    } catch {
      // transient; retry next tick
    }
  }, POLL_MS);

  return () => clearInterval(t);
}

function printMessage(msg: any, me: string) {
  const mine = msg.sender === me;
  const who = mine ? chalk.green("you") : chalk.cyan(msg.sender.slice(0, 8));
  const time = new Date(parseInt(msg.createdAtMs)).toLocaleTimeString();
  console.log(chalk.gray(time), who, msg.text);

  for (const att of msg.attachments ?? []) {
    console.log(chalk.gray("         "), chalk.yellow(`${att.fileName} (${att.fileSize}b)`));
  }
}
