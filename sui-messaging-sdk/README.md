# 🔐 Sui Chat CLI

Encrypted CLI chatroom built on the **Sui Stack Messaging SDK**, with an **AI bot** powered by Groq (free tier).

- Messages are **end-to-end encrypted** via **Seal**
- Stored on the **Sui blockchain** (testnet)
- Bot auto-replies using **Llama 3.3 70B** via Groq

## Stack

| Component | Tech |
|---|---|
| Messaging | `@mysten/messaging` + `@mysten/seal` + `@mysten/sui` |
| AI Bot | `groq-sdk` (free tier, no credit card) |
| CLI | `commander` + `chalk` |
| Runtime | TypeScript via `tsx` (no build step) |
| Network | Sui Testnet |

## Setup

### Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

```env
# User wallet (Ed25519 private key starting with "suiprivkey...")
SUI_PRIVATE_KEY=suiprivkey...

# Bot wallet — MUST be a different wallet from SUI_PRIVATE_KEY
BOT_PRIVATE_KEY=suiprivkey...

# Groq API key — get one at https://console.groq.com/keys (free)
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

NETWORK=testnet
BOT_POLL_INTERVAL_MS=5000
```

> ⚠️ Faucet testnet SUI to **both** wallets at https://faucet.sui.io — bot needs gas to reply.

## Usage

```bash
# Create a chat room (optionally with initial members)
npm run dev -- create-room [0xALICE... 0xBOB...]

# List rooms you belong to
npm run dev -- list-rooms

# Invite a member (creator only — invite the bot's wallet here)
npm run dev -- invite <channelId> <address>

# See members of a room
npm run dev -- members <channelId>

# Enter the chatroom — read history + send messages interactively
npm run dev -- chat <channelId>
#   > type your message and press Enter
#   > type /quit to exit
```

## AI Bot

```bash
# Start the bot (long-running — keep this terminal open)
npm run bot
```

The bot will:
1. Discover every channel its wallet is a member of
2. Poll each channel every 5 seconds for new messages
3. Skip its own messages and reply to everyone else via Groq

### Typical flow

```bash
# Terminal 1 — create a room
npm run dev -- create-room

# Terminal 1 — invite the bot (grab the bot address from its startup log)
npm run dev -- invite <channelId> 0xBOT_ADDRESS

# Terminal 2 — start the bot
npm run bot

# Terminal 1 — chat with the bot
npm run dev -- chat <channelId>
```