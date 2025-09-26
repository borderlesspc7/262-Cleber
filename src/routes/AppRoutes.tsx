import { BrowserRouter, Routes, Route } from "react-router-dom";
import { paths } from "./paths";
import { ProtectedRoute } from "./ProtectedRoutes";
import { LoginPage } from "../pages/Login/Login";
import { RegisterPage } from "../pages/Register/Register";
import { DashboardPage } from "../pages/Dashboard/Dashboard";

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={paths.home} element={<LoginPage />} />
        <Route path={paths.login} element={<LoginPage />} />
        <Route path={paths.register} element={<RegisterPage />} />

        <Route
          path={paths.dashboard}
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
