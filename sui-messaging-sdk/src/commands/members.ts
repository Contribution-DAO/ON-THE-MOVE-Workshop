import chalk from "chalk";
import { createUserClient } from "../client.js";

export async function listMembers(channelId: string) {
  const { messagingClient, keypair } = createUserClient();
  const me = keypair.toSuiAddress();

  try {
    const { members } = await messagingClient.getChannelMembers(channelId);

    console.log(chalk.gray(`${members.length} member(s):`));
    for (const m of members) {
      const tag = m.memberAddress === me ? chalk.green(" (you)") : "";
      console.log(" ", m.memberAddress + tag);
      console.log(chalk.gray("    cap "), m.memberCapId);
    }
  } catch (err: any) {
    console.error(chalk.red("members failed:"), err.message);
  }
}
