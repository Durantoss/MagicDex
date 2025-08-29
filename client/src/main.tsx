import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Add polyfills for older browsers
if (!window.requestIdleCallback) {
  window.requestIdleCallback = function (cb: IdleRequestCallback) {
    const start = Date.now();
    return setTimeout(function () {
      cb({
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1) as unknown as number;
  };
}

if (!window.cancelIdleCallback) {
  window.cancelIdleCallback = function (id: number) {
    clearTimeout(id);
  };
}

// Error boundary for better error handling
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "#1a1a2e",
            color: "white",
          }}
        >
          <h1>Something went wrong</h1>
          <p>Please refresh the page to try again.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#e94560",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              marginTop: "1rem",
              minWidth: "44px",
              minHeight: "44px",
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize app
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

// Lazy load App
const App = lazy(() => import("./App"));

// Render with error boundary and suspense
root.render(
  <ErrorBoundary>
    <Suspense fallback={<div>Loading…</div>}>
      <App />
    </Suspense>
  </ErrorBoundary>
);

// Mark app as loaded
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.body.classList.add("app-loaded");
  }, 100);
   // Haptic feedback for buttons
  document.querySelectorAll('button, .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (navigator.vibrate) navigator.vibrate(15);
  });
});
});

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) =>
        console.log("Service Worker registered:", reg.scope)
      )
      .catch((err) =>
        console.error("Service Worker registration failed:", err)
      );
  });
}
