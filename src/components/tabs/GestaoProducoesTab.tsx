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
  Trash2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { orderService } from "../../services/orderService";
import { stepService } from "../../services/stepService";
import { produtoService } from "../../services/productService";
import { productionProgressService } from "../../services/productionProgressService";
import type { ProductionOrder } from "../../types/order";
import type { ProductionStep } from "../../types/step";
import type { ProductionOrderProgress } from "../../types/productionProgress";
import type { Produto } from "../../types/product";
import {
  FinalizeStageModal,
  type FinalizeStageData,
} from "../production/FinalizeStageModal";
import { faccaoService } from "../../services/faccaoService";
import type { Faccao } from "../../types/faccao";
import { financeiroService } from "../../services/financeiroService";
import toast from "react-hot-toast";
import { DeleteConfirmModal } from "../../components/ui/DeleteConfirmModal/DeleteConfirmModal";
import "./GestaoProducoesTab.css";

export const GestaoProducoesTab: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [steps, setSteps] = useState<ProductionStep[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [progressData, setProgressData] = useState<
    Map<string, ProductionOrderProgress>
  >(new Map());
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");

  const [faccoes, setFaccoes] = useState<Faccao[]>([]);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [orderToFinalize, setOrderToFinalize] = useState<string | null>(null);
  const [isSubmittingFinalize, setIsSubmittingFinalize] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const [ordersData, stepsData, faccoesData, produtosData] =
        await Promise.all([
          orderService.getOrders(user.uid),
          stepService.getStepsByUser(user.uid),
          faccaoService.getFaccoes(),
          produtoService.getProdutos(user.uid),
        ]);

      setOrders(ordersData);
      setSteps(stepsData);
      setFaccoes(faccoesData);

      // Reconstruir produtos com etapas completas
      const produtosCompletos = produtosData.map((produto) => {
        const etapasProduto = (produto.etapasProducaoIds || [])
          .map((etapaForm) => {
            const etapa = stepsData.find((e) => e.id === etapaForm.etapaId);
            if (etapa) {
              return {
                etapa: {
                  id: etapa.id,
                  nome: etapa.name,
                  descricao: etapa.description || undefined,
                  custo: etapaForm.custo,
                  ativo: true,
                  createdAt: etapa.createdAt,
                },
                custo: etapaForm.custo,
                ordem: etapaForm.ordem,
              };
            }
            return null;
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);

        return {
          ...produto,
          etapasProducao: etapasProduto,
        };
      });

      setProdutos(produtosCompletos);

      // Carregar progresso para cada ordem
      const progressMap = new Map<string, ProductionOrderProgress>();
      for (const order of ordersData) {
        let progress = await productionProgressService.getProgressByOrderId(
          order.id
        );

        // Se não existe progresso, inicializar com etapas do produto
        if (!progress) {
          const produto = produtosCompletos.find(
            (p) => p.id === order.produtoId
          );
          if (
            produto &&
            produto.etapasProducao &&
            produto.etapasProducao.length > 0
          ) {
            // Converter etapas do produto para ProductionStep
            const etapasProduto = produto.etapasProducao
              .map((etapaProduto) => {
                const step = stepsData.find(
                  (s) => s.id === etapaProduto.etapa.id
                );
                if (step) {
                  return {
                    ...step,
                    order: etapaProduto.ordem,
                  };
                }
                return null;
              })
              .filter((s): s is ProductionStep => s !== null)
              .sort((a, b) => a.order - b.order);

            if (etapasProduto.length > 0) {
              await productionProgressService.initializeProgress(
                user.uid,
                order.id,
                etapasProduto
              );
              progress = await productionProgressService.getProgressByOrderId(
                order.id
              );
            }
          }
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
    if (!currentStage) {
      // Se não há etapa em andamento, buscar a primeira não finalizada
      return progress.etapas.find((etapa) => etapa.status !== "finalizada");
    }

    // Buscar próxima etapa não finalizada após a atual
    return progress.etapas.find(
      (etapa) =>
        etapa.ordem > currentStage.ordem && etapa.status !== "finalizada"
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

    const order = orders.find((o) => o.id === orderId);
    if (!order)
      return { percent: 0, finalizadas: 0, defeituosas: 0, restantes: 0 };

    const produto = produtos.find((p) => p.id === order.produtoId);
    const totalEtapas =
      produto?.etapasProducao?.length || progress.etapas.length;

    const etapasFinalizadas = progress.etapas.filter(
      (e) => e.status === "finalizada"
    ).length;
    const percent =
      totalEtapas > 0 ? Math.round((etapasFinalizadas / totalEtapas) * 100) : 0;

    const total = totalPiecesByOrder(order);

    // Encontrar a etapa atual (em andamento)
    const currentStage = progress.etapas.find(
      (e) => e.status === "em_andamento"
    );

    // Se não há etapa em andamento, verificar se todas foram finalizadas
    if (!currentStage) {
      const todasFinalizadas = progress.etapas.every(
        (e) => e.status === "finalizada"
      );

      if (todasFinalizadas) {
        // Todas as etapas finalizadas - pegar dados da última etapa
        const ultimaEtapa = progress.etapas[progress.etapas.length - 1];
        const finalizadas = ultimaEtapa?.finalizadas || 0;
        const defeituosas = progress.etapas.reduce(
          (acc, etapa) => acc + (etapa.defeituosas || 0),
          0
        );
        const restantes = total - finalizadas - defeituosas;

        return { percent, finalizadas, defeituosas, restantes };
      }

      // Nenhuma etapa em andamento e nem todas finalizadas
      return { percent, finalizadas: 0, defeituosas: 0, restantes: total };
    }

    // Pegar dados da etapa atual
    const finalizadas = currentStage.finalizadas || 0;

    // Defeituosas acumuladas de todas as etapas
    const defeituosas = progress.etapas.reduce(
      (acc, etapa) => acc + (etapa.defeituosas || 0),
      0
    );

    // Restantes = Total - (Finalizadas na etapa atual + Defeituosas acumuladas)
    const restantes = total - finalizadas - defeituosas;

    return { percent, finalizadas, defeituosas, restantes };
  };

  const handleFinalizeStage = (orderId: string) => {
    setOrderToFinalize(orderId);
    setShowFinalizeModal(true);
  };

  const handleSubmitFinalize = async (data: FinalizeStageData) => {
    if (!user || !orderToFinalize) return;

    const progress = progressData.get(orderToFinalize);
    if (!progress) return;

    const currentStage = getCurrentStage(orderToFinalize);
    if (!currentStage) return;

    const order = orders.find((o) => o.id === orderToFinalize);
    if (!order) return;

    try {
      setIsSubmittingFinalize(true);

      // Finalizar etapa atual
      await productionProgressService.finalizeStageWithDetails(
        progress.id,
        currentStage.etapaId,
        data.finalizadas,
        data.defeituosas,
        data.observacoes
      );

      // Buscar informações da etapa finalizada para criar lançamento financeiro
      const produto = produtos.find((p) => p.id === order.produtoId);
      const etapaFinalizada = produto?.etapasProducao?.find(
        (e) => e.etapa.id === currentStage.etapaId
      );
      const responsavelAtual = faccoes.find(
        (f) => f.id === currentStage.responsavelId
      );

      // Criar lançamento financeiro para a etapa finalizada
      if (etapaFinalizada && responsavelAtual && responsavelAtual.id) {
        const dataVencimento = new Date();
        dataVencimento.setDate(dataVencimento.getDate() + 30); // Vencimento em 30 dias

        await financeiroService.createLancamento(
          {
            ordemProducaoId: order.id,
            ordemCodigo: order.codigo,
            produtoId: order.produtoId,
            produtoDescricao: produto?.descricao || "Produto",
            etapaId: currentStage.etapaId,
            etapaNome: currentStage.etapaNome,
            faccaoId: responsavelAtual.id,
            faccaoNome: responsavelAtual.nome,
            valor: etapaFinalizada.custo,
            dataVencimento,
            observacoes: data.observacoes || undefined,
          },
          user.uid
        );
      }

      // Iniciar próxima etapa
      const proximaEtapa = steps.find(
        (etapa) => etapa.id === data.proximaEtapaId
      );
      const responsavel = faccoes.find(
        (faccao) => faccao.id === data.responsavelProximaEtapaId
      );

      if (proximaEtapa && responsavel) {
        await productionProgressService.startNextStage(
          progress.id,
          data.proximaEtapaId,
          data.responsavelProximaEtapaId,
          responsavel.nome
        );
      }

      await loadData();
      setShowFinalizeModal(false);
      setOrderToFinalize(null);

      toast.success("Etapa finalizada e lançamento financeiro criado!", {
        icon: <Check size={20} />,
      });
    } catch (error) {
      console.error("Erro ao finalizar etapa:", error);
      toast.error("Erro ao finalizar etapa");
    } finally {
      setIsSubmittingFinalize(false);
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

  const handleDeleteClick = (id: string) => {
    setOrderToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    const order = orders.find((o) => o.id === orderToDelete);
    if (!order || !orderToDelete) return;

    try {
      setIsDeleting(true);
      const progress = progressData.get(orderToDelete);
      if (progress) {
        try {
          await productionProgressService.deleteProgress(progress.id);
        } catch (error) {
          console.error("Erro ao deletar progresso:", error);
        }
      }

      // Deletar lançamentos financeiros associados
      try {
        await financeiroService.deleteLancamentosByOrdem(orderToDelete);
      } catch (error) {
        console.error("Erro ao deletar lançamentos financeiros:", error);
      }

      await orderService.deleteOrder(orderToDelete);
      await loadData();

      toast.success("Ordem de produção excluída com sucesso!", {
        icon: <Check size={20} />,
      });
    } catch (error) {
      console.error("Erro ao excluir ordem:", error);
      toast.error("Erro ao excluir ordem de produção. Tente novamente.");
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
                    <span className="progress-title">Progresso Geral</span>
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
                      {progressInfo.finalizadas} peças finalizadas
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
                      {activeStage?.responsavelNome ||
                        order.responsavelNome ||
                        "Não atribuído"}
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
                <button
                  className="gestao-action-btn gestao-action-delete"
                  onClick={() => handleDeleteClick(order.id)}
                  title="Excluir ordem"
                >
                  <Trash2 size={16} className="gestao-action-icon" />
                  Excluir
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

      {showFinalizeModal &&
        orderToFinalize &&
        (() => {
          const order = orders.find((o) => o.id === orderToFinalize);
          const currentStage = getCurrentStage(orderToFinalize);
          const progress = progressData.get(orderToFinalize);

          if (!order || !currentStage || !progress) return null;

          // Buscar produto para obter etapas cadastradas
          const produto = produtos.find((p) => p.id === order.produtoId);

          // Usar etapas do produto (não todas do sistema)
          const etapasDoProduto = produto?.etapasProducao || [];

          // Filtrar próximas etapas disponíveis (apenas as que estão após a etapa atual)
          // Manter todas as etapas visíveis, mesmo as finalizadas
          const availableStages = etapasDoProduto
            .filter((etapaProduto) => {
              const etapaProgress = progress.etapas.find(
                (e) => e.etapaId === etapaProduto.etapa.id
              );
              if (!etapaProgress) return false;
              return etapaProgress.ordem > currentStage.ordem;
            })
            .map((etapaProduto) => {
              // Converter EtapaProducao para ProductionStep
              const step = steps.find((s) => s.id === etapaProduto.etapa.id);
              if (step) {
                return {
                  ...step,
                  name: etapaProduto.etapa.nome,
                  description: etapaProduto.etapa.descricao || "",
                };
              }
              return null;
            })
            .filter((s): s is ProductionStep => s !== null)
            .sort((a, b) => {
              const ordemA =
                progress.etapas.find((e) => e.etapaId === a.id)?.ordem || 0;
              const ordemB =
                progress.etapas.find((e) => e.etapaId === b.id)?.ordem || 0;
              return ordemA - ordemB;
            });

          return (
            <FinalizeStageModal
              isOpen={showFinalizeModal}
              onClose={() => {
                setShowFinalizeModal(false);
                setOrderToFinalize(null);
              }}
              order={order}
              currentStage={currentStage}
              availableStages={availableStages}
              faccoes={faccoes.filter((f) => f.ativo)}
              totalPecas={totalPiecesByOrder(order)}
              onSubmit={handleSubmitFinalize}
              isSubmitting={isSubmittingFinalize}
            />
          );
        })()}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setOrderToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        itemName={orders.find((o) => o.id === orderToDelete)?.codigo || ""}
        loading={isDeleting}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir esta ordem de produção?"
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
};
