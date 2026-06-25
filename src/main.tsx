import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if (typeof document !== "undefined") {
  document.body.removeAttribute("data-scroll-locked");
  document.body.style.pointerEvents = "";
  document
    .querySelectorAll('[data-radix-focus-guard], body > [data-state="open"][role="dialog"], body > [data-state="open"].fixed')
    .forEach((node) => node.remove());
}

createRoot(document.getElementById("root")!).render(<App />);
