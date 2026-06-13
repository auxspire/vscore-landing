import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const staticFallback = document.getElementById("static-fallback");
if (staticFallback) {
  staticFallback.remove();
}

createRoot(document.getElementById("root")!).render(<App />);
