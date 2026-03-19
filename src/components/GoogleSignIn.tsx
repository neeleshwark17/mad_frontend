import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import "./GoogleSignIn.css";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (opts: object) => void;
          renderButton: (el: HTMLElement, opts: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function GoogleSignIn({ onClose }: { onClose: () => void }) {
  const { signIn } = useAuth();
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const scriptId = "google-gsi";
    if (!document.getElementById(scriptId)) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
      s.onload = initGoogle;
    } else {
      initGoogle();
    }

    function initGoogle() {
      if (!window.google || !btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp: { credential: string }) => {
          const payload = parseJwt(resp.credential);
          if (payload) {
            signIn({ name: payload.name, email: payload.email, avatar: payload.picture });
            onClose();
          }
        },
      });
      window.google.accounts.id.renderButton(btnRef.current!, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: "signin_with",
        logo_alignment: "left",
        width: 280,
      });
    }
  }, [signIn, onClose]);

  const handleMockSignIn = () => {
    signIn({
      name: "Demo User",
      email: "demo@critiqueengine.ai",
      avatar: `https://ui-avatars.com/api/?name=Demo+User&background=7c9eff&color=fff&size=64`,
    });
    onClose();
  };

  return (
    <div className="gsignin-backdrop" onClick={onClose}>
      <div className="gsignin-box" onClick={(e) => e.stopPropagation()}>
        <button className="gsignin-close" onClick={onClose}>✕</button>
        <div className="gsignin-logo">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h2 className="gsignin-title">Sign in to CritiqueEngine</h2>
        <p className="gsignin-sub">Save your chat history across sessions</p>

        {GOOGLE_CLIENT_ID ? (
          <div ref={btnRef} className="gsignin-google-btn" />
        ) : (
          <button className="gsignin-mock-btn" onClick={handleMockSignIn}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        )}

        <div className="gsignin-divider"><span>or</span></div>

        <button className="gsignin-demo-btn" onClick={handleMockSignIn}>
          Continue as Demo User
        </button>

        <p className="gsignin-note">
          {GOOGLE_CLIENT_ID
            ? "Your chats are saved locally and linked to your account."
            : "Set VITE_GOOGLE_CLIENT_ID in .env to enable real Google sign-in."}
        </p>
      </div>
    </div>
  );
}

function parseJwt(token: string): { name: string; email: string; picture: string } | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}
