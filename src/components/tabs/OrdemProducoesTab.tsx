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
  Check,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { orderService } from "../../services/orderService";
import { produtoService, tamanhoService } from "../../services/productService";
import { productionProgressService } from "../../services/productionProgressService";
import { financeiroService } from "../../services/financeiroService";
import type { ProductionOrder } from "../../types/order";
import type { Produto, Tamanho } from "../../types/product";
import { OrderModal } from "../orders/OrderModal";
import toast from "react-hot-toast";
import { DeleteConfirmModal } from "../../components/ui/DeleteConfirmModal/DeleteConfirmModal";
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
  const [todosTamanhos, setTodosTamanhos] = useState<Tamanho[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<ProductionOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (id: string) => {
    setOrderToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;

    try {
      try {
        const progress = await productionProgressService.getProgressByOrderId(
          orderToDelete
        );
        if (progress) {
          await productionProgressService.deleteProgress(progress.id);
        }
      } catch (error) {
        console.error("Erro ao deletar progresso:", error);
      }

      try {
        await financeiroService.deleteLancamentosByOrdem(orderToDelete);
      } catch (error) {
        console.error("Erro ao deletar lançamentos financeiros:", error);
      }

      await orderService.deleteOrder(orderToDelete);
      await loadData();
      setIsDeleteModalOpen(false);
      setOrderToDelete(null);
      toast.success("Ordem de produção excluída com sucesso!", {
        icon: <Check size={20} />,
      });
    } catch (error) {
      console.error("Erro ao deletar ordem de produção:", error);
      toast.error("Erro ao deletar ordem de produção. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [ordersData, produtosData, tamanhosData] = await Promise.all([
        orderService.getOrders(user.uid),
        produtoService.getProdutos(user.uid),
        tamanhoService.getTamanhos(user.uid),
      ]);

      // Reconstruir produtos com tamanhos completos
      const produtosCompletos = produtosData.map((produto) => {
        const tamanhosProduto = tamanhosData.filter((t) =>
          produto.tamanhosIds?.includes(t.id)
        );

        return {
          ...produto,
          tamanhos:
            tamanhosProduto.length > 0 ? tamanhosProduto : produto.tamanhos || [],
        };
      });

      setOrders(ordersData);
      setProdutos(produtosCompletos);
      setTodosTamanhos(tamanhosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
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

  const handleSubmit = async (
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

      if (orderToEdit) {
        await orderService.updateOrder(
          orderToEdit.id,
          payload,
          {
            descricao: produto.descricao,
            refCodigo: produto.refCodigo,
          },
          responsavelNome
        );
        toast.success("Ordem de produção atualizada com sucesso!", {
          icon: <Check size={20} />,
        });
      } else {
        await orderService.createOrder(
          user.uid,
          payload,
          {
            descricao: produto.descricao,
            refCodigo: produto.refCodigo,
          },
          responsavelNome
        );
        toast.success("Ordem de produção criada com sucesso!", {
          icon: <Check size={20} />,
        });
      }
      await loadData();
      setIsModalOpen(false);
      setOrderToEdit(null);
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

  const handleEdit = (order: ProductionOrder) => {
    setOrderToEdit(order);
    setIsModalOpen(true);
  };

  const handleNewOrder = () => {
    setOrderToEdit(null);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="ordens-container">
        <header className="ordens-header">
          <div>
            <h2>Ordens de Produção</h2>
            <p>Carregando dados...</p>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="ordens-container">
      <header className="ordens-header">
        <div>
          <h2>Ordens de Produção</h2>
          <p>Programe e gerencie suas ordens de produção</p>
        </div>
        <button className="ordens-new-btn" onClick={handleNewOrder}>
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

          // Primeiro, tentar usar os tamanhos do produto
          let tamanhosOrdenados = produto?.tamanhos
            ? [...produto.tamanhos].sort((a, b) => a.ordem - b.ordem)
            : [];

          // Se não houver tamanhos no produto, mas a grade tem dados,
          // extrair as chaves da grade e buscar os tamanhos correspondentes
          if (tamanhosOrdenados.length === 0 && order.grade.length > 0) {
            const primeiraLinha = order.grade[0];
            if (primeiraLinha.quantidades) {
              const chavesGrade = Object.keys(primeiraLinha.quantidades);
              // Buscar os tamanhos que estão na grade
              tamanhosOrdenados = todosTamanhos
                .filter((t) => chavesGrade.includes(t.id))
                .sort((a, b) => a.ordem - b.ordem);
            }
          }

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
                    <button
                      className="icon-button"
                      onClick={() => handleEdit(order)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button icon-button-danger"
                      onClick={() => handleDeleteClick(order.id)}
                      title="Excluir ordem"
                    >
                      <Trash2 size={16} />
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
                  <div
                    className="ordem-card__table"
                    style={
                      {
                        "--tamanhos-count": tamanhosOrdenados.length,
                      } as React.CSSProperties
                    }
                  >
                    <div className="ordem-card__table-header">
                      <span>Cor</span>
                      {tamanhosOrdenados.map((tamanho) => (
                        <span key={tamanho.id}>{tamanho.nome}</span>
                      ))}
                      <span>Total</span>
                    </div>
                    {order.grade.map((row) => {
                      // Garantir que quantidades existe e é um objeto
                      const quantidades = row.quantidades || {};

                      return (
                        <div key={row.corId} className="ordem-card__table-row">
                          <span>{row.corNome}</span>
                          {tamanhosOrdenados.map((tamanho) => (
                            <span key={tamanho.id}>
                              {quantidades[tamanho.id] || 0}
                            </span>
                          ))}
                          <span>{row.total}</span>
                        </div>
                      );
                    })}
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
        onClose={() => {
          setIsModalOpen(false);
          setOrderToEdit(null);
        }}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        orderToEdit={orderToEdit ?? undefined}
      />

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
