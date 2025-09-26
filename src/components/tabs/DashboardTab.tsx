import React from "react";

export const DashboardTab: React.FC = () => {
  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2 className="tab-title">Dashboard</h2>
        <p className="tab-subtitle">
          Visão geral do sistema de gestão de produção têxtil
        </p>
      </div>
      <div className="tab-body">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Resumo Geral</h3>
            <p>Informações gerais do sistema</p>
          </div>
          <div className="dashboard-card">
            <h3>Produção Atual</h3>
            <p>Status da produção em andamento</p>
          </div>
          <div className="dashboard-card">
            <h3>Financeiro</h3>
            <p>Resumo financeiro</p>
          </div>
        </div>
      </div>
    </div>
  );
};
