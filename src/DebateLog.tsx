import { useState } from "react";
import type { DebateSessionState } from "./types";
import "./DebateLog.css";

interface DebateLogProps {
  debate: DebateSessionState;
}

export function DebateLog({ debate }: DebateLogProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="debate-log">
      <button
        type="button"
        className="debate-log-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {open ? "Hide" : "View"} full chat log
      </button>
      {open && (
        <div className="debate-log-content">
          <Section title="Initial responses">
            {Object.entries(debate.initial_responses).map(([provider, text]) => (
              <Block key={provider} label={provider} content={text} />
            ))}
          </Section>
          {debate.critique_rounds.length > 0 && (
            <Section title="Critiques">
              {debate.critique_rounds.map((r) => (
                <div key={r.round_index} className="round">
                  <h4>Round {r.round_index}</h4>
                  {Object.entries(r.critiques).map(([provider, text]) => (
                    <Block key={provider} label={provider} content={text} />
                  ))}
                </div>
              ))}
            </Section>
          )}
          {debate.refinement_rounds.length > 0 && (
            <Section title="Refined answers">
              {debate.refinement_rounds.map((r) => (
                <div key={r.round_index} className="round">
                  <h4>Round {r.round_index}</h4>
                  {Object.entries(r.responses).map(([provider, text]) => (
                    <Block key={provider} label={provider} content={text} />
                  ))}
                </div>
              ))}
            </Section>
          )}
          {debate.judge_scores && (
            <Section title="Judge scores">
              <div className="scores-table">
                <div className="scores-row header">
                  <span>Provider</span>
                  <span>Logic</span>
                  <span>Depth</span>
                  <span>Accuracy</span>
                  <span>Clarity</span>
                </div>
                {debate.judge_scores.ranking.map((p) => {
                  const s = debate.judge_scores!.scores[p] ?? {};
                  return (
                    <div key={p} className="scores-row">
                      <span className="provider">{p}</span>
                      <span>{s.logic ?? "-"}</span>
                      <span>{s.depth ?? "-"}</span>
                      <span>{s.accuracy ?? "-"}</span>
                      <span>{s.clarity ?? "-"}</span>
                    </div>
                  );
                })}
              </div>
              <p className="ranking">Ranking: {debate.judge_scores.ranking.join(" → ")}</p>
            </Section>
          )}
          {debate.synthesis && (
            <Section title="Synthesis sources">
              <p>Top providers: {debate.synthesis.top_providers.join(", ")}</p>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="debate-section">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function Block({ label, content }: { label: string; content: string }) {
  return (
    <div className="debate-block">
      <span className="block-label">{label}</span>
      <pre className="block-content">{content}</pre>
    </div>
  );
}
