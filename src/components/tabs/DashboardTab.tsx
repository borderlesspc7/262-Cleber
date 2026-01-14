import { useEffect, useState } from "react";
import { orderService } from "../../services/orderService";
import { produtoService } from "../../services/productService";
import { faccaoService } from "../../services/faccaoService";
import { productionProgressService } from "../../services/productionProgressService";
import { useAuth } from "../../hooks/useAuth";
import { AgendaCard } from "../agenda/AgendaCard";
import type { ProductionOrder } from "../../types/order";
import type { Produto } from "../../types/product";
import type { Faccao } from "../../types/faccao";
import type { ProductionOrderProgress } from "../../types/productionProgress";
import {
  FileText,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ClipboardList,
} from "lucide-react";
import "./DashboardTab.css";

export const DashboardTab = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [faccoes, setFaccoes] = useState<Faccao[]>([]);
  const [progressos, setProgressos] = useState<ProductionOrderProgress[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const [ordersData, produtosData, faccoesData, progressosData] =
          await Promise.all([
            orderService.getOrders(user.uid),
            produtoService.getProdutos(user.uid),
            faccaoService.getFaccoes(),
            productionProgressService.getAllProgress(user.uid),
          ]);

        setOrders(ordersData);
        setProdutos(produtosData);
        setFaccoes(faccoesData);
        setProgressos(progressosData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    loadData();
  }, [user]);

  // Função para obter etapa atual e status
  const getEtapaAtual = (ordemId: string) => {
    const progresso = progressos.find((p) => p.ordemProducaoId === ordemId);
    if (!progresso) return { etapa: "Planejamento", status: "Não iniciada" };

    const etapaEmAndamento = progresso.etapas.find(
      (e) => e.status === "em_andamento"
    );
    if (etapaEmAndamento) {
      return {
        etapa: etapaEmAndamento.etapaNome,
        status: "Em andamento",
      };
    }

    const etapaPausada = progresso.etapas.find((e) => e.status === "pausada");
    if (etapaPausada) {
      return {
        etapa: etapaPausada.etapaNome,
        status: "Pausada",
      };
    }

    const todasFinalizadas = progresso.etapas.every(
      (e) => e.status === "finalizada"
    );
    if (todasFinalizadas && progresso.etapas.length > 0) {
      return {
        etapa: progresso.etapas[progresso.etapas.length - 1].etapaNome,
        status: "Finalizada",
      };
    }

    const ultimaEtapaFinalizada = [...progresso.etapas]
      .reverse()
      .find((e) => e.status === "finalizada");
    if (ultimaEtapaFinalizada) {
      return {
        etapa: ultimaEtapaFinalizada.etapaNome,
        status: "Aguardando próxima",
      };
    }

    return { etapa: "Planejamento", status: "Não iniciada" };
  };

  // Pegar as 4 ordens mais recentes
  const ordensRecentes = [...orders]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 4);

  // Calcula pendências do mês atual

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2 className="tab-title">Dashboard</h2>
        <p className="tab-subtitle">
          Visão geral do sistema de gestão de produção têxtil
        </p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-info">
              <h3 className="card-title">Ordens Ativas</h3>
              <span className="card-value">{orders.length}</span>
              <p className="card-subtitle">Em produção</p>
            </div>
            <div className="card-icon purple">
              <FileText size={16} />
            </div>
          </div>
          <div className="card-footer">
            <span className="card-trend positive">
              <TrendingUp size={12} />
              +12%
            </span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-info">
              <h3 className="card-title">Produtos Cadastrados</h3>
              <span className="card-value">{produtos.length}</span>
              <p className="card-subtitle">Total de referências</p>
            </div>
            <div className="card-icon blue">
              <Package size={16} />
            </div>
          </div>
          <div className="card-footer">
            <span className="card-trend positive">
              <TrendingUp size={12} />
              +8%
            </span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-info">
              <h3 className="card-title">Facções Ativas</h3>
              <span className="card-value">{faccoes.length}</span>
              <p className="card-subtitle">Tercerizados</p>
            </div>
            <div className="card-icon green">
              <Users size={16} />
            </div>
          </div>
          <div className="card-footer">
            <span className="card-trend positive">
              <TrendingUp size={12} />
              +2
            </span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-info">
              <h3 className="card-title">Pendências Financeiras</h3>
              <span className="card-value">R$ 100,00</span>
              <p className="card-subtitle">A pagar este mês</p>
            </div>
            <div className="card-icon yellow">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="card-footer">
            <span className="card-trend negative">
              <TrendingDown size={12} />
              -5%
            </span>
          </div>
        </div>

        <AgendaCard />
      </div>

      {/* Seção de Ordens de Produção Recentes */}
      <div className="recent-orders-section">
        <div className="recent-orders-header">
          <div className="recent-orders-title-wrapper">
            <ClipboardList size={24} className="recent-orders-icon" />
            <div>
              <h2 className="recent-orders-title">
                Ordens de Produção Recentes
              </h2>
              <p className="recent-orders-subtitle">
                Acompanhe o status das suas ordens em tempo real
              </p>
            </div>
          </div>
        </div>

        <div className="recent-orders-list">
          {ordensRecentes.length === 0 ? (
            <div className="no-orders">
              <p>Nenhuma ordem de produção cadastrada ainda.</p>
            </div>
          ) : (
            ordensRecentes.map((ordem) => {
              const { etapa, status } = getEtapaAtual(ordem.id);
              return (
                <div key={ordem.id} className="order-item">
                  <div className="order-item-header">
                    <div className="order-item-left">
                      <span className="order-code">{ordem.codigo}</span>
                      <h3 className="order-product">
                        {ordem.produtoDescricao}
                      </h3>
                      <span
                        className={`order-priority-badge ${ordem.prioridade}`}
                      >
                        {ordem.prioridade}
                      </span>
                    </div>
                    <button
                      className="order-details-btn"
                      onClick={() => {
                        // Navegar para a aba de Gestão de Produções
                        const tabButtons =
                          document.querySelectorAll(".tab-button");
                        const gestaoTab = Array.from(tabButtons).find(
                          (button) =>
                            button.textContent?.includes("Gestão de Produções")
                        ) as HTMLButtonElement;
                        if (gestaoTab) gestaoTab.click();
                      }}
                    >
                      Ver Detalhes
                    </button>
                  </div>
                  <div className="order-item-footer">
                    <span className="order-stage">Etapa: {etapa}</span>
                    <span className="order-status-dot">•</span>
                    <span className="order-status">{status}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
