import React, { useState } from "react";
import {
  Download,
  Search,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import "./FinanceiroTab.css";

export const FinanceiroTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"pendencias" | "pagamentos">(
    "pendencias"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  // Mock data - replace with actual data from your backend
  const summaryData = {
    totalPendente: 5050.0,
    totalAtrasado: 540.0,
    totalPagoMes: 3450.0,
    metaMensal: 15000.0,
    lancamentosPendentes: 3,
    pagamentosMes: 2,
    variacaoMeta: 12,
  };

  const pendingData = [
    {
      id: "FIN001",
      ordem: "OP001",
      faccao: "Facção Silva",
      etapa: "Costura",
      produto: "Camiseta Básica ...",
      valor: 3280.0,
      vencimento: "24/01/2024",
      status: "pendente" as const,
    },
    {
      id: "FIN002",
      ordem: "OP002",
      faccao: "Ateliê Maria",
      etapa: "Corte",
      produto: "Regata Fitness Fe...",
      valor: 540.0,
      vencimento: "19/01/2024",
      status: "atrasado" as const,
      diasAtraso: 3,
    },
    {
      id: "FIN003",
      ordem: "OP001",
      faccao: "Silk Express",
      etapa: "Silk",
      produto: "Camiseta Básica ...",
      valor: 1230.0,
      vencimento: "27/01/2024",
      status: "pendente" as const,
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const filteredPendencies = pendingData.filter((item) => {
    const matchesSearch =
      item.ordem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.faccao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.produto.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "todos" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="financeiro-container">
      {/* Header */}
      <div className="financeiro-header">
        <div className="financeiro-header-title">
          <h2 className="financeiro-title">Financeiro</h2>
          <p className="financeiro-subtitle">
            Controle de pagamentos e pendências financeiras
          </p>
        </div>
        <button className="financeiro-export-btn">
          <Download size={18} />
          <span>Exportar Relatório</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="financeiro-summary-grid">
        <div className="financeiro-card">
          <div className="financeiro-card-header">
            <span className="financeiro-card-title">Total Pendente</span>
            <div className="financeiro-card-icon financeiro-icon-orange">
              <Clock size={20} />
            </div>
          </div>
          <div className="financeiro-card-value financeiro-value-orange">
            {formatCurrency(summaryData.totalPendente)}
          </div>
          <div className="financeiro-card-sub">
            {summaryData.lancamentosPendentes} lançamentos
          </div>
        </div>

        <div className="financeiro-card">
          <div className="financeiro-card-header">
            <span className="financeiro-card-title">Total Atrasado</span>
            <div className="financeiro-card-icon financeiro-icon-red">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="financeiro-card-value financeiro-value-red">
            {formatCurrency(summaryData.totalAtrasado)}
          </div>
          <div className="financeiro-card-sub">1 em atraso</div>
        </div>

        <div className="financeiro-card">
          <div className="financeiro-card-header">
            <span className="financeiro-card-title">Total Pago (Mês)</span>
            <div className="financeiro-card-icon financeiro-icon-green">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="financeiro-card-value financeiro-value-green">
            {formatCurrency(summaryData.totalPagoMes)}
          </div>
          <div className="financeiro-card-sub">
            {summaryData.pagamentosMes} pagamentos
          </div>
        </div>

        <div className="financeiro-card">
          <div className="financeiro-card-header">
            <span className="financeiro-card-title">Meta Mensal</span>
            <div className="financeiro-card-icon financeiro-icon-blue">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="financeiro-card-value financeiro-value-gray">
            {formatCurrency(summaryData.metaMensal)}
          </div>
          <div className="financeiro-card-sub financeiro-card-sub-success">
            ↑ +{summaryData.variacaoMeta}% vs mês anterior
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="financeiro-search-section">
        <div className="financeiro-search-bar">
          <Search size={18} className="financeiro-search-icon" />
          <input
            type="text"
            placeholder="Buscar por OP, facção ou produto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="financeiro-search-input"
          />
        </div>
        <div className="financeiro-status-filter">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="financeiro-status-select"
          >
            <option value="todos">Todos os Status</option>
            <option value="pendente">Pendente</option>
            <option value="atrasado">Atrasado</option>
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="financeiro-nav-tabs">
        <button
          className={`financeiro-nav-tab ${
            activeTab === "pendencias" ? "active" : ""
          }`}
          onClick={() => setActiveTab("pendencias")}
        >
          Pendências
        </button>
        <button
          className={`financeiro-nav-tab ${
            activeTab === "pagamentos" ? "active" : ""
          }`}
          onClick={() => setActiveTab("pagamentos")}
        >
          Pagamentos Realizados
        </button>
      </div>

      {/* Content Area */}
      <div className="financeiro-content-card">
        <div className="financeiro-content-header">
          <div className="financeiro-content-title-section">
            <DollarSign className="financeiro-dollar-icon" size={24} />
            <div>
              <h3 className="financeiro-content-title">
                {activeTab === "pendencias"
                  ? "Pendências Financeiras"
                  : "Pagamentos Realizados"}
              </h3>
              <p className="financeiro-content-subtitle">
                {activeTab === "pendencias"
                  ? "Acompanhe os pagamentos pendentes por etapa de produção"
                  : "Histórico de pagamentos realizados"}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="financeiro-table-container">
          {activeTab === "pendencias" ? (
            <table className="financeiro-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ordem</th>
                  <th>Facção</th>
                  <th>Etapa</th>
                  <th>Produto</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPendencies.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="financeiro-empty-state">
                      Nenhuma pendência encontrada
                    </td>
                  </tr>
                ) : (
                  filteredPendencies.map((item) => (
                    <tr key={item.id}>
                      <td className="financeiro-cell-id">{item.id}</td>
                      <td>{item.ordem}</td>
                      <td>{item.faccao}</td>
                      <td>
                        <span className="financeiro-badge financeiro-badge-default">
                          {item.etapa}
                        </span>
                      </td>
                      <td>{item.produto}</td>
                      <td className="financeiro-cell-value">
                        {formatCurrency(item.valor)}
                      </td>
                      <td>{item.vencimento}</td>
                      <td>
                        <span
                          className={`financeiro-badge ${
                            item.status === "atrasado"
                              ? "financeiro-badge-danger"
                              : "financeiro-badge-default"
                          }`}
                        >
                          {item.status === "atrasado" ? (
                            <>
                              <AlertCircle size={14} />
                              Atrasado ({item.diasAtraso}d)
                            </>
                          ) : (
                            <>
                              <Clock size={14} />
                              Pendente
                            </>
                          )}
                        </span>
                      </td>
                      <td>
                        <button className="financeiro-action-btn">
                          <CreditCard size={14} />
                          Pagar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <div className="financeiro-empty-state-large">
              <CheckCircle size={48} className="financeiro-empty-icon" />
              <p>Nenhum pagamento realizado ainda</p>
              <p className="financeiro-empty-subtitle">
                Os pagamentos realizados aparecerão aqui
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
