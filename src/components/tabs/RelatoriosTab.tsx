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
import { jsPDF } from "jspdf";

type RelatorioType = "producao" | "performance";
type PeriodoType = "semana" | "mes" | "trimestre" | "ano";

type PdfTableRow = Array<string | number>;

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

  const createReportPdf = (title: string, subtitle: string) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = margin;

    const companyName = companyInfo?.nome?.trim();
    if (companyName) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(companyName, margin, y);
      y += 16;
    }

    const companyDetails = [companyInfo?.email, companyInfo?.endereco]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));

    if (companyDetails.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      companyDetails.forEach((detail) => {
        const lines = doc.splitTextToSize(detail, pageWidth - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * 11;
      });
      y += 8;
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 24;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(title, margin, y);
    y += 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle, margin, y);
    y += 16;
    doc.text(`Gerado em ${formatDateTimeBR(new Date())}`, margin, y);
    y += 24;
    doc.setTextColor(15, 23, 42);

    return { doc, y, margin, pageWidth };
  };

  const ensurePdfSpace = (
    doc: jsPDF,
    currentY: number,
    requiredHeight: number,
    margin: number
  ) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (currentY + requiredHeight <= pageHeight - margin) {
      return currentY;
    }

    doc.addPage();
    return margin;
  };

  const addPdfSectionTitle = (
    doc: jsPDF,
    title: string,
    currentY: number,
    margin: number
  ) => {
    const y = ensurePdfSpace(doc, currentY, 28, margin);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, margin, y);
    return y + 16;
  };

  const addPdfCards = (
    doc: jsPDF,
    cards: Array<{ label: string; value: string }>,
    currentY: number,
    margin: number,
    pageWidth: number
  ) => {
    const gap = 8;
    const columns = 3;
    const cardWidth = (pageWidth - margin * 2 - gap * (columns - 1)) / columns;
    const cardHeight = 48;
    let y = currentY;

    cards.forEach((card, index) => {
      if (index % columns === 0) {
        y = ensurePdfSpace(doc, y, cardHeight, margin);
      }

      const column = index % columns;
      const x = margin + column * (cardWidth + gap);

      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, cardWidth, cardHeight, 6, 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(card.label, x + 10, y + 16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(card.value, x + 10, y + 36);

      if (column === columns - 1 || index === cards.length - 1) {
        y += cardHeight + gap;
      }
    });

    return y + 8;
  };

  const addPdfTable = (
    doc: jsPDF,
    headers: string[],
    rows: PdfTableRow[],
    currentY: number,
    margin: number,
    pageWidth: number
  ) => {
    const tableWidth = pageWidth - margin * 2;
    const columnWidth = tableWidth / headers.length;
    const headerHeight = 24;
    const lineHeight = 11;
    const padding = 6;
    let y = ensurePdfSpace(doc, currentY, headerHeight + 24, margin);

    const drawHeader = () => {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, tableWidth, headerHeight, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      headers.forEach((header, index) => {
        doc.text(header, margin + index * columnWidth + padding, y + 15);
      });
      y += headerHeight;
    };

    drawHeader();

    const rowsToRender = rows.length > 0 ? rows : [["Sem dados"]];
    rowsToRender.forEach((row) => {
      const cellLines = headers.map((_, index) =>
        doc.splitTextToSize(String(row[index] ?? ""), columnWidth - padding * 2)
      );
      const rowHeight =
        Math.max(...cellLines.map((lines) => lines.length)) * lineHeight +
        padding * 2;

      y = ensurePdfSpace(doc, y, rowHeight, margin);
      if (y === margin) {
        drawHeader();
      }

      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, tableWidth, rowHeight);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);

      cellLines.forEach((lines, index) => {
        doc.text(lines, margin + index * columnWidth + padding, y + padding + 9);
      });

      y += rowHeight;
    });

    return y + 12;
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

    const pdf = createReportPdf(
      "Relatório de Produção",
      `Período: ${getPeriodoLabel(periodo)}`
    );

    let y = addPdfSectionTitle(
      pdf.doc,
      "Resumo",
      pdf.y,
      pdf.margin
    );
    y = addPdfCards(
      pdf.doc,
      [
        { label: "Total de Ordens", value: formatNumber(ordersFiltradas.length) },
        { label: "Concluídas", value: formatNumber(ordensConcluidas) },
        { label: "Em Andamento", value: formatNumber(ordensEmAndamento) },
        { label: "Planejadas", value: formatNumber(ordensPlanejadas) },
        { label: "Taxa de Conclusão", value: `${formatNumber(taxaConclusao, 1)}%` },
        {
          label: "Tempo Médio por Etapa",
          value: `${formatNumber(metricaProducao.tempoMedioPorEtapa, 1)} dias`,
        },
      ],
      y,
      pdf.margin,
      pdf.pageWidth
    );

    y = addPdfSectionTitle(
      pdf.doc,
      "Top 5 Produtos Mais Produzidos",
      y,
      pdf.margin
    );
    addPdfTable(
      pdf.doc,
      ["Produto", "Quantidade de Ordens"],
      topProdutos.map((produto) => [
        produto.nome,
        formatNumber(produto.quantidade),
      ]),
      y,
      pdf.margin,
      pdf.pageWidth
    );

    const fileDate = getExportFileDate();
    const stamp = getExportTimestamp();
    pdf.doc.save(`relatorios-producao-${periodo}-${fileDate}-${stamp}.pdf`);
  };

  const handleExportarPerformance = () => {
    const faccoesAtivas = faccoes.filter((f) => f.ativo).length;
    const faccoesTop = faccoesPerformance.slice(0, 5);

    const pdf = createReportPdf(
      "Relatório de Performance",
      `Período: ${getPeriodoLabel(periodo)}`
    );

    let y = addPdfSectionTitle(
      pdf.doc,
      "Indicadores Gerais",
      pdf.y,
      pdf.margin
    );
    y = addPdfCards(
      pdf.doc,
      [
        { label: "Facções Ativas", value: formatNumber(faccoesAtivas) },
        { label: "Facções Cadastradas", value: formatNumber(faccoes.length) },
        { label: "Produtos Cadastrados", value: formatNumber(produtos.length) },
      ],
      y,
      pdf.margin,
      pdf.pageWidth
    );

    y = addPdfSectionTitle(
      pdf.doc,
      "Facções Mais Produtivas",
      y,
      pdf.margin
    );
    addPdfTable(
      pdf.doc,
      ["Facção", "Ordens Finalizadas", "Tempo Médio", "Taxa de Defeitos"],
      faccoesTop.map((faccao) => [
        faccao.faccaoNome,
        formatNumber(faccao.ordensFinalizadas),
        `${formatNumber(faccao.tempoMedio, 1)} dias`,
        `${formatNumber(faccao.taxaDefeitos, 1)}%`,
      ]),
      y,
      pdf.margin,
      pdf.pageWidth
    );

    const fileDate = getExportFileDate();
    const stamp = getExportTimestamp();
    pdf.doc.save(`relatorios-performance-${periodo}-${fileDate}-${stamp}.pdf`);
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
