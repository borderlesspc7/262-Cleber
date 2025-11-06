import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Printer,
  Pencil,
  Clock,
  Calendar,
  ClipboardList,
  CircleDot,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { orderService } from "../../services/orderService";
import { produtoService } from "../../services/productService";
import type { ProductionOrder } from "../../types/order";
import type { Produto } from "../../types/product";
import { OrderModal } from "../orders/OrderModal";
import toast from "react-hot-toast";
import "./OrdemProducoesTab.css";

const PRIORITY_LABELS = {
  alta: { label: "Alta", className: "badge priority-high" },
  media: { label: "Média", className: "badge priority-medium" },
  baixa: { label: "Baixa", className: "badge priority-low" },
};

const STATUS_LABELS = {
  planejada: { label: "Planejada", className: "badge status-gray" },
  em_producao: { label: "Em Produção", className: "badge status-warning" },
  concluida: { label: "Concluída", className: "badge status-success" },
};

export const OrdemProducoesTab: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!user) return;

    const [ordersData, produtosData] = await Promise.all([
      orderService.getOrders(user.uid),
      produtoService.getProdutos(user.uid),
    ]);
    setOrders(ordersData);
    setProdutos(produtosData);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return orders;

    return orders.filter((order) => {
      const produto = produtos.find((p) => p.id === order.produtoId);
      return (
        order.codigo.toLowerCase().includes(term) ||
        produto?.descricao.toLowerCase().includes(term) ||
        produto?.refCodigo.toLowerCase().includes(term)
      );
    });
  }, [orders, produtos, search]);

  const totalPiecesByOrder = (order: ProductionOrder) =>
    order.grade.reduce((acc, row) => acc + row.total, 0);

  const handleCreateOrder = async (
    payload: Parameters<typeof orderService.createOrder>[1]
  ) => {
    if (!user) return;

    // Buscar informações do produto
    const produto = produtos.find((p) => p.id === payload.produtoId);
    if (!produto) {
      toast.error("Produto não encontrado");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Buscar nome do responsável se houver
      let responsavelNome: string | undefined;
      if (payload.responsavelId) {
        const { faccaoService } = await import("../../services/faccaoService");
        const faccoes = await faccaoService.getFaccoes();
        const faccao = faccoes.find((f) => f.id === payload.responsavelId);
        responsavelNome = faccao?.nome;
      }
      
      await orderService.createOrder(
        user.uid, 
        payload, 
        {
          descricao: produto.descricao,
          refCodigo: produto.refCodigo,
        },
        responsavelNome
      );
      await loadData();
      setIsModalOpen(false);
      toast.success("Ordem de produção criada com sucesso!", {
        icon: "🎉",
      });
    } catch (error) {
      console.error("Erro ao criar ordem de produção:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao criar ordem de produção. Tente novamente.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ordens-container">
      <header className="ordens-header">
        <div>
          <h2>Ordens de Produção</h2>
          <p>Programe e gerencie suas ordens de produção</p>
        </div>
        <button className="ordens-new-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Nova Ordem
        </button>
      </header>

      <div className="ordens-search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar por número da OP, produto ou referência..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <section className="ordens-list">
        {filteredOrders.map((order) => {
          const produto = produtos.find((p) => p.id === order.produtoId);
          return (
            <article key={order.id} className="ordem-card">
              <div className="ordem-card__header">
                <div className="ordem-card__header-left">
                  <div className="ordem-card__icon">
                    <ClipboardList size={24} />
                  </div>
                  <div className="ordem-card__info-main">
                    <div className="ordem-card__code">{order.codigo}</div>
                    <h3 className="ordem-card__title">
                      {produto?.descricao ?? "Produto removido"}
                    </h3>
                    <div className="ordem-card__meta">
                      <div className="ordem-card__meta-item">
                        <span>REF:</span>
                        <strong>{produto?.refCodigo ?? "--"}</strong>
                      </div>
                      <span className="badge badge-neutral">
                        {produto?.categoria?.nome ?? "Categoria"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ordem-card__header-right">
                  <div className="ordem-card__status">
                    <span
                      className={PRIORITY_LABELS[order.prioridade].className}
                    >
                      {PRIORITY_LABELS[order.prioridade].label}
                    </span>
                    <span className={STATUS_LABELS[order.status].className}>
                      {STATUS_LABELS[order.status].label}
                    </span>
                  </div>
                  <div className="ordem-card__actions">
                    <button className="icon-button">
                      <Printer size={16} />
                    </button>
                    <button className="icon-button">
                      <Pencil size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="ordem-card__body">
                <div className="ordem-card__dates">
                  <div className="ordem-card__date-item">
                    <div className="ordem-card__date-icon">
                      <Clock size={18} />
                    </div>
                    <div className="ordem-card__date-content">
                      <span className="ordem-card__date-label">Início</span>
                      <span className="ordem-card__date-value">
                        {order.dataInicio || "--"}
                      </span>
                    </div>
                  </div>
                  <div className="ordem-card__date-item">
                    <div className="ordem-card__date-icon">
                      <Calendar size={18} />
                    </div>
                    <div className="ordem-card__date-content">
                      <span className="ordem-card__date-label">Previsão</span>
                      <span className="ordem-card__date-value">
                        {order.dataPrevista || "--"}
                      </span>
                    </div>
                  </div>
                  <div className="ordem-card__date-item">
                    <div className="ordem-card__date-icon">
                      <CircleDot size={18} />
                    </div>
                    <div className="ordem-card__date-content">
                      <span className="ordem-card__date-label">Total</span>
                      <span className="ordem-card__date-value">
                        {totalPiecesByOrder(order)} peças
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ordem-card__grade-section">
                  <h4 className="ordem-card__grade-title">Grade de Produção</h4>
                  <div className="ordem-card__table">
                    <div className="ordem-card__table-header">
                      <span>Cor</span>
                      <span>PP</span>
                      <span>P</span>
                      <span>M</span>
                      <span>G</span>
                      <span>GG</span>
                      <span>Total</span>
                    </div>
                    {order.grade.map((row) => (
                      <div key={row.corId} className="ordem-card__table-row">
                        <span>{row.corNome}</span>
                        <span>{row.pp}</span>
                        <span>{row.p}</span>
                        <span>{row.m}</span>
                        <span>{row.g}</span>
                        <span>{row.gg}</span>
                        <span>{row.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="ordens-empty">
            <Search size={24} />
            Nenhuma ordem encontrada. Clique em "Nova Ordem" para começar.
          </div>
        )}
      </section>

      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrder}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
