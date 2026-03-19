import { useState, useCallback, useEffect, useRef } from "react";
import { healthCheck, getEstimate, streamDebate, streamFollowup } from "./api";
import type { DebateResponse, ProviderOption } from "./types";
import { DEFAULT_PROVIDERS } from "./types";
import { LoadingStages } from "./LoadingStages";
import { ModelCard } from "./ModelCard";
import { ChatTranscript } from "./ChatTranscript";
import { Sidebar } from "./components/Sidebar";
import { GoogleSignIn } from "./components/GoogleSignIn";
import { useAuth } from "./context/AuthContext";
import { useHistory } from "./context/HistoryContext";
import type { HistoryEntry } from "./context/HistoryContext";
import "./App.css";

const STAGES = [
  "Round 1 — Independent responses",
  "Cross critique",
  "Refinement",
  "Voting round",
  "Final synthesis",
] as const;

export default function App() {
  /* ── Layout ── */
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  /* ── Auth / history ── */
  const { user } = useAuth();
  const { add: addHistory } = useHistory();

  /* ── Debate state ── */
  const [question, setQuestion] = useState("");
  const [taskDomain, setTaskDomain] = useState("general");
  const [showDebate, setShowDebate] = useState(true);
  const [providers, setProviders] =
    useState<ProviderOption[]>(DEFAULT_PROVIDERS);
  const [selectedProviderIds, setSelectedProviderIds] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [result, setResult] = useState<DebateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<{
    cost: number;
    method: string;
  } | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const estimateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Init: load providers ── */
  useEffect(() => {
    healthCheck()
      .then((r) => {
        const fromApi = r.providers || [];
        if (fromApi.length > 0) {
          setProviders(fromApi);
          const availableIds = fromApi
            .filter((p) => p.available)
            .map((p) => p.id);
          setSelectedProviderIds(new Set(availableIds));
        }
      })
      .catch(() => {});
  }, []);

  /* ── Debounced cost estimate ── */
  useEffect(() => {
    if (result?.session_id) {
      setEstimate(null);
      setEstimateLoading(false);
      return;
    }

    const selected = Array.from(selectedProviderIds);
    if (selected.length === 0 || question.trim().length < 15) {
      setEstimate(null);
      setEstimateLoading(false);
      return;
    }
    if (estimateTimeoutRef.current) clearTimeout(estimateTimeoutRef.current);
    setEstimateLoading(true);
    estimateTimeoutRef.current = setTimeout(() => {
      getEstimate(question.trim() || " ", selected)
        .then((r) =>
          setEstimate({
            cost: r.estimated_cost_usd,
            method: r.estimation_method || "heuristic",
          }),
        )
        .catch(() => setEstimate(null))
        .finally(() => {
          setEstimateLoading(false);
          estimateTimeoutRef.current = null;
        });
    }, 1200);
    return () => {
      if (estimateTimeoutRef.current) clearTimeout(estimateTimeoutRef.current);
    };
  }, [question, selectedProviderIds, result?.session_id]);

  const toggleProvider = (id: string) => {
    setSelectedProviderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllAvailable = () => {
    setSelectedProviderIds(
      new Set(providers.filter((p) => p.available).map((p) => p.id)),
    );
  };

  const startNewChat = () => {
    setQuestion("");
    setResult(null);
    setError(null);
    setActiveHistoryId(null);
  };

  const loadHistoryEntry = (entry: HistoryEntry) => {
    setQuestion(entry.question);
    setResult({
      session_id: entry.id,
      answer: entry.answer,
      debate: (entry.debate as any) ?? null,
      complexity: entry.complexity as DebateResponse["complexity"],
      duration_seconds: 0,
    });
    setActiveHistoryId(entry.id);
    setError(null);
  };

  const submit = useCallback(async () => {
    if (!question.trim()) return;
    const isFollowupMode = !!result?.session_id;

    const selected = Array.from(selectedProviderIds);
    if (!isFollowupMode && selected.length === 0) {
      setError("Select at least one model for the chat.");
      return;
    }
    setError(null);
    setLoading(true);

    if (isFollowupMode) {
      const originalMessage = question.trim();
      setQuestion(""); // Optimistically clear input

      const cleanup = streamFollowup(
        result.session_id,
        originalMessage,
        (state) => {
          setResult((current) =>
            current ? { ...current, debate: state } : null,
          );
        },
        () => {
          setLoading(false);
          setResult((current) => {
            if (current?.debate) {
              addHistory({
                id: current.session_id,
                question: current.debate.question, // The original question
                answer: current.answer,
                providers: selected,
                complexity: current.complexity,
                debate: current.debate,
                cost: estimate?.cost ?? null,
                timestamp: Date.now(),
              });
            }
            return current;
          });
        },
        (err) => {
          setError(err);
          setLoading(false);
        },
      );
      return cleanup;
    }

    // Default: Start new chat
    const originalMessage = question.trim();
    setQuestion("");
    setResult(null);
    setLoadingStage(0);

    const cleanup = streamDebate(
      {
        question: originalMessage,
        task_domain: taskDomain.trim() || "general",
        show_debate: showDebate,
        providers: selected,
      },
      (state) => {
        // Update partial result so ChatTranscript can render it
        setResult({
          session_id: state.session_id,
          answer: state.synthesis?.content || "",
          complexity: state.complexity,
          duration_seconds: 0,
          debate: state,
        });

        // Progress stage based on what's in state
        if (state.synthesis) setLoadingStage(4);
        else if (state.voting_results) setLoadingStage(3);
        else if (state.refinement_rounds?.length) setLoadingStage(2);
        else if (state.critique_rounds?.length) setLoadingStage(1);
        else setLoadingStage(0);
      },
      () => {
        setLoading(false);
        // After [DONE], we can finalise the history
        setResult((current) => {
          if (current?.debate) {
            addHistory({
              id: current.session_id,
              question: originalMessage,
              answer: current.answer,
              providers: selected,
              complexity: current.complexity,
              debate: current.debate,
              cost: estimate?.cost ?? null,
              timestamp: Date.now(),
            });
          }
          return current;
        });
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return cleanup;
  }, [
    question,
    taskDomain,
    showDebate,
    selectedProviderIds,
    estimate,
    addHistory,
    result?.session_id,
  ]);

  /* ── Sidebar width offset ── */
  const sidebarWidth = sidebarCollapsed ? 56 : 260;

  return (
    <div className="layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
        onSelectHistory={loadHistoryEntry}
        activeId={activeHistoryId}
        onNewChat={startNewChat}
      />

      <div className="main-pane" style={{ marginLeft: sidebarWidth }}>
        {/* Top bar */}
        <div className="topbar">
          <span className="topbar-title">Multi-LLM Critique Engine</span>
          <div className="topbar-right">
            {user ? (
              <div className="topbar-user">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="topbar-avatar"
                  referrerPolicy="no-referrer"
                />
                <span className="topbar-username">{user.name}</span>
              </div>
            ) : (
              <button
                className="topbar-signin-btn"
                onClick={() => setShowSignIn(true)}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Sign in
              </button>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="content">
          <header className="header">
            <h1>Multi-LLM Critique Engine</h1>
            <p className="tagline">
              Adversarial model collaboration for higher-quality answers
            </p>
          </header>

          <main>
            <section className="model-selector-section">
              <div className="model-selector">
                <div className="model-selector-header">
                  <span className="model-selector-title">
                    Select models for the chat
                  </span>
                  <button
                    type="button"
                    className="select-all-btn"
                    onClick={selectAllAvailable}
                    disabled={loading}
                  >
                    Select all available
                  </button>
                </div>
                <p className="model-selector-hint">
                  {!result?.session_id
                    ? "Choose which LLMs participate — multiple selections allowed."
                    : "Note: Debate is complete. Further messages will continue the chat with the Final Synthesizer."}
                </p>
                <div
                  className="model-cards-grid"
                  role="group"
                  aria-label="LLM model selection"
                >
                  {providers.map((p) => (
                    <ModelCard
                      key={p.id}
                      provider={p}
                      selected={selectedProviderIds.has(p.id)}
                      disabled={loading || !p.available}
                      onToggle={() => toggleProvider(p.id)}
                    />
                  ))}
                </div>
                {selectedProviderIds.size > 0 && (
                  <p className="model-selector-count">
                    {selectedProviderIds.size} model
                    {selectedProviderIds.size !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            </section>

            <section className="input-section" style={{ marginTop: "1.5rem" }}>
              <textarea
                className="question-input"
                placeholder="Ask a question or give a topic to critique…"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
                disabled={loading}
              />

              <div className="submit-row">
                <div className="cost-estimate" aria-live="polite">
                  {estimateLoading && selectedProviderIds.size > 0 ? (
                    <span className="cost-estimate-loading">
                      Estimating cost…
                    </span>
                  ) : estimate && selectedProviderIds.size > 0 ? (
                    <span className="cost-estimate-value">
                      Estimated cost:{" "}
                      <strong>
                        ~$
                        {estimate.cost < 0.005
                          ? "<0.01"
                          : estimate.cost.toFixed(2)}
                      </strong>{" "}
                      USD
                      <span className="cost-estimate-meta">
                        {" "}
                        ({estimate.method})
                      </span>
                    </span>
                  ) : question.trim().length > 0 &&
                    question.trim().length < 15 ? (
                    <span className="cost-estimate-loading">
                      Type at least 15 characters for a real estimate
                    </span>
                  ) : null}
                </div>
                <button
                  className="submit-btn"
                  onClick={submit}
                  disabled={
                    loading ||
                    !question.trim() ||
                    (!result?.session_id && selectedProviderIds.size === 0)
                  }
                >
                  {loading
                    ? "Chatting…"
                    : result?.session_id
                      ? "Send follow-up"
                      : "Start chat"}
                </button>
              </div>

              <div className="options" style={{ marginTop: "1rem" }}>
                <label>
                  <span>Task domain</span>
                  <input
                    type="text"
                    value={taskDomain}
                    onChange={(e) => setTaskDomain(e.target.value)}
                    placeholder="e.g. physics, law, general"
                    disabled={loading}
                  />
                </label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={showDebate}
                    onChange={(e) => setShowDebate(e.target.checked)}
                    disabled={loading}
                  />
                  <span>View full chat log</span>
                </label>
              </div>
            </section>

            {loading && (
              <LoadingStages stages={STAGES} current={loadingStage} />
            )}

            {error && <div className="error-box">{error}</div>}

            {(loading || result) && (
              <section className="result-section" style={{ marginTop: "2rem" }}>
                {result && !loading && (
                  <div className="result-meta">
                    <span className="complexity">
                      Complexity: {result.complexity}
                    </span>
                    {result.duration_seconds > 0 && (
                      <span className="duration">
                        {result.duration_seconds}s
                      </span>
                    )}
                  </div>
                )}

                <ChatTranscript
                  debate={result?.debate ?? null}
                  question={result?.debate?.question ?? question}
                  finalAnswer={result?.answer ?? ""}
                  isLoading={loading}
                  selectedProviderIds={Array.from(selectedProviderIds)}
                />
              </section>
            )}
          </main>
        </div>
      </div>

      {showSignIn && <GoogleSignIn onClose={() => setShowSignIn(false)} />}
    </div>
  );
}
