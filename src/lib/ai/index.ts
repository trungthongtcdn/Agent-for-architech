import { config } from "../config";
import { geminiProvider } from "./gemini";
import { mockProvider } from "./mock";
import type { AiProvider } from "./types";

export function provider(): AiProvider {
  return config.aiMode === "gemini" ? geminiProvider : mockProvider;
}

export { AiError } from "./types";
