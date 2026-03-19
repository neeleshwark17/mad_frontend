import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useHistory } from "../context/HistoryContext";
import type { HistoryEntry } from "../context/HistoryContext";
import "./Sidebar.css";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onSelectHistory: (entry: HistoryEntry) => void;
  activeId: string | null;
  onNewChat: () => void;
}

function timeLabel(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function groupEntries(entries: HistoryEntry[]) {
  const today: HistoryEntry[] = [];
  const yesterday: HistoryEntry[] = [];
  const older: HistoryEntry[] = [];
  const now = Date.now();
  entries.forEach((e) => {
    const diff = now - e.timestamp;
    if (diff < 86400000) today.push(e);
    else if (diff < 172800000) yesterday.push(e);
    else older.push(e);
  });
  return { today, yesterday, older };
}

export function Sidebar({ collapsed, onToggle, onSelectHistory, activeId, onNewChat }: SidebarProps) {
  const { theme, toggle: toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { entries, remove, clear } = useHistory();
  const [showSettings, setShowSettings] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const groups = groupEntries(entries);

  return (
    <>
      {/* Overlay for mobile */}
      {!collapsed && <div className="sidebar-overlay" onClick={onToggle} />}

      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        {/* Top bar */}
        <div className="sidebar-top">
          {!collapsed && (
            <span className="sidebar-brand">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              CritiqueEngine
            </span>
          )}
          <button className="sidebar-icon-btn" onClick={onToggle} title="Toggle sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </button>
        </div>

        {/* New chat */}
        <button className="new-chat-btn" onClick={onNewChat} title="New Chat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {!collapsed && <span>New Chat</span>}
        </button>

        {/* History list */}
        {!collapsed && (
          <nav className="sidebar-history">
            {entries.length === 0 ? (
              <p className="sidebar-empty">No chats yet. Start one!</p>
            ) : (
              <>
                {groups.today.length > 0 && (
                  <div className="history-group">
                    <span className="history-group-label">Today</span>
                    {groups.today.map((e) => (
                      <HistoryItem
                        key={e.id}
                        entry={e}
                        active={e.id === activeId}
                        onSelect={() => onSelectHistory(e)}
                        onDelete={() => remove(e.id)}
                      />
                    ))}
                  </div>
                )}
                {groups.yesterday.length > 0 && (
                  <div className="history-group">
                    <span className="history-group-label">Yesterday</span>
                    {groups.yesterday.map((e) => (
                      <HistoryItem
                        key={e.id}
                        entry={e}
                        active={e.id === activeId}
                        onSelect={() => onSelectHistory(e)}
                        onDelete={() => remove(e.id)}
                      />
                    ))}
                  </div>
                )}
                {groups.older.length > 0 && (
                  <div className="history-group">
                    <span className="history-group-label">Older</span>
                    {groups.older.map((e) => (
                      <HistoryItem
                        key={e.id}
                        entry={e}
                        active={e.id === activeId}
                        onSelect={() => onSelectHistory(e)}
                        onDelete={() => remove(e.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </nav>
        )}

        {/* Bottom controls */}
        <div className="sidebar-bottom">
          {/* Theme toggle */}
          <button className="sidebar-bottom-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            {!collapsed && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
          </button>

          {/* Settings */}
          <button className="sidebar-bottom-btn" onClick={() => setShowSettings(true)} title="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            {!collapsed && <span>Settings</span>}
          </button>

          {/* Account */}
          <div className="sidebar-account">
            {user ? (
              <>
                <img src={user.avatar} alt={user.name} className="account-avatar" referrerPolicy="no-referrer" />
                {!collapsed && (
                  <div className="account-info">
                    <span className="account-name">{user.name}</span>
                    <span className="account-email">{user.email}</span>
                  </div>
                )}
                {!collapsed && (
                  <button className="account-signout" onClick={signOut} title="Sign out">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>
                )}
              </>
            ) : (
              !collapsed && (
                <span className="account-guest">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Not signed in
                </span>
              )
            )}
          </div>
        </div>
      </aside>

      {/* Settings modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onClearHistory={() => { setConfirmClear(true); }}
        />
      )}

      {confirmClear && (
        <ConfirmModal
          message="Clear all chat history?"
          onConfirm={() => { clear(); setConfirmClear(false); }}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </>
  );
}

function HistoryItem({
  entry,
  active,
  onSelect,
  onDelete,
}: {
  entry: HistoryEntry;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`history-item ${active ? "active" : ""}`}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="history-item-text">{entry.question}</span>
      <span className="history-item-time">{timeLabel(entry.timestamp)}</span>
      {hovered && (
        <button
          className="history-item-delete"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

function SettingsModal({ onClose, onClearHistory }: { onClose: () => void; onClearHistory: () => void }) {
  const { theme, toggle } = useTheme();
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Settings</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="settings-row">
            <span>Theme</span>
            <button className="settings-toggle-btn" onClick={toggle}>
              {theme === "dark" ? "☀ Light mode" : "☾ Dark mode"}
            </button>
          </div>
          <div className="settings-row">
            <span>History</span>
            <button className="settings-danger-btn" onClick={() => { onClearHistory(); onClose(); }}>
              Clear all history
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Confirm</h3>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
          <div className="modal-actions">
            <button className="settings-danger-btn" onClick={onConfirm}>Yes, clear</button>
            <button className="settings-toggle-btn" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
