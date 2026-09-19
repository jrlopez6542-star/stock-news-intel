/** Modelo OpenAI barato por defecto; override con OPENAI_MODEL en .env.local */
export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function hasBenzingaKey(): boolean {
  return Boolean(process.env.BENZINGA_API_KEY?.trim());
}
