import React, { useState, useEffect, useCallback } from "react";
import {
  Download,
  Search,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  CreditCard,
  Printer,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { financeiroService } from "../../services/financeiroService";
import type { LancamentoFinanceiro } from "../../types/financeiro";
import { PrintReceiptModal } from "../financeiro/PrintReceiptModal";
import toast from "react-hot-toast";
import "./FinanceiroTab.css";

export const FinanceiroTab: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"pendencias" | "pagamentos">(
    "pendencias"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [lancamentosPendentes, setLancamentosPendentes] = useState<
    LancamentoFinanceiro[]
  >([]);
  const [lancamentosPagos, setLancamentosPagos] = useState<
    LancamentoFinanceiro[]
  >([]);
  const [loading, setLoading] = useState(true);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [lancamentoToPrint, setLancamentoToPrint] =
    useState<LancamentoFinanceiro | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [pendentes, pagos] = await Promise.all([
        financeiroService.getLancamentosPendentes(user.uid),
        financeiroService.getLancamentosPagos(user.uid),
      ]);

      setLancamentosPendentes(pendentes);
      setLancamentosPagos(pagos);
    } catch (error) {
      console.error("Erro ao carregar lançamentos:", error);
      toast.error("Erro ao carregar dados financeiros");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
  };

  const getDiasAtraso = (dataVencimento: Date): number => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(dataVencimento);
    vencimento.setHours(0, 0, 0, 0);
    const diff = hoje.getTime() - vencimento.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // Calcular dados do resumo
  const summaryData = {
    totalPendente: lancamentosPendentes
      .filter((l) => l.status === "pendente")
      .reduce((acc, l) => acc + l.valor, 0),
    totalAtrasado: lancamentosPendentes
      .filter((l) => l.status === "atrasado")
      .reduce((acc, l) => acc + l.valor, 0),
    totalPagoMes: lancamentosPagos
      .filter((l) => {
        const dataPagamento = new Date(l.dataPagamento!);
        const mesAtual = new Date().getMonth();
        const anoAtual = new Date().getFullYear();
        return (
          dataPagamento.getMonth() === mesAtual &&
          dataPagamento.getFullYear() === anoAtual
        );
      })
      .reduce((acc, l) => acc + l.valor, 0),
    lancamentosPendentes: lancamentosPendentes.filter(
      (l) => l.status === "pendente"
    ).length,
    lancamentosAtrasados: lancamentosPendentes.filter(
      (l) => l.status === "atrasado"
    ).length,
    pagamentosMes: lancamentosPagos.filter((l) => {
      const dataPagamento = new Date(l.dataPagamento!);
      const mesAtual = new Date().getMonth();
      const anoAtual = new Date().getFullYear();
      return (
        dataPagamento.getMonth() === mesAtual &&
        dataPagamento.getFullYear() === anoAtual
      );
    }).length,
  };

  const filteredPendencies = lancamentosPendentes.filter((item) => {
    const matchesSearch =
      item.ordemCodigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.faccaoNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.produtoDescricao.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "todos" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredPagamentos = lancamentosPagos.filter((item) => {
    return (
      item.ordemCodigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.faccaoNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.produtoDescricao.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handlePagar = async (lancamentoId: string) => {
    if (!window.confirm("Confirmar pagamento deste lançamento?")) return;

    try {
      await financeiroService.marcarComoPago(lancamentoId);
      await loadData();
      toast.success("Pagamento registrado com sucesso!", {
        icon: <CheckCircle size={20} />,
      });

      // Buscar o lançamento atualizado e abrir o modal de impressão
      const lancamentoAtualizado = await financeiroService.getLancamentoById(
        lancamentoId
      );
      if (lancamentoAtualizado) {
        setLancamentoToPrint(lancamentoAtualizado);
        setIsPrintModalOpen(true);
      }
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      toast.error("Erro ao registrar pagamento");
    }
  };

  const handlePrintReceipt = (lancamento: LancamentoFinanceiro) => {
    setLancamentoToPrint(lancamento);
    setIsPrintModalOpen(true);
  };

  if (loading) {
    return (
      <div className="financeiro-container">
        <div className="financeiro-loading">Carregando...</div>
      </div>
    );
  }

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
          <div className="financeiro-card-sub">
            {summaryData.lancamentosAtrasados} em atraso
          </div>
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
            <span className="financeiro-card-title">Total Geral</span>
            <div className="financeiro-card-icon financeiro-icon-blue">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="financeiro-card-value financeiro-value-gray">
            {formatCurrency(
              summaryData.totalPendente + summaryData.totalAtrasado
            )}
          </div>
          <div className="financeiro-card-sub">
            {summaryData.lancamentosPendentes +
              summaryData.lancamentosAtrasados}{" "}
            pendentes
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
        {activeTab === "pendencias" && (
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
        )}
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
                    <td colSpan={8} className="financeiro-empty-state">
                      Nenhuma pendência encontrada
                    </td>
                  </tr>
                ) : (
                  filteredPendencies.map((item) => (
                    <tr key={item.id}>
                      <td>{item.ordemCodigo}</td>
                      <td>{item.faccaoNome}</td>
                      <td>
                        <span className="financeiro-badge financeiro-badge-default">
                          {item.etapaNome}
                        </span>
                      </td>
                      <td>{item.produtoDescricao}</td>
                      <td className="financeiro-cell-value">
                        {formatCurrency(item.valor)}
                      </td>
                      <td>{formatDate(item.dataVencimento)}</td>
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
                              Atrasado ({getDiasAtraso(item.dataVencimento)}d)
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
                        <button
                          className="financeiro-action-btn"
                          onClick={() => handlePagar(item.id)}
                        >
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
            <>
              {filteredPagamentos.length === 0 ? (
                <div className="financeiro-empty-state-large">
                  <CheckCircle size={48} className="financeiro-empty-icon" />
                  <p>Nenhum pagamento realizado ainda</p>
                  <p className="financeiro-empty-subtitle">
                    Os pagamentos realizados aparecerão aqui
                  </p>
                </div>
              ) : (
                <table className="financeiro-table">
                  <thead>
                    <tr>
                      <th>Ordem</th>
                      <th>Facção</th>
                      <th>Etapa</th>
                      <th>Produto</th>
                      <th>Valor</th>
                      <th>Vencimento</th>
                      <th>Data Pagamento</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPagamentos.map((item) => (
                      <tr key={item.id}>
                        <td>{item.ordemCodigo}</td>
                        <td>{item.faccaoNome}</td>
                        <td>
                          <span className="financeiro-badge financeiro-badge-default">
                            {item.etapaNome}
                          </span>
                        </td>
                        <td>{item.produtoDescricao}</td>
                        <td className="financeiro-cell-value">
                          {formatCurrency(item.valor)}
                        </td>
                        <td>{formatDate(item.dataVencimento)}</td>
                        <td>
                          {item.dataPagamento
                            ? formatDate(item.dataPagamento)
                            : "-"}
                        </td>
                        <td>
                          <span className="financeiro-badge financeiro-badge-success">
                            <CheckCircle size={14} />
                            Pago
                          </span>
                        </td>
                        <td>
                          <button
                            className="financeiro-action-btn financeiro-action-print"
                            onClick={() => handlePrintReceipt(item)}
                            title="Imprimir recibo"
                          >
                            <Printer size={14} />
                            Recibo
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>

      <PrintReceiptModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setLancamentoToPrint(null);
        }}
        lancamento={lancamentoToPrint!}
        empresaNome={user?.displayName || "Empresa"}
      />
    </div>
  );
};
