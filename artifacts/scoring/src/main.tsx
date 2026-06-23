import React from "react";
import { createRoot } from "react-dom/client";
import { getMissingSupabaseEnvVars } from "./lib/supabase-env";
import SupabaseConfigError from "./components/SupabaseConfigError";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

const root = createRoot(rootEl);
const missing = getMissingSupabaseEnvVars();

if (missing.length > 0) {
  root.render(<SupabaseConfigError missing={missing} />);
} else {
  void import("./App.tsx").then(({ default: App }) => {
    root.render(<App />);
  });
}
