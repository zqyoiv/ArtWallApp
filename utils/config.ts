// Reads OpenAI API key from .env (EXPO_PUBLIC_OPENAI_API_KEY).
// Restart `npx expo start` after changing .env.

export function getOpenAIApiKey(): string {
  return (process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '').trim();
}

export function hasOpenAIApiKey(): boolean {
  return getOpenAIApiKey().length > 0;
}
