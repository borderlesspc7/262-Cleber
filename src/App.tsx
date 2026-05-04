import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AppRoutes } from "./routes/AppRoutes";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster, type ToastPosition } from "react-hot-toast";
import "./styles/toast.css";

const VIEWPORT_COMPACT_QUERY = "(max-width: 1024px)";

function subscribeCompactViewport(onChange: () => void): () => void {
  const mq = window.matchMedia(VIEWPORT_COMPACT_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useCompactViewport(): boolean {
  return useSyncExternalStore(
    subscribeCompactViewport,
    () => window.matchMedia(VIEWPORT_COMPACT_QUERY).matches,
    () => true
  );
}

function ResponsiveToaster() {
  const isCompact = useCompactViewport();

  /* Em telas estreitas, centro garante toast inteiro; desktop mantém canto direito */
  const position: ToastPosition = isCompact ? "top-center" : "top-right";
  const containerInset = isCompact ? 10 : 16;

  return createPortal(
    <Toaster
      position={position}
      reverseOrder={false}
      gutter={isCompact ? 10 : 8}
      containerClassName="app-toaster"
      containerStyle={{
        top: `max(${containerInset}px, env(safe-area-inset-top, 0px))`,
        left: `max(${containerInset}px, env(safe-area-inset-left, 0px))`,
        right: `max(${containerInset}px, env(safe-area-inset-right, 0px))`,
        bottom: "max(16px, env(safe-area-inset-bottom, 0px))",
      }}
      toastOptions={{
        duration: 3500,
        className: "app-toast-surface",
        style: {
          background: "rgba(255, 255, 255, 0.98)",
          color: "#1a202c",
          borderRadius: "16px",
          padding: isCompact ? "12px 16px" : "16px 24px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          fontSize: isCompact ? "14px" : "15px",
          fontWeight: "500",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        },
        success: {
          duration: 3000,
          style: {
            background:
              "linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)",
            color: "#fff",
            boxShadow:
              "0 20px 25px -5px rgba(16, 185, 129, 0.3), 0 10px 10px -5px rgba(16, 185, 129, 0.2)",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#10b981",
          },
        },
        error: {
          duration: 4000,
          style: {
            background:
              "linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)",
            color: "#fff",
            boxShadow:
              "0 20px 25px -5px rgba(239, 68, 68, 0.3), 0 10px 10px -5px rgba(239, 68, 68, 0.2)",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#ef4444",
          },
        },
        loading: {
          style: {
            background:
              "linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%)",
            color: "#fff",
            boxShadow:
              "0 20px 25px -5px rgba(59, 130, 246, 0.3), 0 10px 10px -5px rgba(59, 130, 246, 0.2)",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#3b82f6",
          },
        },
      }}
    />,
    document.body
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
        <ResponsiveToaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
