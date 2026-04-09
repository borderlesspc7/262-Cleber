import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  TrendingUp,
  Package,
  Users,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { orderService } from "../../services/orderService";
import { produtoService } from "../../services/productService";
import { faccaoService } from "../../services/faccaoService";
import { productionProgressService } from "../../services/productionProgressService";
import { companyService } from "../../services/companyService";
import type { ProductionOrder } from "../../types/order";
import type { Produto } from "../../types/product";
import type { Faccao } from "../../types/faccao";
import type { ProductionOrderProgress } from "../../types/productionProgress";
import type { Company } from "../../types/company";
import "./RelatoriosTab.css";
import { formatDateBR, formatDateTimeBR } from "../../utils/dateFormatter";
import { downloadCsv } from "../../utils/csvExport";
import { RELATORIOS_REFRESH_EVENT } from "../../constants/appEvents";
import toast from "react-hot-toast";

type RelatorioType = "producao" | "performance";
type PeriodoType = "semana" | "mes" | "trimestre" | "ano";

interface MetricaProducao {
  totalOrdens: number;
  ordensConcluidas: number;
  ordensEmAndamento: number;
  taxaConclusao: number;
  tempoMedioPorEtapa: number;
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);
  const refreshInFlightRef = useRef(false);

  // Dados
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [faccoes, setFaccoes] = useState<Faccao[]>([]);
  const [companyInfo, setCompanyInfo] = useState<Company | null>(null);

  // Métricas calculadas
  const [metricaProducao, setMetricaProducao] = useState<MetricaProducao>({
    totalOrdens: 0,
    ordensConcluidas: 0,
    ordensEmAndamento: 0,
    taxaConclusao: 0,
    tempoMedioPorEtapa: 0,
  });

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

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!user) return;

    try {
      if (!silent) setLoading(true);
      if (silent) setIsRefreshing(true);
      setErrorMessage(null);
      const [ordersData, produtosData, faccoesData, progressosData, companyData] =
        await Promise.all([
          orderService.getOrders(user.uid),
          produtoService.getProdutos(user.uid),
          faccaoService.getFaccoes(),
          productionProgressService.getAllProgress(user.uid),
          companyService.getCompanyInfo(),
        ]);

      setOrders(ordersData);
      setProdutos(produtosData);
      setFaccoes(faccoesData);
      setCompanyInfo(companyData);

      // Calcular métricas
      calcularMetricasProducao(ordersData, progressosData);
      calcularPerformanceFaccoes(progressosData, faccoesData);
      setLastUpdatedAt(new Date());
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setErrorMessage(
        "Não foi possível atualizar os relatórios agora. Exibindo os últimos dados carregados."
      );
      toast.error("Erro ao carregar relatórios");
    } finally {
      if (!silent) setLoading(false);
      if (silent) setIsRefreshing(false);
    }
  }, [user, calcularMetricasProducao, calcularPerformanceFaccoes]);

  useEffect(() => {
    loadData();
  }, [loadData, periodo]);

  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshInFlightRef.current) return;
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = window.setTimeout(async () => {
        refreshInFlightRef.current = true;
        try {
          await loadData({ silent: true });
        } finally {
          refreshInFlightRef.current = false;
        }
      }, 250);
    };
    window.addEventListener(RELATORIOS_REFRESH_EVENT, scheduleRefresh);
    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
      window.removeEventListener(RELATORIOS_REFRESH_EVENT, scheduleRefresh);
    };
  }, [loadData]);

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

  const getPeriodoLabel = (periodo: PeriodoType): string => {
    switch (periodo) {
      case "semana":
        return "Última Semana";
      case "mes":
        return "Último Mês";
      case "trimestre":
        return "Último Trimestre";
      case "ano":
        return "Último Ano";
      default:
        return "Último Mês";
    }
  };

  const formatNumber = (value: number, digits: number = 0) =>
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);

  const handleRefresh = async () => {
    await loadData({ silent: true });
    toast.success(`Relatórios atualizados (${getPeriodoLabel(periodo)})`);
  };

  const getExportFileDate = () => formatDateBR(new Date()).replace(/\//g, "-");
  const getExportTimestamp = () =>
    formatDateTimeBR(new Date()).replace(/[/: ]/g, "-");

  const runExportJob = async (
    label: string,
    exporter: () => Promise<void> | void
  ) => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      await exporter();
      toast.success(`${label} exportado com sucesso`);
    } catch (error) {
      console.error(`Erro ao exportar ${label}:`, error);
      toast.error(`Falha ao exportar ${label}`);
    } finally {
      setIsExporting(false);
    }
  };

  const exportarCsvProducao = () => {
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
    const ordensPlanejadas = ordersFiltradas.filter(
      (order) => order.status === "planejada"
    ).length;
    const taxaConclusao =
      ordersFiltradas.length > 0
        ? (ordensConcluidas / ordersFiltradas.length) * 100
        : 0;
    const topProdutos = getProdutosMaisProduzidos(ordersFiltradas);

    const rows: (string | number)[][] = [
      ["Relatório", "Produção"],
      ["Período", getPeriodoLabel(periodo)],
      ["Gerado em", formatDateTimeBR(new Date())],
      [],
      ["Resumo", "Valor"],
      ["Total de Ordens", ordersFiltradas.length],
      ["Concluídas", ordensConcluidas],
      ["Em Andamento", ordensEmAndamento],
      ["Planejadas", ordensPlanejadas],
      ["Taxa de Conclusão (%)", Number(taxaConclusao.toFixed(2))],
      [
        "Tempo Médio por Etapa (dias)",
        Number(metricaProducao.tempoMedioPorEtapa.toFixed(2)),
      ],
      [],
      ["Top Produtos", "Quantidade de Ordens"],
      ...topProdutos.map((p) => [p.nome, p.quantidade]),
    ];

    const fileDate = getExportFileDate();
    const stamp = getExportTimestamp();
    downloadCsv(`relatorios-producao-${periodo}-${fileDate}-${stamp}.csv`, rows);
  };

  const exportarCsvPerformance = () => {
    const faccoesAtivas = faccoes.filter((f) => f.ativo).length;
    const faccoesTop = faccoesPerformance.slice(0, 5);

    const rows: (string | number)[][] = [
      ["Relatório", "Performance"],
      ["Período", getPeriodoLabel(periodo)],
      ["Gerado em", formatDateTimeBR(new Date())],
      [],
      ["Indicador", "Valor"],
      ["Facções Ativas", faccoesAtivas],
      ["Facções Cadastradas", faccoes.length],
      ["Produtos Cadastrados", produtos.length],
      [],
      ["Facção", "Ordens Finalizadas", "Tempo Médio (dias)", "Taxa Defeitos (%)"],
      ...faccoesTop.map((f) => [
        f.faccaoNome,
        f.ordensFinalizadas,
        Number(f.tempoMedio.toFixed(2)),
        Number(f.taxaDefeitos.toFixed(2)),
      ]),
    ];

    const fileDate = getExportFileDate();
    const stamp = getExportTimestamp();
    downloadCsv(
      `relatorios-performance-${periodo}-${fileDate}-${stamp}.csv`,
      rows
    );
  };

  const escapeHtml = (raw: string) =>
    raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const openPrintWindow = (html: string) => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      alert("Não foi possível abrir a janela de impressão.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const buildReportShell = (
    title: string,
    subtitle: string,
    content: string
  ) => {
    const c = companyInfo;
    const companyHeader =
      c && (c.logoUrl || c.nome || c.email)
        ? `<div class="company-print">
            ${
              c.logoUrl
                ? `<img class="company-print-logo" src="${escapeHtml(c.logoUrl)}" alt="" />`
                : ""
            }
            <div class="company-print-text">
              ${c.nome ? `<div class="company-print-name">${escapeHtml(c.nome)}</div>` : ""}
              ${c.email ? `<div class="company-print-email">${escapeHtml(c.email)}</div>` : ""}
              ${c.endereco ? `<div class="company-print-address">${escapeHtml(c.endereco)}</div>` : ""}
            </div>
          </div>`
        : "";

    return `<!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${escapeHtml(title)}</title>
          <style>
            @page { size: A4; margin: 18mm; }
            * { box-sizing: border-box; }
            body { font-family: "Segoe UI", Arial, sans-serif; color: #0f172a; }
            .company-print { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
            .company-print-logo { max-height: 48px; max-width: 140px; object-fit: contain; }
            .company-print-text { min-width: 0; }
            .company-print-name { font-size: 15px; font-weight: 700; }
            .company-print-email { font-size: 12px; color: #64748b; margin-top: 4px; word-break: break-all; }
            .company-print-address { font-size: 12px; color: #4b5563; margin-top: 4px; line-height: 1.35; word-break: break-word; }
            h1 { font-size: 20px; margin: 0 0 4px 0; }
            h2 { font-size: 14px; margin: 0 0 16px 0; color: #475569; font-weight: 600; }
            .meta { font-size: 12px; color: #64748b; margin-bottom: 16px; }
            .section { margin: 18px 0; }
            .section-title { font-size: 14px; font-weight: 700; margin-bottom: 10px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
            .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
            .card-label { font-size: 11px; color: #64748b; }
            .card-value { font-size: 16px; font-weight: 700; }
            table { width: 100%; max-width: 100%; table-layout: fixed; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; font-size: 12px; text-align: left; word-break: break-word; overflow-wrap: anywhere; }
            th { background: #f8fafc; font-weight: 700; }
            .muted { color: #64748b; }
          </style>
        </head>
        <body>
          ${companyHeader}
          <h1>${escapeHtml(title)}</h1>
          <h2>${escapeHtml(subtitle)}</h2>
          <div class="meta">Gerado em ${formatDateTimeBR(new Date())}</div>
          ${content}
        </body>
      </html>`;
  };

  const handleExportarProducao = () => {
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
    const ordensPlanejadas = ordersFiltradas.filter(
      (order) => order.status === "planejada"
    ).length;
    const taxaConclusao =
      ordersFiltradas.length > 0
        ? (ordensConcluidas / ordersFiltradas.length) * 100
        : 0;
    const topProdutos = getProdutosMaisProduzidos(ordersFiltradas);

    const content = `
      <div class="section">
        <div class="section-title">Resumo</div>
        <div class="grid">
          <div class="card"><div class="card-label">Total de Ordens</div><div class="card-value">${formatNumber(ordersFiltradas.length)}</div></div>
          <div class="card"><div class="card-label">Concluídas</div><div class="card-value">${formatNumber(ordensConcluidas)}</div></div>
          <div class="card"><div class="card-label">Em Andamento</div><div class="card-value">${formatNumber(ordensEmAndamento)}</div></div>
          <div class="card"><div class="card-label">Planejadas</div><div class="card-value">${formatNumber(ordensPlanejadas)}</div></div>
          <div class="card"><div class="card-label">Taxa de Conclusão</div><div class="card-value">${formatNumber(taxaConclusao, 1)}%</div></div>
          <div class="card"><div class="card-label">Tempo Médio por Etapa</div><div class="card-value">${formatNumber(metricaProducao.tempoMedioPorEtapa, 1)} dias</div></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Top 5 Produtos Mais Produzidos</div>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Quantidade de Ordens</th>
            </tr>
          </thead>
          <tbody>
            ${topProdutos
              .map(
                (produto) => `
              <tr>
                <td>${produto.nome}</td>
                <td>${formatNumber(produto.quantidade)}</td>
              </tr>`
              )
              .join("")}
            ${topProdutos.length === 0 ? `<tr><td colspan="2" class="muted">Sem dados para o período</td></tr>` : ""}
          </tbody>
        </table>
      </div>
    `;

    const html = buildReportShell(
      "Relatório de Produção",
      `Período: ${getPeriodoLabel(periodo)}`,
      content
    );

    openPrintWindow(html);
  };

  const handleExportarPerformance = () => {
    const faccoesAtivas = faccoes.filter((f) => f.ativo).length;
    const faccoesTop = faccoesPerformance.slice(0, 5);

    const content = `
      <div class="section">
        <div class="section-title">Indicadores Gerais</div>
        <div class="grid">
          <div class="card"><div class="card-label">Facções Ativas</div><div class="card-value">${formatNumber(faccoesAtivas)}</div></div>
          <div class="card"><div class="card-label">Facções Cadastradas</div><div class="card-value">${formatNumber(faccoes.length)}</div></div>
          <div class="card"><div class="card-label">Produtos Cadastrados</div><div class="card-value">${formatNumber(produtos.length)}</div></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Facções Mais Produtivas</div>
        <table>
          <thead>
            <tr>
              <th>Facção</th>
              <th>Ordens Finalizadas</th>
              <th>Tempo Médio (dias)</th>
              <th>Taxa de Defeitos</th>
            </tr>
          </thead>
          <tbody>
            ${faccoesTop
              .map(
                (faccao) => `
              <tr>
                <td>${faccao.faccaoNome}</td>
                <td>${formatNumber(faccao.ordensFinalizadas)}</td>
                <td>${formatNumber(faccao.tempoMedio, 1)}</td>
                <td>${formatNumber(faccao.taxaDefeitos, 1)}%</td>
              </tr>`
              )
              .join("")}
            ${faccoesTop.length === 0 ? `<tr><td colspan="4" class="muted">Sem dados de performance</td></tr>` : ""}
          </tbody>
        </table>
      </div>
    `;

    const html = buildReportShell(
      "Relatório de Performance",
      "Resumo de Facções e Produtos",
      content
    );

    openPrintWindow(html);
  };

  const getProdutosMaisProduzidos = (
    ordersBase: ProductionOrder[] = orders
  ) => {
    const produtoCount = new Map<string, number>();
    ordersBase.forEach((order) => {
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
          <button
            className="btn-export btn-refresh"
            onClick={handleRefresh}
            disabled={isRefreshing || isExporting}
          >
            <RefreshCw size={18} />
            {isRefreshing ? "Atualizando..." : "Atualizar"}
          </button>
          <button
            className="btn-export"
            onClick={() => runExportJob("Produção (PDF)", handleExportarProducao)}
            disabled={isExporting}
          >
            <Download size={18} />
            Exportar Produção (PDF)
          </button>
          <button
            className="btn-export btn-export-csv"
            onClick={() => runExportJob("Produção (CSV)", exportarCsvProducao)}
            disabled={isExporting}
          >
            <Download size={18} />
            Exportar Produção (CSV)
          </button>
          <button
            className="btn-export btn-export-secondary"
            onClick={() =>
              runExportJob("Performance (PDF)", handleExportarPerformance)
            }
            disabled={isExporting}
          >
            <Download size={18} />
            Exportar Performance (PDF)
          </button>
          <button
            className="btn-export btn-export-secondary btn-export-csv"
            onClick={() =>
              runExportJob("Performance (CSV)", exportarCsvPerformance)
            }
            disabled={isExporting}
          >
            <Download size={18} />
            Exportar Performance (CSV)
          </button>
        </div>
      </div>

      {errorMessage && <div className="relatorios-warning">{errorMessage}</div>}
      {lastUpdatedAt && (
        <div className="relatorios-last-updated">
          Última atualização: {formatDateTimeBR(lastUpdatedAt)}
        </div>
      )}

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
