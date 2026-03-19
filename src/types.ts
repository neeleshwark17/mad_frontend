export type ComplexityLevel = "simple" | "moderate" | "complex";

export interface VotingResults {
  votes: Record<string, number>;
  ranking: string[];
}

export interface SynthesisResult {
  content: string;
  top_providers: string[];
  scores_used: Record<string, number>;
}

export interface CritiqueRound {
  round_index: number;
  critiques: Record<string, string>;
}

export interface RefinementRound {
  round_index: number;
  responses: Record<string, string>;
}

export interface FollowupMessage {
  role: "user" | "synthesizer";
  content: string;
}

export interface DebateSessionState {
  session_id: string;
  question: string;
  task_domain: string;
  complexity: ComplexityLevel;
  initial_responses: Record<string, string>;
  critique_rounds: CritiqueRound[];
  refinement_rounds: RefinementRound[];
  voting_results: VotingResults | null;
  synthesis: SynthesisResult | null;
  followup_messages: FollowupMessage[];
  providers_used: string[];
}

export interface DebateResponse {
  session_id: string;
  answer: string;
  debate: DebateSessionState | null;
  complexity: ComplexityLevel;
  duration_seconds: number;
}

export interface DebateRequest {
  question: string;
  task_domain?: string;
  show_debate?: boolean;
  max_rounds?: number;
  providers?: string[];
}

export interface ProviderOption {
  id: string;
  label: string;
  available: boolean;
}

/** Default list of 15 famous models so selector is always visible; API updates availability. */
export const DEFAULT_PROVIDERS: ProviderOption[] = [
  { id: "openai", label: "GPT-4o Mini (OpenAI)", available: false },
  { id: "claude", label: "Claude 3.5 Sonnet (Anthropic)", available: false },
  { id: "deepseek", label: "DeepSeek Chat", available: false },
  { id: "gemini", label: "Gemini 2.0 (Google)", available: false },
  { id: "xai", label: "Grok (xAI)", available: false },
  { id: "mistral", label: "Mistral Large", available: false },
  { id: "mixtral", label: "Mixtral 8x22B", available: false },
  { id: "cohere", label: "Cohere Command R+", available: false },
  { id: "command_r", label: "Command R+ (Cohere)", available: false },
  { id: "groq", label: "Llama 3.3 70B (Groq)", available: false },
  { id: "llama", label: "Llama (Groq)", available: false },
  { id: "qwen", label: "Qwen (Coming soon)", available: false },
  { id: "phi", label: "Phi-3 (Coming soon)", available: false },
  { id: "claude_haiku", label: "Claude Haiku (Coming soon)", available: false },
  { id: "gemini_flash", label: "Gemini Flash (Coming soon)", available: false },
];
