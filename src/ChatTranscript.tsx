import type { DebateSessionState } from "./types";
import { useEffect, useMemo, useState, useRef } from "react";
import { MODEL_COLORS, MODEL_LOGO_URLS, MODEL_INITIALS } from "./modelLogos";
import "./ChatTranscript.css";

type ChatMessage = {
  id: string;
  kind: "separator" | "user" | "model" | "judge" | "synthesizer";
  senderLabel?: string;
  providerId?: string;
  content?: string;
};

function providerFallbackLabel(providerId: string) {
  const map: Record<string, string> = {
    openai: "OpenAI",
    claude: "Claude",
    deepseek: "DeepSeek",
    gemini: "Gemini",
    xai: "xAI (Grok)",
    mistral: "Mistral",
    mixtral: "Mixtral",
    cohere: "Cohere",
    command_r: "Cohere (Command R+)",
    groq: "Groq (Llama)",
    llama: "Llama",
    qwen: "Qwen",
    phi: "Phi",
    claude_haiku: "Claude Haiku",
    gemini_flash: "Gemini Flash",
  };
  return map[providerId] ?? providerId;
}

function Avatar({ providerId, label }: { providerId?: string; label: string }) {
  const brandColor = providerId ? MODEL_COLORS[providerId] : undefined;
  const logo = providerId ? MODEL_LOGO_URLS[providerId] : undefined;
  const initials = providerId
    ? MODEL_INITIALS[providerId]
    : label.slice(0, 2).toUpperCase();
  return (
    <div
      className="chat-avatar"
      style={
        {
          "--brand-color": brandColor ?? "var(--accent)",
        } as any
      }
    >
      {logo ? (
        <img src={logo} alt="" className="chat-avatar-img" />
      ) : (
        <span className="chat-avatar-initials">{initials}</span>
      )}
    </div>
  );
}

export function ChatTranscript({
  debate,
  question,
  finalAnswer,
  isLoading,
  selectedProviderIds,
}: {
  debate: DebateSessionState | null;
  question: string;
  finalAnswer: string;
  isLoading: boolean;
  selectedProviderIds?: string[];
}) {
  const messages: ChatMessage[] = useMemo(() => {
    const out: ChatMessage[] = [];

    if (debate?.question) {
      out.push({
        id: "u-0",
        kind: "user",
        senderLabel: "You",
        content: debate.question,
      });
    } else if (question.trim()) {
      out.push({
        id: "u-0",
        kind: "user",
        senderLabel: "You",
        content: question.trim(),
      });
    }

    if (debate) {
      // Phase 1: Independent responses
      out.push({
        id: "sep-r1",
        kind: "separator",
        content: "Round 1 — Independent responses",
      });
      for (const [providerId, text] of Object.entries(
        debate.initial_responses || {},
      )) {
        out.push({
          id: `m-init-${providerId}`,
          kind: "model",
          senderLabel: providerFallbackLabel(providerId),
          providerId,
          content: text,
        });
      }

      // Phase 2: Cross critique + Phase 3: Refinement
      for (const [idx, cr] of (debate.critique_rounds || []).entries()) {
        out.push({
          id: `sep-crit-${idx}`,
          kind: "separator",
          content: `Critique round ${idx + 1}`,
        });
        for (const [providerId, text] of Object.entries(cr.critiques || {})) {
          out.push({
            id: `m-crit-${idx}-${providerId}`,
            kind: "model",
            senderLabel: providerFallbackLabel(providerId),
            providerId,
            content: text,
          });
        }
      }
      for (const [idx, rr] of (debate.refinement_rounds || []).entries()) {
        out.push({
          id: `sep-ref-${idx}`,
          kind: "separator",
          content: `Refinement round ${idx + 1}`,
        });
        for (const [providerId, text] of Object.entries(rr.responses || {})) {
          out.push({
            id: `m-ref-${idx}-${providerId}`,
            kind: "model",
            senderLabel: providerFallbackLabel(providerId),
            providerId,
            content: text,
          });
        }
      }

      // Phase 4: Voting round
      if (debate.voting_results) {
        out.push({
          id: "sep-voting",
          kind: "separator",
          content: "Voting round",
        });
        const ranking = debate.voting_results.ranking?.length
          ? debate.voting_results.ranking.join(" → ")
          : "-";
        out.push({
          id: "voting-0",
          kind: "judge",
          senderLabel: "Voting System",
          content: `Ranking: ${ranking}\n\nVotes:\n${JSON.stringify(debate.voting_results.votes, null, 2)}`,
        });
      }

      // Phase 5: Final synthesis
      if (debate.synthesis?.content) {
        out.push({
          id: "sep-synth",
          kind: "separator",
          content: "Final synthesis",
        });
        out.push({
          id: "synth-0",
          kind: "synthesizer",
          senderLabel: "Synthesizer",
          content: debate.synthesis.content,
        });
      }

      // Phase 6: Follow-up messages
      if (debate.followup_messages && debate.followup_messages.length > 0) {
        for (const [idx, msg] of debate.followup_messages.entries()) {
          const isUser = msg.role === "user";
          out.push({
            id: `fup-${idx}`,
            kind: isUser ? "user" : "synthesizer",
            senderLabel: isUser ? "You" : "Synthesizer",
            content: msg.content,
          });
        }
      }

      // If waiting for synthesis to finish
      if (isLoading && debate.synthesis?.content) {
        const lastMsg =
          debate.followup_messages?.[debate.followup_messages.length - 1];
        if (!lastMsg || lastMsg.role === "user") {
          out.push({
            id: "sk-fup",
            kind: "synthesizer",
            senderLabel: "Synthesizer",
            content: "Generating response…",
          });
        }
      }
    } else {
      // While the debate is running and state is not yet established
      // rely entirely on LoadingStages. No fake skeleton timeline will animate.
      // Minimal transcript (debate hidden)
      if (!isLoading) {
        out.push({
          id: "sep-final",
          kind: "separator",
          content: "Final synthesis",
        });
        out.push({
          id: "synth-0",
          kind: "synthesizer",
          senderLabel: "Synthesizer",
          content: finalAnswer || "",
        });
      }
    }
    return out;
  }, [debate, question, finalAnswer, isLoading, selectedProviderIds]);

  const [visibleCount, setVisibleCount] = useState(0);
  useEffect(() => {
    if (!messages.length) {
      setVisibleCount(0);
      return;
    }
    // If we're loading and have a debate object (streaming), show all currently received messages.
    if (isLoading && debate) {
      setVisibleCount(messages.length);
      return;
    }
    // For skeleton loading (no debate yet)
    if (isLoading && !debate) {
      setVisibleCount(messages.length);
      return;
    }
    // After loading completes (history or final static result), reveal slowly.
    setVisibleCount(1);
    const t = setInterval(() => {
      setVisibleCount((v) => {
        if (v >= messages.length) {
          clearInterval(t);
          return v;
        }
        return v + 1;
      });
    }, 700);
    return () => clearInterval(t);
  }, [messages, isLoading, !!debate]);

  const visibleMessages = messages.slice(0, Math.max(1, visibleCount));

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [visibleMessages.length]);

  return (
    <div className="chat-transcript" aria-live="polite">
      {visibleMessages.map((m) => {
        if (m.kind === "separator") {
          return (
            <div key={m.id} className="chat-separator">
              {m.content}
            </div>
          );
        }

        const isUser = m.kind === "user";
        const bubbleClass = isUser
          ? "chat-bubble chat-bubble-user"
          : "chat-bubble";

        return (
          <div
            key={m.id}
            className={`chat-row ${isUser ? "chat-row-user" : ""}`}
          >
            {!isUser && (
              <Avatar
                providerId={m.providerId}
                label={m.senderLabel || "Model"}
              />
            )}
            <div
              className={bubbleClass}
              style={
                !isUser && m.providerId && MODEL_COLORS[m.providerId]
                  ? {
                      backgroundColor: `color-mix(in srgb, ${MODEL_COLORS[m.providerId]} 8%, var(--bg))`,
                    }
                  : undefined
              }
            >
              {!isUser && <div className="chat-sender">{m.senderLabel}</div>}
              <div className="chat-content">{m.content}</div>
            </div>
          </div>
        );
      })}

      {isLoading && !debate?.synthesis?.content && (
        <div className="chat-separator">
          Running debate… (responses will appear once complete)
        </div>
      )}
      <div ref={bottomRef} style={{ height: "1px" }} />
    </div>
  );
}
