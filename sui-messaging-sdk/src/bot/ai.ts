import Groq from "groq-sdk";
import { config } from "../config.js";

const groq = new Groq({ apiKey: config.groqApiKey });

const SYSTEM = `You are a chatbot in a Sui-based encrypted chatroom.
Topics you know: Sui, Move, Web3, DeFi/NFTs/DAOs, Walrus storage, Seal encryption, general dev.

Messages on chain are capped at 512 bytes. Thai = 3 bytes/char so keep Thai replies under ~150 chars,
English under ~400 chars. Answer in 1–3 sentences, no lectures.
Reply in whatever language the user wrote in.`;

type Msg = { role: "user" | "assistant"; content: string };

export async function getAIResponse(text: string, history: Msg[] = []): Promise<string> {
  try {
    const res = await groq.chat.completions.create({
      model: config.groqModel,
      max_tokens: 150,
      messages: [
        { role: "system", content: SYSTEM },
        ...history.slice(-10),
        { role: "user", content: text },
      ],
    });
    return res.choices[0]?.message?.content ?? "(no response)";
  } catch (err: any) {
    console.error("groq:", err.message);
    return "(bot unreachable)";
  }
}
