import type { DebateRequest, DebateResponse, ProviderOption } from "./types";

const API_BASE = "/api";

export async function runDebate(req: DebateRequest): Promise<DebateResponse> {
  const res = await fetch(`${API_BASE}/debate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: req.question,
      task_domain: req.task_domain ?? "general",
      show_debate: req.show_debate ?? true,
      max_rounds: req.max_rounds,
      providers: req.providers?.length ? req.providers : undefined,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail ?? "Debate request failed");
  }
  return res.json();
}

/** ── Streaming version ── */
export function streamDebate(
  req: DebateRequest,
  onUpdate: (state: any) => void,
  onDone: () => void,
  onError: (err: string) => void
) {
  const providers = req.providers?.length ? req.providers.join(",") : "";
  const params = new URLSearchParams({
    question: req.question,
    task_domain: req.task_domain ?? "general",
    max_rounds: (req.max_rounds || 2).toString(),
    providers,
  });

  const eventSource = new EventSource(`${API_BASE}/debate/stream?${params.toString()}`);

  eventSource.onmessage = (event) => {
    if (event.data === "[DONE]") {
      eventSource.close();
      onDone();
      return;
    }
    try {
      const state = JSON.parse(event.data);
      if (state.error) {
        onError(state.error);
        eventSource.close();
      } else {
        onUpdate(state);
      }
    } catch (e) {
      console.error("Stream parse error:", e);
    }
  };

  eventSource.onerror = (e) => {
    console.error("SSE error:", e);
    onError("Streaming connection lost.");
    eventSource.close();
  };

  return () => eventSource.close();
}

export function streamFollowup(
  sessionId: string,
  message: string,
  onUpdate: (state: any) => void,
  onDone: () => void,
  onError: (err: string) => void
) {
  const params = new URLSearchParams({ message });
  const eventSource = new EventSource(`${API_BASE}/debate/${sessionId}/followup/stream?${params.toString()}`);

  eventSource.onmessage = (event) => {
    if (event.data === "[DONE]") {
      eventSource.close();
      onDone();
      return;
    }
    try {
      const state = JSON.parse(event.data);
      if (state.error) {
        onError(state.error);
        eventSource.close();
      } else {
        onUpdate(state);
      }
    } catch (e) {
      console.error("Stream parse error:", e);
    }
  };

  eventSource.onerror = (e) => {
    console.error("SSE error:", e);
    onError("Streaming connection lost.");
    eventSource.close();
  };

  return () => eventSource.close();
}

export interface HealthResponse {
  status: string;
  adapters: string[];
  providers: ProviderOption[];
}

export async function healthCheck(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export interface EstimateResponse {
  estimated_cost_usd: number;
  currency: string;
  question_tokens_approx: number;
  num_providers: number;
  max_rounds: number;
  estimation_method: string;
  breakdown?: Array<{ phase: string; provider: string; cost_usd: number }>;
}

export async function getEstimate(question: string, providers: string[]): Promise<EstimateResponse> {
  const res = await fetch(`${API_BASE}/estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: question || " ",
      providers,
      max_rounds: 2,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail ?? "Estimate failed");
  }
  return res.json();
}
