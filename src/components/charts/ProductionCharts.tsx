import React, { useMemo } from "react";
import { BarChart3, PieChart } from "lucide-react";
import type { ProductionOrder } from "../../types/order";
import type { ProductionOrderProgress } from "../../types/productionProgress";
import "./ProductionCharts.css";

interface ProductionChartsProps {
  orders: ProductionOrder[];
  progressos: ProductionOrderProgress[];
}

// Nomes dos meses em português
const MONTH_NAMES_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

interface MonthlyData {
  month: string;
  planejada: number;
  em_producao: number;
  concluida: number;
  total: number;
}

export const ProductionCharts: React.FC<ProductionChartsProps> = ({
  orders,
  progressos,
}) => {
  // ===== Dados para o gráfico de barras (volume mensal) =====
  const monthlyData: MonthlyData[] = useMemo(() => {
    const now = new Date();
    const months: MonthlyData[] = [];

    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${MONTH_NAMES_SHORT[d.getMonth()]}`;

      const monthOrders = orders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        const orderKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;
        return orderKey === monthKey;
      });

      months.push({
        month: label,
        planejada: monthOrders.filter((o) => o.status === "planejada").length,
        em_producao: monthOrders.filter((o) => o.status === "em_producao").length,
        concluida: monthOrders.filter((o) => o.status === "concluida").length,
        total: monthOrders.length,
      });
    }

    return months;
  }, [orders]);

  const maxBarValue = useMemo(() => {
    const max = Math.max(
      ...monthlyData.flatMap((d) => [d.planejada, d.em_producao, d.concluida]),
      1
    );
    return max;
  }, [monthlyData]);

  // ===== Dados para o gráfico donut (distribuição por status) =====
  const statusDistribution = useMemo(() => {
    const planejada = orders.filter((o) => o.status === "planejada").length;
    const emProducao = orders.filter((o) => o.status === "em_producao").length;
    const concluida = orders.filter((o) => o.status === "concluida").length;
    const total = orders.length || 1; // evitar divisão por 0

    return {
      planejada,
      emProducao,
      concluida,
      total: orders.length,
      percPlanejada: Math.round((planejada / total) * 100),
      percEmProducao: Math.round((emProducao / total) * 100),
      percConcluida: Math.round((concluida / total) * 100),
    };
  }, [orders]);

  // ===== Calcular peças finalizadas vs total para produtividade =====
  const productivityRate = useMemo(() => {
    let totalPecas = 0;
    let finalizadas = 0;

    orders.forEach((order) => {
      // Total de peças da grade
      const pecasOrdem = order.grade?.reduce((acc, row) => acc + row.total, 0) || 0;
      totalPecas += pecasOrdem;

      // Peças finalizadas no progresso
      const progresso = progressos.find((p) => p.ordemProducaoId === order.id);
      if (progresso && progresso.etapas.length > 0) {
        // A última etapa finalizada indica as peças concluídas
        const ultimaEtapa = [...progresso.etapas]
          .sort((a, b) => b.ordem - a.ordem)
          .find((e) => e.status === "finalizada");
        if (ultimaEtapa) {
          finalizadas += ultimaEtapa.finalizadas || 0;
        }
      }
    });

    return { totalPecas, finalizadas };
  }, [orders, progressos]);

  // ===== SVG Doughnut segments =====
  const doughnutSegments = useMemo(() => {
    const total = statusDistribution.total || 1;
    const radius = 52;
    const circumference = 2 * Math.PI * radius;

    const segments: { color: string; offset: number; length: number; className: string }[] = [];
    let currentOffset = 0;

    if (statusDistribution.concluida > 0) {
      const length = (statusDistribution.concluida / total) * circumference;
      segments.push({
        color: "#10b981",
        offset: currentOffset,
        length,
        className: "segment-concluida",
      });
      currentOffset += length;
    }

    if (statusDistribution.emProducao > 0) {
      const length = (statusDistribution.emProducao / total) * circumference;
      segments.push({
        color: "#667eea",
        offset: currentOffset,
        length,
        className: "segment-em-producao",
      });
      currentOffset += length;
    }

    if (statusDistribution.planejada > 0) {
      const length = (statusDistribution.planejada / total) * circumference;
      segments.push({
        color: "#94a3b8",
        offset: currentOffset,
        length,
        className: "segment-planejada",
      });
      currentOffset += length;
    }

    return { segments, circumference, radius };
  }, [statusDistribution]);

  const hasOrders = orders.length > 0;

  return (
    <div className="production-charts-section">
      {/* ===== Gráfico de Barras - Volume Mensal ===== */}
      <div className="chart-card" id="chart-monthly-volume">
        <div className="chart-card-header">
          <div className="chart-card-header-left">
            <div className="chart-card-icon gradient-purple">
              <BarChart3 size={18} />
            </div>
            <div>
              <h3 className="chart-card-title">Volume de Produção</h3>
              <p className="chart-card-subtitle">Últimos 6 meses</p>
            </div>
          </div>
          <span className="chart-card-badge">
            {productivityRate.finalizadas}/{productivityRate.totalPecas} peças
          </span>
        </div>

        {hasOrders ? (
          <div className="bar-chart-container">
            <div className="bar-chart-wrapper">
              {monthlyData.map((data, index) => (
                <div className="bar-chart-column" key={index}>
                  <div className="bar-chart-bar-group">
                    <div
                      className="bar-chart-bar bar-planejada"
                      style={{
                        height: `${(data.planejada / maxBarValue) * 100}%`,
                      }}
                    >
                      {data.planejada > 0 && (
                        <span className="bar-chart-bar-tooltip">
                          {data.planejada} planejada{data.planejada !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div
                      className="bar-chart-bar bar-em-producao"
                      style={{
                        height: `${(data.em_producao / maxBarValue) * 100}%`,
                      }}
                    >
                      {data.em_producao > 0 && (
                        <span className="bar-chart-bar-tooltip">
                          {data.em_producao} em produção
                        </span>
                      )}
                    </div>
                    <div
                      className="bar-chart-bar bar-concluida"
                      style={{
                        height: `${(data.concluida / maxBarValue) * 100}%`,
                      }}
                    >
                      {data.concluida > 0 && (
                        <span className="bar-chart-bar-tooltip">
                          {data.concluida} concluída{data.concluida !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bar-chart-labels">
              {monthlyData.map((data, index) => (
                <span className="bar-chart-label" key={index}>
                  {data.month}
                </span>
              ))}
            </div>
            <div className="bar-chart-legend">
              <span className="bar-chart-legend-item">
                <span className="bar-chart-legend-dot legend-planejada" />
                Planejada
              </span>
              <span className="bar-chart-legend-item">
                <span className="bar-chart-legend-dot legend-em-producao" />
                Em Produção
              </span>
              <span className="bar-chart-legend-item">
                <span className="bar-chart-legend-dot legend-concluida" />
                Concluída
              </span>
            </div>
          </div>
        ) : (
          <div className="bar-chart-empty">
            <BarChart3 size={32} className="bar-chart-empty-icon" />
            <p>Nenhuma ordem de produção para exibir</p>
          </div>
        )}
      </div>

      {/* ===== Gráfico Donut - Distribuição por Status ===== */}
      <div className="chart-card" id="chart-status-distribution">
        <div className="chart-card-header">
          <div className="chart-card-header-left">
            <div className="chart-card-icon gradient-blue">
              <PieChart size={18} />
            </div>
            <div>
              <h3 className="chart-card-title">Distribuição por Status</h3>
              <p className="chart-card-subtitle">Panorama atual das ordens</p>
            </div>
          </div>
          <span className="chart-card-badge">
            {statusDistribution.total} total
          </span>
        </div>

        {hasOrders ? (
          <div className="doughnut-chart-container">
            <div className="doughnut-chart-visual">
              <div className="doughnut-chart-ring">
                <svg className="doughnut-chart-svg" viewBox="0 0 120 120">
                  <circle
                    className="doughnut-chart-track"
                    cx="60"
                    cy="60"
                    r={doughnutSegments.radius}
                  />
                  {doughnutSegments.segments.map((seg, i) => (
                    <circle
                      key={i}
                      className={`doughnut-chart-segment ${seg.className}`}
                      cx="60"
                      cy="60"
                      r={doughnutSegments.radius}
                      stroke={seg.color}
                      strokeDasharray={`${seg.length} ${doughnutSegments.circumference - seg.length}`}
                      strokeDashoffset={-seg.offset}
                    />
                  ))}
                </svg>
                <div className="doughnut-chart-center">
                  <span className="doughnut-chart-center-value">
                    {statusDistribution.total}
                  </span>
                  <span className="doughnut-chart-center-label">Ordens</span>
                </div>
              </div>

              <div className="doughnut-chart-stats">
                <div className="doughnut-stat-item">
                  <span className="doughnut-stat-dot stat-concluida" />
                  <div className="doughnut-stat-info">
                    <p className="doughnut-stat-label">Concluídas</p>
                    <p className="doughnut-stat-value">{statusDistribution.concluida}</p>
                  </div>
                  <span className="doughnut-stat-percent">{statusDistribution.percConcluida}%</span>
                </div>
                <div className="doughnut-stat-item">
                  <span className="doughnut-stat-dot stat-em-producao" />
                  <div className="doughnut-stat-info">
                    <p className="doughnut-stat-label">Em Produção</p>
                    <p className="doughnut-stat-value">{statusDistribution.emProducao}</p>
                  </div>
                  <span className="doughnut-stat-percent">{statusDistribution.percEmProducao}%</span>
                </div>
                <div className="doughnut-stat-item">
                  <span className="doughnut-stat-dot stat-planejada" />
                  <div className="doughnut-stat-info">
                    <p className="doughnut-stat-label">Planejadas</p>
                    <p className="doughnut-stat-value">{statusDistribution.planejada}</p>
                  </div>
                  <span className="doughnut-stat-percent">{statusDistribution.percPlanejada}%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="doughnut-chart-empty">
            <PieChart size={32} className="doughnut-chart-empty-icon" />
            <p>Nenhuma ordem de produção para exibir</p>
          </div>
        )}
      </div>
    </div>
  );
};
