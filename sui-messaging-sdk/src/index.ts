#!/usr/bin/env node
import { Command } from "commander";
import { createRoom } from "./commands/create-room.js";
import { listRooms } from "./commands/list-rooms.js";
import { listMembers } from "./commands/members.js";
import { inviteMember } from "./commands/invite.js";
import { interactiveChat } from "./commands/chat.js";

const program = new Command();
program
  .name("sui-chat")
  .description("encrypted CLI chatroom on Sui (Seal + Walrus) with a Groq AI bot")
  .version("1.0.0");

program
  .command("create-room")
  .description("create a new encrypted chat room")
  .argument("[members...]", "sui addresses to invite at creation")
  .action((members: string[]) => createRoom(members ?? []));

program
  .command("list-rooms")
  .description("list rooms you belong to")
  .action(listRooms);

program
  .command("chat")
  .description("join a room — read history, send messages")
  .argument("<channelId>")
  .action(interactiveChat);

program
  .command("invite")
  .description("invite members (creator only)")
  .argument("<channelId>")
  .argument("<addresses...>")
  .action(inviteMember);

program
  .command("members")
  .description("list members of a room")
  .argument("<channelId>")
  .action(listMembers);

program.parse();
