import chalk from "chalk";
import { createUserClient } from "../client.js";

export async function listRooms() {
  const { messagingClient, keypair } = createUserClient();
  const me = keypair.toSuiAddress();

  try {
    const { memberships } = await messagingClient.getChannelMemberships({ address: me });

    if (memberships.length === 0) {
      console.log(chalk.yellow("no channels yet — use `create-room` to make one"));
      return;
    }

    console.log(chalk.gray(`${memberships.length} channel(s):`));
    for (const m of memberships) {
      console.log(" ", m.channel_id);
      console.log(chalk.gray("    cap "), m.member_cap_id);
    }
  } catch (err: any) {
    console.error(chalk.red("list failed:"), err.message);
  }
}
