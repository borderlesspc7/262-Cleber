import React from "react";
import { Users, Layers, Package } from "lucide-react";
import "./Cadastros.css";

interface CadastrosTabProps {
  onTabChange: (tab: string) => void;
}

export const CadastrosTab: React.FC<CadastrosTabProps> = ({ onTabChange }) => {
  return (
    <div className="cadastros-container">
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
              <Users size={24} color="#8B5CF6" />
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
              <Layers size={24} color="#8B5CF6" />
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
              <Package size={24} color="#8B5CF6" />
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
                onTabChange("produtos");
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
              onTabChange("produtos");
            }}
          >
            <Package size={20} />
            <span> + Novo Produto</span>
          </button>
        </div>
      </div>
    </div>
  );
};
