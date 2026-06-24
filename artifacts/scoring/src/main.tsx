import React from "react";
import { createRoot } from "react-dom/client";
import { getMissingSupabaseEnvVars } from "./lib/supabase-env";
import SupabaseConfigError from "./components/SupabaseConfigError";
import "./index.css";

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const base = import.meta.env.BASE_URL ?? "/app/";
  const swUrl = `${base.endsWith("/") ? base : `${base}/`}sw.js`;
  void navigator.serviceWorker.register(swUrl).catch(() => {
    // Non-fatal — app works without PWA install
  });
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

const root = createRoot(rootEl);
const missing = getMissingSupabaseEnvVars();

if (missing.length > 0) {
  root.render(<SupabaseConfigError missing={missing} />);
} else {
  registerServiceWorker();
  void import("./App.tsx").then(({ default: App }) => {
    root.render(<App />);
  });
}
