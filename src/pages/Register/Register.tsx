import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/Button/Button";
import { paths } from "../../routes/paths";
import type { RegisterCredentials } from "../../types/user";
import { phoneMask } from "../../utils/masks";
import "./Register.css";

export const RegisterPage = () => {
  const [formData, setFormData] = useState<RegisterCredentials>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "user",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { register, error, loading, clearError } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Aplica máscara para telefone
    const maskedValue = name === "phone" ? phoneMask(value) : value;

    setFormData((prev) => ({ ...prev, [name]: maskedValue }));

    if (error) clearError();
  };

  const validateForm = (): string | null => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      return "Todos os campos são obrigatórios";
    }

    if (formData.password.length < 6) {
      return "A senha deve ter pelo menos 6 caracteres";
    }

    if (formData.password !== formData.confirmPassword) {
      return "As senhas não coincidem";
    }

    if (!acceptTerms) {
      return "Você deve aceitar os termos de uso";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      await register(formData);
      navigate(paths.dashboard);
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
    }
  };

  return (
    <div className="register-container">
      <div className="register-form-container">
        <div className="register-form-card">
          <div className="register-header">
            <h2 className="register-title">Criar Conta</h2>
            <p className="register-subtitle">
              Preencha os campos abaixo para criar sua conta
            </p>
          </div>
          <form className="register-form" onSubmit={handleSubmit}>
            {error && <div className="register-error">{error}</div>}

            <div className="register-field">
              <label className="register-label" htmlFor="name">
                Nome
              </label>
              <input
                required
                autoComplete="name"
                className="register-input"
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Digite seu nome"
              />
            </div>

            <div className="register-field">
              <label className="register-label" htmlFor="email">
                Email
              </label>
              <input
                required
                autoComplete="email"
                className="register-input"
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Digite seu email"
              />
            </div>

            <div className="register-field">
              <label htmlFor="phone" className="register-label">
                Telefone (Opcional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleInputChange}
                className="register-input"
                placeholder="(11) 99999-9999"
                maxLength={15}
              />
            </div>

            <div className="register-field">
              <label htmlFor="password" className="register-label">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="register-input"
                placeholder="Digite sua senha (mín. 6 caracteres)"
              />
            </div>

            <div className="register-field">
              <label htmlFor="confirmPassword" className="register-label">
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="register-input"
                placeholder="Confirme sua senha"
              />
            </div>

            <div className="register-checkbox-container">
              <input
                id="accept-terms"
                name="accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="register-checkbox"
              />
              <label htmlFor="accept-terms" className="register-checkbox-label">
                Concordo com os{" "}
                <a href="#" className="register-terms-link">
                  Termos de Uso
                </a>{" "}
                e{" "}
                <a href="#" className="register-terms-link">
                  Política de Privacidade
                </a>
              </label>
            </div>

            <div className="register-buttons">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                disabled={
                  !formData.name ||
                  !formData.email ||
                  !formData.password ||
                  !formData.confirmPassword ||
                  !acceptTerms
                }
                className="register-button"
              >
                {loading ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </div>

            <div className="register-footer">
              <p className="register-footer-text">
                Já tem uma conta?{" "}
                <Link to={paths.login} className="register-footer-link">
                  Entrar
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
