import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { paths } from "../../routes/paths";
import { authService } from "../../services/authService";
import "./ForgotPassword.css";
import getFirebaseErrorMessage from "../../components/ui/ErrorMessage";
import type { FirebaseError } from "firebase/app";

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{ email: string }>({ email: "" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setError("Por favor, preencha o email");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await authService.resetPassword(formData.email);
      alert("Email de recuperação enviado com sucesso");
    } catch (error) {
      const message = getFirebaseErrorMessage(error as string | FirebaseError);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-form-container">
        <div className="forgot-password-form-card">
          <div className="forgot-password-header">
            <h2 className="forgot-password-title">Recuperar Senha</h2>
            <p className="forgot-password-subtitle">
              Ola! Digite seu email para receber um link de recuperação de senha
            </p>
          </div>
          <form className="forgot-password-form" onSubmit={handleSubmit}>
            {error && <div className="forgot-password-error">{error}</div>}
            <div className="forgot-password-field">
              <label className="forgot-password-label" htmlFor="email">
                Email
              </label>
              <input
                className="forgot-password-input"
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Digite seu email"
              />
            </div>
            <div className="forgot-password-buttons">
              <button
                className="form-actions-button"
                type="button"
                onClick={() => navigate(paths.login)}
              >
                Cancelar
              </button>
              <button
                className="form-actions-button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>
          <div className="forgot-password-footer">
            <span className="forgot-password-footer-text">
              Voltar para{" "}
              <Link className="forgot-password-footer-link" to={paths.login}>
                Login
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
