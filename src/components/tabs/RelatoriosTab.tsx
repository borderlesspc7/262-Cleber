import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Package,
  DollarSign,
  Users,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { orderService } from "../../services/orderService";
import { produtoService } from "../../services/productService";
import { faccaoService } from "../../services/faccaoService";
import { financeiroService } from "../../services/financeiroService";
import { productionProgressService } from "../../services/productionProgressService";
import type { ProductionOrder } from "../../types/order";
import type { Produto } from "../../types/product";
import type { Faccao } from "../../types/faccao";
import type { LancamentoFinanceiro } from "../../types/financeiro";
import type { ProductionOrderProgress } from "../../types/productionProgress";
import "./RelatoriosTab.css";

type RelatorioType = "producao" | "financeiro" | "performance";
type PeriodoType = "semana" | "mes" | "trimestre" | "ano";

interface MetricaProducao {
  totalOrdens: number;
  ordensConcluidas: number;
  ordensEmAndamento: number;
  taxaConclusao: number;
  tempoMedioPorEtapa: number;
}

interface MetricaFinanceira {
  totalReceitas: number;
  totalDespesas: number;
  saldoAtual: number;
  pendencias: number;
  pagamentosFuturos: number;
}

interface FaccaoPerformance {
  faccaoNome: string;
  ordensFinalizadas: number;
  tempoMedio: number;
  taxaDefeitos: number;
}

export const RelatoriosTab: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<RelatorioType>("producao");
  const [periodo, setPeriodo] = useState<PeriodoType>("mes");
  const [loading, setLoading] = useState(true);

  // Dados
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [faccoes, setFaccoes] = useState<Faccao[]>([]);

  // Métricas calculadas
  const [metricaProducao, setMetricaProducao] = useState<MetricaProducao>({
    totalOrdens: 0,
    ordensConcluidas: 0,
    ordensEmAndamento: 0,
    taxaConclusao: 0,
    tempoMedioPorEtapa: 0,
  });

  const [metricaFinanceira, setMetricaFinanceira] = useState<MetricaFinanceira>(
    {
      totalReceitas: 0,
      totalDespesas: 0,
      saldoAtual: 0,
      pendencias: 0,
      pagamentosFuturos: 0,
    }
  );

  const [faccoesPerformance, setFaccoesPerformance] = useState<
    FaccaoPerformance[]
  >([]);

  const calcularMetricasProducao = useCallback(
    (orders: ProductionOrder[], progressos: ProductionOrderProgress[]) => {
      const dataLimite = getDataLimite(periodo);
      const ordersFiltradas = orders.filter(
        (order) => new Date(order.createdAt) >= dataLimite
      );

      const ordensConcluidas = ordersFiltradas.filter(
        (order) => order.status === "concluida"
      ).length;

      const ordensEmAndamento = ordersFiltradas.filter(
        (order) => order.status === "em_producao"
      ).length;

      const taxaConclusao =
        ordersFiltradas.length > 0
          ? (ordensConcluidas / ordersFiltradas.length) * 100
          : 0;

      // Calcular tempo médio por etapa
      let totalDias = 0;
      let totalEtapas = 0;

      progressos.forEach((progresso) => {
        progresso.etapas.forEach((etapa) => {
          if (etapa.dataInicio && etapa.dataFim) {
            const inicio = new Date(etapa.dataInicio);
            const fim = new Date(etapa.dataFim);
            const dias = Math.ceil(
              (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)
            );
            totalDias += dias;
            totalEtapas++;
          }
        });
      });

      const tempoMedioPorEtapa = totalEtapas > 0 ? totalDias / totalEtapas : 0;

      setMetricaProducao({
        totalOrdens: ordersFiltradas.length,
        ordensConcluidas,
        ordensEmAndamento,
        taxaConclusao,
        tempoMedioPorEtapa,
      });
    },
    [periodo]
  );

  const calcularMetricasFinanceiras = useCallback(
    (lancamentos: LancamentoFinanceiro[]) => {
      const dataLimite = getDataLimite(periodo);
      const lancamentosFiltrados = lancamentos.filter(
        (lanc) => new Date(lanc.createdAt) >= dataLimite
      );

      const totalDespesas = lancamentosFiltrados.reduce(
        (acc, lanc) => acc + lanc.valor,
        0
      );

      const pendencias = lancamentosFiltrados.filter(
        (lanc) => lanc.status === "pendente" || lanc.status === "atrasado"
      ).length;

      const valorPendente = lancamentosFiltrados
        .filter(
          (lanc) => lanc.status === "pendente" || lanc.status === "atrasado"
        )
        .reduce((acc, lanc) => acc + lanc.valor, 0);

      setMetricaFinanceira({
        totalReceitas: 0, // TODO: Implementar quando houver módulo de vendas
        totalDespesas,
        saldoAtual: -totalDespesas,
        pendencias,
        pagamentosFuturos: valorPendente,
      });
    },
    [periodo]
  );

  const calcularPerformanceFaccoes = useCallback(
    (progressos: ProductionOrderProgress[], faccoes: Faccao[]) => {
      const faccaoStats = new Map<
        string,
        { finalizadas: number; diasTotal: number; defeitos: number }
      >();

      progressos.forEach((progresso) => {
        progresso.etapas.forEach((etapa) => {
          if (etapa.responsavelId && etapa.status === "finalizada") {
            const stats = faccaoStats.get(etapa.responsavelId) || {
              finalizadas: 0,
              diasTotal: 0,
              defeitos: 0,
            };

            stats.finalizadas++;
            stats.defeitos += etapa.defeituosas || 0;

            if (etapa.dataInicio && etapa.dataFim) {
              const inicio = new Date(etapa.dataInicio);
              const fim = new Date(etapa.dataFim);
              const dias = Math.ceil(
                (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)
              );
              stats.diasTotal += dias;
            }

            faccaoStats.set(etapa.responsavelId, stats);
          }
        });
      });

      const performance: FaccaoPerformance[] = [];
      faccaoStats.forEach((stats, faccaoId) => {
        const faccao = faccoes.find((f) => f.id === faccaoId);
        if (faccao) {
          performance.push({
            faccaoNome: faccao.nome,
            ordensFinalizadas: stats.finalizadas,
            tempoMedio:
              stats.finalizadas > 0 ? stats.diasTotal / stats.finalizadas : 0,
            taxaDefeitos:
              stats.finalizadas > 0
                ? (stats.defeitos / stats.finalizadas) * 100
                : 0,
          });
        }
      });

      setFaccoesPerformance(
        performance.sort((a, b) => b.ordensFinalizadas - a.ordensFinalizadas)
      );
    },
    []
  );

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [ordersData, produtosData, faccoesData, progressosData] =
        await Promise.all([
          orderService.getOrders(user.uid),
          produtoService.getProdutos(user.uid),
          faccaoService.getFaccoes(),
          productionProgressService.getAllProgress(user.uid),
        ]);

      // Carregar lançamentos financeiros
      const [pendentes, pagos] = await Promise.all([
        financeiroService.getLancamentosPendentes(user.uid),
        financeiroService.getLancamentosPagos(user.uid),
      ]);

      const allLancamentos = [...pendentes, ...pagos];

      setOrders(ordersData);
      setProdutos(produtosData);
      setFaccoes(faccoesData);

      // Calcular métricas
      calcularMetricasProducao(ordersData, progressosData);
      calcularMetricasFinanceiras(allLancamentos);
      calcularPerformanceFaccoes(progressosData, faccoesData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [
    user,
    calcularMetricasProducao,
    calcularMetricasFinanceiras,
    calcularPerformanceFaccoes,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData, periodo]);

  const getDataLimite = (periodo: PeriodoType): Date => {
    const hoje = new Date();
    switch (periodo) {
      case "semana":
        return new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "mes":
        return new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "trimestre":
        return new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000);
      case "ano":
        return new Date(hoje.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  };

  const handleExportar = () => {
    // TODO: Implementar exportação para PDF/Excel
    alert("Funcionalidade de exportação em desenvolvimento");
  };

  const getProdutosMaisProduzidos = () => {
    const produtoCount = new Map<string, number>();
    orders.forEach((order) => {
      const count = produtoCount.get(order.produtoDescricao) || 0;
      produtoCount.set(order.produtoDescricao, count + 1);
    });

    return Array.from(produtoCount.entries())
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="relatorios-loading">
        <Activity size={48} className="loading-icon" />
        <p>Carregando relatórios...</p>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Relatórios</h2>
          <p className="tab-subtitle">
            Análises e métricas detalhadas do seu sistema
          </p>
        </div>
        <div className="relatorios-actions">
          <button className="btn-export" onClick={handleExportar}>
            <Download size={18} />
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="relatorios-filters">
        <div className="filter-group">
          <Filter size={18} />
          <span>Período:</span>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as PeriodoType)}
            className="filter-select"
          >
            <option value="semana">Última Semana</option>
            <option value="mes">Último Mês</option>
            <option value="trimestre">Último Trimestre</option>
            <option value="ano">Último Ano</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="relatorios-tabs">
        <button
          className={`relatorio-tab ${
            activeTab === "producao" ? "active" : ""
          }`}
          onClick={() => setActiveTab("producao")}
        >
          <BarChart3 size={20} />
          Produção
        </button>
        <button
          className={`relatorio-tab ${
            activeTab === "financeiro" ? "active" : ""
          }`}
          onClick={() => setActiveTab("financeiro")}
        >
          <DollarSign size={20} />
          Financeiro
        </button>
        <button
          className={`relatorio-tab ${
            activeTab === "performance" ? "active" : ""
          }`}
          onClick={() => setActiveTab("performance")}
        >
          <TrendingUp size={20} />
          Performance
        </button>
      </div>

      {/* Conteúdo */}
      <div className="relatorios-content">
        {activeTab === "producao" && (
          <div className="relatorio-section">
            <h3 className="section-title">Relatório de Produção</h3>

            {/* Cards de Métricas */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon blue">
                  <Package size={24} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Total de Ordens</span>
                  <span className="metric-value">
                    {metricaProducao.totalOrdens}
                  </span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon green">
                  <TrendingUp size={24} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Concluídas</span>
                  <span className="metric-value">
                    {metricaProducao.ordensConcluidas}
                  </span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon orange">
                  <Activity size={24} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Em Andamento</span>
                  <span className="metric-value">
                    {metricaProducao.ordensEmAndamento}
                  </span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon purple">
                  <PieChart size={24} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Taxa de Conclusão</span>
                  <span className="metric-value">
                    {metricaProducao.taxaConclusao.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Gráfico de Barras - Status das Ordens */}
            <div className="chart-container">
              <h4 className="chart-title">Distribuição de Status</h4>
              <div className="bar-chart">
                <div className="bar-item">
                  <div className="bar-label">Concluídas</div>
                  <div className="bar-track">
                    <div
                      className="bar-fill green"
                      style={{
                        width: `${
                          metricaProducao.totalOrdens > 0
                            ? (metricaProducao.ordensConcluidas /
                                metricaProducao.totalOrdens) *
                              100
                            : 0
                        }%`,
                      }}
                    >
                      <span className="bar-value">
                        {metricaProducao.ordensConcluidas}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bar-item">
                  <div className="bar-label">Em Andamento</div>
                  <div className="bar-track">
                    <div
                      className="bar-fill orange"
                      style={{
                        width: `${
                          metricaProducao.totalOrdens > 0
                            ? (metricaProducao.ordensEmAndamento /
                                metricaProducao.totalOrdens) *
                              100
                            : 0
                        }%`,
                      }}
                    >
                      <span className="bar-value">
                        {metricaProducao.ordensEmAndamento}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bar-item">
                  <div className="bar-label">Planejadas</div>
                  <div className="bar-track">
                    <div
                      className="bar-fill gray"
                      style={{
                        width: `${
                          metricaProducao.totalOrdens > 0
                            ? ((metricaProducao.totalOrdens -
                                metricaProducao.ordensConcluidas -
                                metricaProducao.ordensEmAndamento) /
                                metricaProducao.totalOrdens) *
                              100
                            : 0
                        }%`,
                      }}
                    >
                      <span className="bar-value">
                        {metricaProducao.totalOrdens -
                          metricaProducao.ordensConcluidas -
                          metricaProducao.ordensEmAndamento}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Produtos Mais Produzidos */}
            <div className="chart-container">
              <h4 className="chart-title">Top 5 Produtos Mais Produzidos</h4>
              <div className="produtos-ranking">
                {getProdutosMaisProduzidos().map((produto, index) => (
                  <div key={index} className="ranking-item">
                    <span className="ranking-position">{index + 1}</span>
                    <span className="ranking-nome">{produto.nome}</span>
                    <span className="ranking-badge">{produto.quantidade}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tempo Médio */}
            <div className="info-card">
              <Calendar size={20} />
              <div>
                <strong>Tempo Médio por Etapa</strong>
                <p>{metricaProducao.tempoMedioPorEtapa.toFixed(1)} dias</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "financeiro" && (
          <div className="relatorio-section">
            <h3 className="section-title">Relatório Financeiro</h3>

            {/* Cards de Métricas Financeiras */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon red">
                  <DollarSign size={24} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Total Despesas</span>
                  <span className="metric-value">
                    {metricaFinanceira.totalDespesas.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon orange">
                  <Activity size={24} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Pendências</span>
                  <span className="metric-value">
                    {metricaFinanceira.pendencias}
                  </span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon purple">
                  <Calendar size={24} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Pagamentos Futuros</span>
                  <span className="metric-value">
                    {metricaFinanceira.pagamentosFuturos.toLocaleString(
                      "pt-BR",
                      {
                        style: "currency",
                        currency: "BRL",
                      }
                    )}
                  </span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon blue">
                  <TrendingUp size={24} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Saldo Período</span>
                  <span className="metric-value">
                    {metricaFinanceira.saldoAtual.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Análise de Custos */}
            <div className="chart-container">
              <h4 className="chart-title">Análise de Custos por Período</h4>
              <div className="custos-analise">
                <div className="custo-item">
                  <span className="custo-label">Custos Diretos (Facções)</span>
                  <span className="custo-valor">
                    {metricaFinanceira.totalDespesas.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                  <div className="custo-bar">
                    <div className="custo-bar-fill" style={{ width: "100%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Previsão */}
            <div className="info-card warning">
              <Activity size={20} />
              <div>
                <strong>Previsão de Pagamentos</strong>
                <p>
                  {metricaFinanceira.pendencias} lançamentos pendentes
                  totalizando{" "}
                  {metricaFinanceira.pagamentosFuturos.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="relatorio-section">
            <h3 className="section-title">Relatório de Performance</h3>

            {/* Ranking de Facções */}
            <div className="chart-container">
              <h4 className="chart-title">Facções Mais Produtivas</h4>
              <div className="faccoes-ranking">
                {faccoesPerformance.length === 0 ? (
                  <div className="empty-state">
                    <Users size={48} />
                    <p>Nenhum dado de performance disponível ainda</p>
                  </div>
                ) : (
                  faccoesPerformance.map((faccao, index) => (
                    <div key={index} className="faccao-performance-card">
                      <div className="faccao-header">
                        <span className="faccao-position">{index + 1}º</span>
                        <h5 className="faccao-nome">{faccao.faccaoNome}</h5>
                      </div>
                      <div className="faccao-stats">
                        <div className="faccao-stat">
                          <span className="stat-label">Ordens Finalizadas</span>
                          <span className="stat-value">
                            {faccao.ordensFinalizadas}
                          </span>
                        </div>
                        <div className="faccao-stat">
                          <span className="stat-label">Tempo Médio</span>
                          <span className="stat-value">
                            {faccao.tempoMedio.toFixed(1)} dias
                          </span>
                        </div>
                        <div className="faccao-stat">
                          <span className="stat-label">Taxa de Defeitos</span>
                          <span
                            className={`stat-value ${
                              faccao.taxaDefeitos > 5 ? "high" : "low"
                            }`}
                          >
                            {faccao.taxaDefeitos.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Indicadores Gerais */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon blue">
                  <Users size={24} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Facções Ativas</span>
                  <span className="metric-value">{faccoes.length}</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon green">
                  <Package size={24} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Produtos Cadastrados</span>
                  <span className="metric-value">{produtos.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
