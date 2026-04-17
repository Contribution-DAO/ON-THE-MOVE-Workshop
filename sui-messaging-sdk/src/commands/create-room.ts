import chalk from "chalk";
import { createUserClient } from "../client.js";

export async function createRoom(members: string[]) {
  const { messagingClient, keypair } = createUserClient();
  const me = keypair.toSuiAddress();

  console.log(chalk.gray("wallet "), me);
  if (members.length) console.log(chalk.gray("inviting"), members.join(", "));
  console.log(chalk.gray("creating channel..."));

  try {
    const { channelId, creatorCapId } = await messagingClient.executeCreateChannelTransaction({
      signer: keypair,
      initialMembers: members,
    });
    const memberCap = await messagingClient.getUserMemberCap(me, channelId);

    console.log(chalk.green("\nchannel created"));
    console.log("  id          ", channelId);
    console.log("  creator cap ", creatorCapId);
    console.log("  member cap  ", memberCap?.id.id);
    console.log(chalk.gray("\nshare the channel id with others to join"));
  } catch (err: any) {
    console.error(chalk.red("create failed:"), err.message);
  }
}
