import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { AuthProvider } from "./auth/AuthContext";
import TransitionProvider from "./components/motion/TransitionProvider";
import "./styles.css";
import "./create-story.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TransitionProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </TransitionProvider>
    </BrowserRouter>
  </StrictMode>,
);
