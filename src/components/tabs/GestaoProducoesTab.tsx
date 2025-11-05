import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Search,
  ChevronDown,
  Check,
  Pause,
  AlertTriangle,
  User,
  Clock,
  ArrowRight,
  Shirt,
  Play,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { orderService } from "../../services/orderService";
import { stepService } from "../../services/stepService";
import { productionProgressService } from "../../services/productionProgressService";
import type { ProductionOrder } from "../../types/order";
import type { ProductionStep } from "../../types/step";
import type { ProductionOrderProgress } from "../../types/productionProgress";
import "./GestaoProducoesTab.css";

export const GestaoProducoesTab: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [steps, setSteps] = useState<ProductionStep[]>([]);
  const [progressData, setProgressData] = useState<
    Map<string, ProductionOrderProgress>
  >(new Map());
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const [ordersData, stepsData] = await Promise.all([
        orderService.getOrders(user.uid),
        stepService.getStepsByUser(user.uid),
      ]);

      setOrders(ordersData);
      setSteps(stepsData);

      // Carregar progresso para cada ordem
      const progressMap = new Map<string, ProductionOrderProgress>();
      for (const order of ordersData) {
        let progress = await productionProgressService.getProgressByOrderId(
          order.id
        );

        // Se não existe progresso, inicializar
        if (!progress && stepsData.length > 0) {
          await productionProgressService.initializeProgress(
            user.uid,
            order.id,
            stepsData
          );
          progress = await productionProgressService.getProgressByOrderId(
            order.id
          );
        }

        if (progress) {
          progressMap.set(order.id, progress);
        }
      }
      setProgressData(progressMap);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Filtro por busca
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      filtered = filtered.filter((order) => {
        return (
          order.codigo.toLowerCase().includes(term) ||
          order.produtoDescricao.toLowerCase().includes(term) ||
          order.produtoRef.toLowerCase().includes(term) ||
          order.responsavelNome?.toLowerCase().includes(term)
        );
      });
    }

    // Filtro por etapa
    if (selectedStage !== "all") {
      filtered = filtered.filter((order) => {
        const progress = progressData.get(order.id);
        if (!progress) return false;
        return progress.etapas.some(
          (etapa) =>
            etapa.etapaId === selectedStage && etapa.status === "em_andamento"
        );
      });
    }

    return filtered;
  }, [orders, search, selectedStage, progressData]);

  const totalPiecesByOrder = (order: ProductionOrder) =>
    order.grade.reduce((acc, row) => acc + row.total, 0);

  const getCurrentStage = (orderId: string) => {
    const progress = progressData.get(orderId);
    if (!progress) return null;

    return progress.etapas.find((etapa) => etapa.status === "em_andamento");
  };

  const getNextStage = (orderId: string) => {
    const progress = progressData.get(orderId);
    if (!progress) return null;

    const currentStage = getCurrentStage(orderId);
    if (!currentStage) return null;

    return progress.etapas.find(
      (etapa) => etapa.ordem === currentStage.ordem + 1
    );
  };

  const getPausedStage = (orderId: string) => {
    const progress = progressData.get(orderId);
    if (!progress) return null;

    return progress.etapas.find((etapa) => etapa.status === "pausada");
  };

  const isOrderPaused = (orderId: string) => {
    const progress = progressData.get(orderId);
    if (!progress) return false;

    const hasActiveStage = progress.etapas.some(
      (etapa) => etapa.status === "em_andamento"
    );
    const hasPausedStage = progress.etapas.some(
      (etapa) => etapa.status === "pausada"
    );

    return hasPausedStage && !hasActiveStage;
  };

  const getStageProgress = (orderId: string) => {
    const progress = progressData.get(orderId);
    if (!progress)
      return { percent: 0, finalizadas: 0, defeituosas: 0, restantes: 0 };

    const currentStage = getCurrentStage(orderId);
    if (!currentStage)
      return { percent: 0, finalizadas: 0, defeituosas: 0, restantes: 0 };

    const order = orders.find((o) => o.id === orderId);
    if (!order)
      return { percent: 0, finalizadas: 0, defeituosas: 0, restantes: 0 };

    const total = totalPiecesByOrder(order);
    const finalizadas = currentStage.finalizadas || 0;
    const defeituosas = currentStage.defeituosas || 0;
    const restantes = total - finalizadas;
    const percent = total > 0 ? Math.round((finalizadas / total) * 100) : 0;

    return { percent, finalizadas, defeituosas, restantes };
  };

  const handleFinalizeStage = async (orderId: string) => {
    if (!user) return;
    const progress = progressData.get(orderId);
    if (!progress) return;

    const currentStage = getCurrentStage(orderId);
    if (!currentStage) return;

    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const total = totalPiecesByOrder(order);

    try {
      await productionProgressService.finalizeStage(
        progress.id,
        currentStage.etapaId,
        total,
        0
      );

      // Ativar próxima etapa
      const nextStage = getNextStage(orderId);
      if (nextStage) {
        await productionProgressService.resumeStage(
          progress.id,
          nextStage.etapaId
        );
      }

      await loadData();
    } catch (error) {
      console.error("Erro ao finalizar etapa:", error);
      alert("Erro ao finalizar etapa");
    }
  };

  const handlePauseStage = async (orderId: string) => {
    if (!user) return;
    const progress = progressData.get(orderId);
    if (!progress) return;

    const currentStage = getCurrentStage(orderId);
    if (!currentStage) return;

    try {
      await productionProgressService.pauseStage(
        progress.id,
        currentStage.etapaId
      );
      await loadData();
    } catch (error) {
      console.error("Erro ao pausar etapa:", error);
      alert("Erro ao pausar etapa");
    }
  };

  const handleResumeStage = async (orderId: string) => {
    if (!user) return;
    const progress = progressData.get(orderId);
    if (!progress) return;

    const pausedStage = getPausedStage(orderId);
    if (!pausedStage) return;

    try {
      await productionProgressService.resumeStage(
        progress.id,
        pausedStage.etapaId
      );
      await loadData();
    } catch (error) {
      console.error("Erro ao retomar etapa:", error);
      alert("Erro ao retomar etapa");
    }
  };

  return (
    <div className="gestao-producoes-container">
      <header className="gestao-producoes-header">
        <div>
          <h2 className="gestao-producoes-title">Gestão de Produção</h2>
          <p className="gestao-producoes-subtitle">
            Controle o andamento das ordens de produção em tempo real
          </p>
        </div>
      </header>

      <div className="gestao-producoes-filters">
        <div className="gestao-producoes-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por OP, produto ou referência..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="gestao-producoes-stage-filter">
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
          >
            <option value="all">Todas as Etapas</option>
            {steps.map((step) => (
              <option key={step.id} value={step.id}>
                {step.name}
              </option>
            ))}
          </select>
          <ChevronDown size={18} className="select-icon" />
        </div>
      </div>

      <section className="gestao-producoes-list">
        {filteredOrders.map((order) => {
          const currentStage = getCurrentStage(order.id);
          const pausedStage = getPausedStage(order.id);
          const nextStage = getNextStage(order.id);
          const progressInfo = getStageProgress(order.id);
          const total = totalPiecesByOrder(order);
          const isPaused = isOrderPaused(order.id);
          const activeStage = currentStage || pausedStage;

          return (
            <article key={order.id} className="gestao-producao-card">
              {/* Header do Card */}
              <div className="gestao-card-header">
                <div className="gestao-card-header-left">
                  <div className="gestao-card-icon">
                    <Shirt size={24} />
                  </div>
                  <div className="gestao-card-info">
                    <div className="gestao-card-op">{order.codigo}</div>
                    <h3 className="gestao-card-title">
                      {order.produtoDescricao}
                    </h3>
                    <div className="gestao-card-meta">
                      <span>REF: {order.produtoRef}</span>
                      <span className="gestao-card-pieces">{total} peças</span>
                    </div>
                  </div>
                </div>
                <div className="gestao-card-header-right">
                  <span
                    className={`gestao-badge gestao-badge-status ${
                      isPaused ? "gestao-badge-paused" : ""
                    }`}
                  >
                    {isPaused ? "Pausada" : "Em Andamento"}
                  </span>
                  {activeStage && (
                    <span className="gestao-badge gestao-badge-stage">
                      {activeStage.etapaNome}
                    </span>
                  )}
                </div>
              </div>

              {/* Progresso da Etapa */}
              {activeStage && (
                <div className="gestao-card-progress">
                  <div className="progress-header">
                    <span className="progress-title">Progresso da Etapa</span>
                    <span className="progress-percent">
                      {progressInfo.percent}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${progressInfo.percent}%` }}
                    />
                  </div>
                  <div className="progress-stats">
                    <span className="progress-stat">
                      {progressInfo.finalizadas} finalizadas
                    </span>
                    <span className="progress-stat">
                      {progressInfo.defeituosas} defeituosas
                    </span>
                    <span className="progress-stat">
                      {progressInfo.restantes} restantes
                    </span>
                  </div>
                </div>
              )}

              {/* Informações */}
              <div className="gestao-card-details">
                <div className="detail-item">
                  <User size={16} className="detail-icon" />
                  <div className="detail-content">
                    <span className="detail-label">Responsável</span>
                    <span className="detail-value">
                      {order.responsavelNome || "Não atribuído"}
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <Clock size={16} className="detail-icon" />
                  <div className="detail-content">
                    <span className="detail-label">Iniciado em</span>
                    <span className="detail-value">
                      {order.dataInicio || "--"}
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <ArrowRight size={16} className="detail-icon" />
                  <div className="detail-content">
                    <span className="detail-label">Próxima Etapa</span>
                    <span className="detail-value">
                      {nextStage?.etapaNome || "Concluída"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="gestao-card-actions">
                {isPaused ? (
                  <button
                    className="gestao-action-btn gestao-action-resume"
                    onClick={() => handleResumeStage(order.id)}
                  >
                    <Play size={16} className="gestao-action-icon" />
                    Retomar Produção
                  </button>
                ) : (
                  <>
                    <button
                      className="gestao-action-btn gestao-action-finish"
                      onClick={() => handleFinalizeStage(order.id)}
                      disabled={
                        !currentStage || currentStage.status !== "em_andamento"
                      }
                    >
                      <Check size={16} className="gestao-action-icon" />
                      Finalizar Etapa
                    </button>
                    <button
                      className="gestao-action-btn gestao-action-pause"
                      onClick={() => handlePauseStage(order.id)}
                      disabled={
                        !currentStage || currentStage.status !== "em_andamento"
                      }
                    >
                      <Pause size={16} className="gestao-action-icon" />
                      Pausar
                    </button>
                  </>
                )}
                <button className="gestao-action-btn gestao-action-report">
                  <AlertTriangle size={16} className="gestao-action-icon" />
                  Reportar Problema
                </button>
              </div>
            </article>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="gestao-producoes-empty">
            <Search size={24} />
            <p>Nenhuma ordem de produção encontrada.</p>
          </div>
        )}
      </section>
    </div>
  );
};
