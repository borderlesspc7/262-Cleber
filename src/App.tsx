import { AppRoutes } from "./routes/AppRoutes";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            borderRadius: "12px",
            padding: "16px 20px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            fontSize: "14px",
            fontWeight: "500",
          },
          success: {
            duration: 3500,
            style: {
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            },
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4500,
            style: {
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            },
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
          loading: {
            style: {
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            },
            iconTheme: {
              primary: "#3b82f6",
              secondary: "#fff",
            },
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
