import chalk from "chalk";
import { createUserClient } from "../client.js";

export async function inviteMember(channelId: string, addresses: string[]) {
  const { messagingClient, keypair } = createUserClient();
  const me = keypair.toSuiAddress();

  const memberCap = await messagingClient.getUserMemberCap(me, channelId);
  if (!memberCap) throw new Error("not a member of this channel");

  console.log(chalk.gray("inviting"), addresses.join(", "));

  try {
    const { digest, addedMembers } = await messagingClient.executeAddMembersTransaction({
      signer: keypair,
      channelId,
      memberCapId: memberCap.id.id,
      newMemberAddresses: addresses,
    });

    console.log(chalk.green(`added ${addedMembers.length} member(s):`));
    for (const { memberCap: cap, ownerAddress } of addedMembers) {
      console.log(" ", ownerAddress);
      console.log(chalk.gray("    cap "), cap.id.id);
    }
    console.log(chalk.gray("tx"), digest);
  } catch (err: any) {
    console.error(chalk.red("invite failed:"), err.message);
    console.log(chalk.gray("(only the channel creator can invite)"));
  }
}
