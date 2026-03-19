import { useState } from "react";
import type { ProviderOption } from "./types";
import { MODEL_LOGO_URLS, MODEL_INITIALS, MODEL_COLORS } from "./modelLogos";
import "./ModelCard.css";

interface ModelCardProps {
  provider: ProviderOption;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export function ModelCard({ provider, selected, disabled, onToggle }: ModelCardProps) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = MODEL_LOGO_URLS[provider.id];
  const initial = MODEL_INITIALS[provider.id] ?? provider.id.slice(0, 2).toUpperCase();
  const brandColor = MODEL_COLORS[provider.id] || "var(--accent)";
  const badgeText = provider.label.toLowerCase().includes("coming soon") ? "Soon" : "No API key";

  return (
    <label
      className={`model-card ${disabled ? "disabled" : ""} ${selected ? "selected" : ""}`}
      onClick={(e) => {
        if (disabled) return;
        e.preventDefault();
        onToggle();
      }}
      style={
        {
          "--brand-color": brandColor,
        } as React.CSSProperties
      }
    >
      <input
        type="checkbox"
        checked={selected}
        readOnly
        tabIndex={-1}
        disabled={disabled}
        aria-label={`Include ${provider.label} in chat`}
        className="model-card-input"
      />
      <div className="model-card-image-wrap">
        {logoUrl && !imgError ? (
          <img
            src={logoUrl}
            alt=""
            className="model-card-image"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="model-card-initial" aria-hidden>
            {initial}
          </span>
        )}
      </div>
      <span className="model-card-label">{provider.label}</span>
      {!provider.available && (
        <span className="model-card-badge">{badgeText}</span>
      )}
    </label>
  );
}
