/**
 * Logo URLs for each model (favicons/official assets).
 * Fallback to letter avatar in ModelCard if load fails.
 */
export const MODEL_LOGO_URLS: Record<string, string> = {
  openai: "https://static.openai.com/favicon.ico",
  claude: "https://www.anthropic.com/favicon.ico",
  deepseek: "https://www.deepseek.com/favicon.ico",
  gemini: "https://www.google.com/favicon.ico",
  xai: "https://x.ai/favicon.ico",
  mistral: "https://mistral.ai/favicon.ico",
  mixtral: "https://mistral.ai/favicon.ico",
  cohere: "https://cohere.com/favicon.ico",
  command_r: "https://cohere.com/favicon.ico",
  groq: "https://groq.com/favicon.ico",
  llama: "https://groq.com/favicon.ico",
  qwen: "https://www.microsoft.com/favicon.ico",
  phi: "https://www.microsoft.com/favicon.ico",
  claude_haiku: "https://www.anthropic.com/favicon.ico",
  gemini_flash: "https://www.google.com/favicon.ico",
};

/** Brand colors for card background/hover effects */
export const MODEL_COLORS: Record<string, string> = {
  openai: "#10a37f", // OpenAI Green
  claude: "#d97757", // Anthropic Clay
  deepseek: "#4d6bfe", // DeepSeek Blue
  gemini: "#4285f4", // Google Blue
  xai: "#ffffff", // xAI White/Black (handled via CSS for contrast)
  mistral: "#f5a524", // Mistral Gold
  mixtral: "#f5a524",
  cohere: "#39594d", // Cohere Green/Dark
  command_r: "#39594d",
  groq: "#f55036", // Groq Orange
  llama: "#f55036", // Meta Blue / Groq Orange
  qwen: "#615ced", // Qwen Purple
  phi: "#00a4ef", // Microsoft Blue
  claude_haiku: "#d97757",
  gemini_flash: "#4285f4",
};

/** Fallback initial(s) for letter avatar when image fails */
export const MODEL_INITIALS: Record<string, string> = {
  openai: "GPT",
  claude: "C",
  deepseek: "D",
  gemini: "G",
  xai: "x",
  mistral: "M",
  mixtral: "Mx",
  cohere: "Co",
  command_r: "R+",
  groq: "GQ",
  llama: "L",
  qwen: "Q",
  phi: "Φ",
  claude_haiku: "H",
  gemini_flash: "GF",
};
