import "./LoadingStages.css";

interface LoadingStagesProps {
  stages: readonly string[];
  current: number;
}

export function LoadingStages({ stages, current }: LoadingStagesProps) {
  const progressPercent = Math.min(
    100,
    Math.max(0, (current / (stages.length - 1)) * 100),
  );

  return (
    <div className="loading-stages">
      <div className="loading-stages-header">
        <span className="loading-stages-title">
          {stages[current] || "Complete"}
        </span>
        <span className="loading-stages-percent">
          {Math.round(progressPercent)}%
        </span>
      </div>
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
