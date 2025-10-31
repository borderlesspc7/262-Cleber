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

    try {
      setIsSubmitting(true);
      await orderService.createOrder(user.uid, payload);
      await loadData();
      setIsModalOpen(false);
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
                <div className="ordem-card__icon">
                  <ClipboardList size={26} />
                </div>
                <div>
                  <h3 className="ordem-card__code">{order.codigo}</h3>
                  <h3>{produto?.descricao ?? "Produto removido"}</h3>
                  <div className="ordem-card__meta">
                    <span>REF: {produto?.refCodigo ?? "--"}</span>
                    <span className="badge badge-neutral">
                      {produto?.categoria?.nome ?? "Categoria"}
                    </span>
                  </div>
                </div>

                <div className="ordem-card__status">
                  <span className={PRIORITY_LABELS[order.prioridade].className}>
                    {PRIORITY_LABELS[order.prioridade].label}
                  </span>
                  <span className={STATUS_LABELS[order.status].className}>
                    {STATUS_LABELS[order.status].label}
                  </span>
                </div>
                <div className="ordem-card__actions">
                  <button className="icon-button">
                    <Printer size={18} />
                  </button>
                  <button className="icon-button">
                    <Pencil size={18} />
                  </button>
                </div>
              </div>

              <div className="order-card__info">
                <div>
                  <Clock size={16} />
                  <span>
                    Inicio: <strong>{order.dataInicio || "--"}</strong>
                  </span>
                </div>
                <div>
                  <Calendar size={16} />
                  <span>
                    Previsão: <strong>{order.dataPrevista || "--"}</strong>
                  </span>
                </div>
                <div>
                  <CircleDot size={16} />
                  <span>
                    Total: <strong>{totalPiecesByOrder(order)}</strong>
                  </span>
                </div>
              </div>

              <div className="order-card__table">
                <div className="order-card__table-header">
                  <span>Cor</span>
                  <span>PP</span>
                  <span>P</span>
                  <span>M</span>
                  <span>G</span>
                  <span>GG</span>
                  <span>Total</span>
                </div>
                {order.grade.map((row) => (
                  <div key={row.corId} className="order-card__table-row">
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
