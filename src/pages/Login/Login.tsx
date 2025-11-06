import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ErrorOutline } from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/Button/Button";
import { paths } from "../../routes/paths";
import type { LoginCredentials } from "../../types/user";
import "./Login.css";

export const LoginPage = () => {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const { login, error, loading, clearError } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev: LoginCredentials) => ({
      ...prev,
      [name]: value,
    }));

    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      alert("Por favor, preencha todos os campos");
      return;
    }

    try {
      await login(formData);
      navigate(paths.dashboard);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <div className="login-form-card">
          <div className="login-header">
            <h2 className="login-title">Entrar</h2>
            <p className="login-subtitle">
              Preencha os campos abaixo para entrar em sua conta
            </p>
          </div>
          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="login-error" role="alert">
                <ErrorOutline className="login-error-icon" />
                <span>{error}</span>
              </div>
            )}
            <div className="login-field">
              <label className="login-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Digite seu email"
                className="login-input"
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Digite sua senha"
                className="login-input"
              />
            </div>

            <div className="login-options">
              <div className="login-checkbox-container">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="login-checkbox"
                />
                <label className="login-checkbox-label" htmlFor="rememberMe">
                  Lembrar-me
                </label>
              </div>

              <a href="#" className="login-link">
                Esqueceu sua senha?
              </a>
            </div>

            <div className="login-buttons">
              <Button
                type="submit"
                size="lg"
                isLoading={loading}
                disabled={!formData.email || !formData.password}
                className="login-button"
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </div>

            <div className="login-footer">
              <span className="login-footer-text">
                Não tem uma conta?{" "}
                <Link to={paths.register} className="login-footer-link">
                  Cadastrar
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
