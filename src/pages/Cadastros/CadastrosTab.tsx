import React from "react";
import { Users, Layers, Package, Building2 } from "lucide-react";
import "./Cadastros.css";
import { CompanyForm } from "../../components/company/CompanyForm";

interface CadastrosTabProps {
  onTabChange: (tab: string) => void;
}

export const CadastrosTab: React.FC<CadastrosTabProps> = ({ onTabChange }) => {
  const [showCompanyForm, setShowCompanyForm] = React.useState(false);

  return (
    <div className="cadastros-container">
      {/* Informações da Empresa */}
      <div className="cadastros-section">
        <div className="section-header">
          <h2 className="section-title">Informações da Empresa</h2>
          <p className="section-description">
            Configure o nome, logomarca e endereço da sua empresa
          </p>
        </div>

        {showCompanyForm ? (
          <div style={{ marginBottom: "2rem" }}>
            <button
              onClick={() => setShowCompanyForm(false)}
              style={{
                marginBottom: "1rem",
                padding: "0.5rem 1rem",
                background: "#e5e7eb",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              ← Voltar
            </button>
            <CompanyForm />
          </div>
        ) : (
          <div className="cards-container">
            <div className="card">
              <div className="card-icon">
                <Building2 size={24} color="#1e3a8a" />
              </div>
              <div className="card-content">
                <h3 className="card-title">Dados da Empresa</h3>
                <p className="card-description">
                  Configure nome, logo e endereço
                </p>
              </div>
              <button
                onClick={() => setShowCompanyForm(true)}
                className="card-button"
              >
                Configurar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cadastros Gerais */}
      {!showCompanyForm && (
        <>
          <div className="cadastros-section">
            <div className="section-header">
              <h2 className="section-title">Cadastros</h2>
              <p className="section-description">
                Gerencie todas informações básicas do sistema
              </p>
            </div>

            <div className="cards-container">
              <div className="card">
                <div className="card-icon">
                  <Users size={24} color="#1e3a8a" />
                </div>
                <div className="card-content">
                  <h3 className="card-title">Facções / Terceirizados</h3>
                  <p className="card-description">
                    Gerencie seus parceiros de produção
                  </p>
                  <span className="card-count">0 cadastrados</span>
                </div>
                <button
                  onClick={() => {
                    onTabChange("faccoes");
                  }}
                  className="card-button"
                >
                  Acessar
                </button>
              </div>

              <div className="card">
                <div className="card-icon">
                  <Layers size={24} color="#1e3a8a" />
                </div>
                <div className="card-content">
                  <h3 className="card-title">Etapas de Produção</h3>
                  <p className="card-description">
                    Configure as etapas do processo produtivo
                  </p>
                  <span className="card-count">0 etapas</span>
                </div>
                <button
                  onClick={() => {
                    onTabChange("etapas");
                  }}
                  className="card-button"
                >
                  Acessar
                </button>
              </div>

              <div className="card">
                <div className="card-icon">
                  <Package size={24} color="#1e3a8a" />
                </div>
                <div className="card-content">
                  <h3 className="card-title">Produtos</h3>
                  <p className="card-description">
                    Catálogo de produtos e especificações
                  </p>
                  <span className="card-count">0 produtos</span>
                </div>
                <button
                  onClick={() => {
                    onTabChange("produto");
                  }}
                  className="card-button"
                >
                  Acessar
                </button>
              </div>
            </div>
          </div>

          <div className="acoes-rapidas-section">
            <div className="section-header">
              <h2 className="section-title">Ações Rápidas</h2>
              <p className="section-description">
                Cadastre rapidamente novos itens no sistema
              </p>
            </div>

            <div className="botoes-container">
              <button
                className="acao-rapida-btn"
                onClick={() => {
                  onTabChange("faccoes");
                }}
              >
                <Users size={20} />
                <span> + Nova Facção</span>
              </button>

              <button
                className="acao-rapida-btn"
                onClick={() => {
                  onTabChange("etapas");
                }}
              >
                <Layers size={20} />
                <span> + Nova Etapa</span>
              </button>

              <button
                className="acao-rapida-btn"
                onClick={() => {
                  onTabChange("produto");
                }}
              >
                <Package size={20} />
                <span> + Novo Produto</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
