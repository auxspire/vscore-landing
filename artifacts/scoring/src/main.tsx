import React from "react";
import { createRoot } from "react-dom/client";
import { getMissingSupabaseEnvVars } from "./lib/supabase-env";
import SupabaseConfigError from "./components/SupabaseConfigError";
import { parseMatchIdFromPath } from "./utils/urlRouting";
import "./index.css";

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const base = import.meta.env.BASE_URL ?? "/app/";
  const swUrl = `${base.endsWith("/") ? base : `${base}/`}sw.js`;
  void navigator.serviceWorker.register(swUrl).catch(() => {});
}

function getBasePath(): string {
  const base = import.meta.env.BASE_URL ?? "/app/";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

const root = createRoot(rootEl);
const missing = getMissingSupabaseEnvVars();
const spectatorMatchId = parseMatchIdFromPath(window.location.pathname, getBasePath());

if (missing.length > 0) {
  root.render(<SupabaseConfigError missing={missing} />);
} else if (spectatorMatchId) {
  registerServiceWorker();
  void import("./components/SpectatorMatchScreen.tsx").then(({ default: SpectatorMatchScreen }) => {
    root.render(
      <SpectatorMatchScreen
        matchId={spectatorMatchId}
        onBack={() => {
          window.location.href = getBasePath() + "/";
        }}
      />,
    );
  });
} else {
  registerServiceWorker();
  void import("./App.tsx")
    .then(({ default: App }) => {
      root.render(<App />);
    })
    .catch((err) => {
      console.error("[VScor] Failed to load app:", err);
      root.render(
        <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 480, margin: "0 auto" }}>
          <h1 style={{ color: "#6d28d9" }}>VScor failed to start</h1>
          <p>Try a hard refresh. If this persists, clear site data for vscor.in and reopen the app.</p>
        </div>,
      );
    });
}
