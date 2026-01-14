import { AppRoutes } from "./routes/AppRoutes";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3500,
          style: {
            background: "rgba(255, 255, 255, 0.98)",
            color: "#1a202c",
            borderRadius: "16px",
            padding: "16px 24px",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            fontSize: "15px",
            fontWeight: "500",
            maxWidth: "420px",
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
      />
    </AuthProvider>
  );
}

export default App;
