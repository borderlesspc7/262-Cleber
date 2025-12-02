import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, Plus, Trash2, Search } from "lucide-react";
import {
  produtoService,
  corService,
  tamanhoService,
} from "../../services/productService";
import { faccaoService } from "../../services/faccaoService";
import { useAuth } from "../../hooks/useAuth";
import type { Produto, Cor } from "../../types/product";
import type { Faccao } from "../../types/faccao";
import type {
  CreateProductionOrderPayload,
  ProductionOrder,
} from "../../types/order";
import "./OrderModal.css";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductionOrderPayload) => Promise<void>;
  isSubmitting: boolean;
  orderToEdit?: ProductionOrder;
}

interface GradeRowForm {
  corId: string;
  quantidades: Record<string, number>;
}

// Interface para o formato antigo da grade (compatibilidade)
interface OldGradeRow {
  pp?: number;
  p?: number;
  m?: number;
  g?: number;
  gg?: number;
}

const PRIORITY_OPTIONS = [
  { label: "Alta", value: "alta" },
  { label: "Média", value: "media" },
  { label: "Baixa", value: "baixa" },
];

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  orderToEdit,
}) => {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [cores, setCores] = useState<Cor[]>([]);
  const [faccoes, setFaccoes] = useState<Faccao[]>([]);
  const [selectedColorId, setSelectedColorId] = useState("");
  const [form, setForm] = useState({
    produtoId: "",
    prioridade: "",
    dataInicio: "",
    dataPrevista: "",
    responsavelId: "",
  });
  const [gradeRows, setGradeRows] = useState<GradeRowForm[]>([]);
  const [produtoSearch, setProdutoSearch] = useState("");
  const [showProdutoDropdown, setShowProdutoDropdown] = useState(false);
  const produtoSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !isOpen) return;

    (async () => {
      const [prodList, coresList, tamanhosList, faccoesList] =
        await Promise.all([
          produtoService.getProdutos(user.uid),
          corService.getCores(user.uid),
          tamanhoService.getTamanhos(user.uid),
          faccaoService.getFaccoes(),
        ]);
      setCores(coresList);
      setFaccoes(faccoesList.filter((f) => f.ativo));
      setSelectedColorId(coresList[0]?.id || "");

      const produtosCompletos = prodList.map((produto) => {
        const tamanhosProduto = tamanhosList.filter((t) =>
          produto.tamanhosIds?.includes(t.id || "")
        );

        return {
          ...produto,
          tamanhos: tamanhosProduto.length > 0 ? tamanhosProduto : [],
        };
      });

      setProdutos(produtosCompletos);
    })();
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setForm({
        produtoId: "",
        prioridade: "",
        dataInicio: "",
        dataPrevista: "",
        responsavelId: "",
      });
      setGradeRows([]);
      setProdutoSearch("");
      setShowProdutoDropdown(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && orderToEdit) {
      setForm({
        produtoId: orderToEdit.produtoId,
        prioridade: orderToEdit.prioridade,
        dataInicio: orderToEdit.dataInicio,
        dataPrevista: orderToEdit.dataPrevista,
        responsavelId: orderToEdit.responsavelId || "",
      });

      const produto = produtos.find((p) => p.id === orderToEdit.produtoId);
      if (produto) {
        setProdutoSearch(produto.refCodigo);
      }

      const gradeRows: GradeRowForm[] = orderToEdit.grade.map((row) => {
        if (row.quantidades) {
          return {
            corId: row.corId,
            quantidades: row.quantidades,
          };
        } else {
          const produto = produtos.find((p) => p.id === orderToEdit.produtoId);
          if (produto && produto.tamanhos) {
            const quantidades: Record<string, number> = {};
            const tamanhosOrdenados = [...produto.tamanhos].sort(
              (a, b) => a.ordem - b.ordem
            );
            const camposAntigos = ["pp", "p", "m", "g", "gg"] as const;

            tamanhosOrdenados.forEach((tamanho, index) => {
              if (index < camposAntigos.length) {
                const campo = camposAntigos[index];
                const oldRow = row as OldGradeRow;
                quantidades[tamanho.id] = oldRow[campo] || 0;
              }
            });

            return {
              corId: row.corId,
              quantidades,
            };
          }

          return {
            corId: row.corId,
            quantidades: {},
          };
        }
      });

      setGradeRows(gradeRows);
    }
  }, [isOpen, orderToEdit, produtos]);

  const produtoSelecionado = useMemo(
    () => produtos.find((produto) => produto.id === form.produtoId),
    [produtos, form.produtoId]
  );

  const tamanhosProdutoSelecionado = useMemo(() => {
    if (!produtoSelecionado || !produtoSelecionado.tamanhosIds) {
      return [];
    }

    return [...produtoSelecionado.tamanhos].sort((a, b) => a.ordem - b.ordem);
  }, [produtoSelecionado]);

  const produtosFiltrados = useMemo(() => {
    if (!produtoSearch.trim()) return produtos;
    const searchLower = produtoSearch.toLowerCase();
    return produtos.filter(
      (produto) =>
        produto.refCodigo.toLowerCase().includes(searchLower) ||
        produto.descricao.toLowerCase().includes(searchLower)
    );
  }, [produtos, produtoSearch]);

  const gradeGridColumns = useMemo(() => {
    const numTamanhos = tamanhosProdutoSelecionado.length;
    return `1.5 fr repeat(${numTamanhos}, 0.8fr) 1fr 0.4fr`;
  }, [tamanhosProdutoSelecionado]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        produtoSearchRef.current &&
        !produtoSearchRef.current.contains(event.target as Node)
      ) {
        setShowProdutoDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (produtoSelecionado) {
      setProdutoSearch(produtoSelecionado.refCodigo);
    } else {
      setProdutoSearch("");
    }
  }, [produtoSelecionado]);

  const handleAddGradeRow = () => {
    if (!selectedColorId) return;
    if (gradeRows.some((row) => row.corId === selectedColorId)) return;

    const quantidadesIniciais: Record<string, number> = {};
    tamanhosProdutoSelecionado.forEach((tamanho) => {
      quantidadesIniciais[tamanho.id] = 0;
    });

    setGradeRows((rows) => [
      ...rows,
      { corId: selectedColorId, quantidades: quantidadesIniciais },
    ]);
  };

  const handleRemoveGradeRow = (corId: string) => {
    setGradeRows((rows) => rows.filter((row) => row.corId !== corId));
  };

  const handleGradeChange = (
    corId: string,
    tamanhoId: string,
    value: number
  ) => {
    setGradeRows((rows) =>
      rows.map((row) =>
        row.corId === corId
          ? {
              ...row,
              quantidades: {
                ...row.quantidades,
                [tamanhoId]: Number.isNaN(value)
                  ? 0
                  : Math.max(0, Math.floor(value)),
              },
            }
          : row
      )
    );
  };

  const computeRowTotal = (row: GradeRowForm) => {
    return Object.values(row.quantidades).reduce((acc, qty) => acc + qty, 0);
  };

  const totalPieces = gradeRows.reduce(
    (acc, row) => acc + computeRowTotal(row),
    0
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !produtoSelecionado ||
      !form.prioridade ||
      !form.dataInicio ||
      !form.dataPrevista ||
      gradeRows.length === 0
    ) {
      return;
    }

    const payload: CreateProductionOrderPayload = {
      produtoId: produtoSelecionado.id,
      prioridade: form.prioridade as CreateProductionOrderPayload["prioridade"],
      dataInicio: form.dataInicio,
      dataPrevista: form.dataPrevista,
      responsavelId: form.responsavelId || undefined,
      grade: gradeRows.map((row) => {
        const corInfo = cores.find((cor) => cor.id === row.corId);
        return {
          corId: row.corId,
          corNome: corInfo?.nome ?? "Cor removida",
          quantidades: row.quantidades,
        };
      }),
    };
    await onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="order-modal-overlay">
      <div className="order-modal">
        <header className="order-modal__header">
          <div>
            <h2>
              {orderToEdit
                ? "Editar Ordem de Produção"
                : "Nova Ordem de Produção"}
            </h2>
            <p>
              {orderToEdit
                ? "Edite os dados da ordem de produção."
                : "Crie uma nova ordem com todas as especificações."}
            </p>
          </div>
          <button className="order-modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <form className="order-modal__form" onSubmit={handleSubmit}>
          <div className="order-modal__grid">
            <label className="order-modal__field">
              <span>Produto*</span>
              <div
                ref={produtoSearchRef}
                className="order-modal__product-search"
              >
                <div className="order-modal__product-input-wrapper">
                  <Search size={18} className="order-modal__search-icon" />
                  <input
                    type="text"
                    value={produtoSearch}
                    onChange={(e) => {
                      setProdutoSearch(e.target.value);
                      setShowProdutoDropdown(true);
                      if (!e.target.value) {
                        setForm((state) => ({ ...state, produtoId: "" }));
                      }
                    }}
                    onFocus={() => setShowProdutoDropdown(true)}
                    placeholder="Pesquisar por REF..."
                  />
                </div>
                {showProdutoDropdown &&
                  produtoSearch.trim() &&
                  !produtoSelecionado && (
                    <div className="order-modal__product-dropdown">
                      {produtosFiltrados.length > 0 ? (
                        produtosFiltrados.map((produto) => (
                          <button
                            key={produto.id}
                            type="button"
                            className="order-modal__product-option"
                            onClick={() => {
                              setForm((state) => ({
                                ...state,
                                produtoId: produto.id,
                              }));
                              setProdutoSearch(produto.refCodigo);
                              setShowProdutoDropdown(false);
                            }}
                          >
                            <div className="order-modal__product-option-ref">
                              {produto.refCodigo}
                            </div>
                            <div className="order-modal__product-option-desc">
                              {produto.descricao}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="order-modal__product-empty">
                          Nenhum produto encontrado
                        </div>
                      )}
                    </div>
                  )}
                {produtoSelecionado && (
                  <div className="order-modal__product-selected">
                    <span className="order-modal__product-selected-label">
                      Descrição:
                    </span>
                    <span className="order-modal__product-selected-value">
                      {produtoSelecionado.descricao}
                    </span>
                  </div>
                )}
              </div>
            </label>

            <label className="order-modal__field">
              <span>Prioridade*</span>
              <select
                value={form.prioridade}
                onChange={(event) =>
                  setForm((state) => ({
                    ...state,
                    prioridade: event.target.value,
                  }))
                }
                required
              >
                <option value="">Selecione uma prioridade</option>
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="order-modal__field">
              <span>Responsável (Facção)</span>
              <select
                value={form.responsavelId}
                onChange={(event) =>
                  setForm((state) => ({
                    ...state,
                    responsavelId: event.target.value,
                  }))
                }
              >
                <option value="">Nenhum responsável</option>
                {faccoes.map((faccao) => (
                  <option key={faccao.id} value={faccao.id}>
                    {faccao.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="order-modal__field">
              <span>Data de Início</span>
              <input
                type="date"
                value={form.dataInicio}
                onChange={(event) =>
                  setForm((state) => ({
                    ...state,
                    dataInicio: event.target.value,
                  }))
                }
              />
            </label>

            <label className="order-modal__field">
              <span>Data Prevista</span>
              <input
                type="date"
                value={form.dataPrevista}
                onChange={(event) =>
                  setForm((state) => ({
                    ...state,
                    dataPrevista: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <section className="order-modal__grade">
            <div className="order-modal__grade-header">
              <h3>Grade de Produção</h3>
              <div className="order-modal__grade-actions">
                <select
                  value={selectedColorId}
                  onChange={(event) => setSelectedColorId(event.target.value)}
                >
                  {cores.map((cor) => (
                    <option key={cor.id} value={cor.id}>
                      {cor.nome}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="order-modal__grade-add"
                  onClick={handleAddGradeRow}
                  disabled={!selectedColorId}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="order-modal__grade-table">
              <div
                className="order-modal__grade-header-row"
                style={{ gridTemplateColumns: gradeGridColumns }}
              >
                <span>Cor</span>
                {tamanhosProdutoSelecionado.map((tamanho) => (
                  <span key={tamanho.id}>{tamanho.nome}</span>
                ))}
                <span>Total</span>
                <span />
              </div>

              {gradeRows.map((row) => {
                const corInfo = cores.find((cor) => cor.id === row.corId);
                return (
                  <div
                    key={row.corId}
                    className="order-modal__grade-row"
                    style={{ gridTemplateColumns: gradeGridColumns }}
                  >
                    <span>{corInfo?.nome ?? "Cor removida"}</span>
                    {tamanhosProdutoSelecionado.map((tamanho) => (
                      <input
                        key={tamanho.id}
                        type="number"
                        min={0}
                        value={row.quantidades[tamanho.id] || 0}
                        onChange={(event) =>
                          handleGradeChange(
                            row.corId,
                            tamanho.id,
                            Number(event.target.value)
                          )
                        }
                      />
                    ))}

                    <span className="order-modal__grade-total">
                      {computeRowTotal(row)}
                    </span>
                    <button
                      type="button"
                      className="order-modal__grade-remove"
                      onClick={() => handleRemoveGradeRow(row.corId)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}

              {gradeRows.length === 0 && (
                <div className="order-modal__grade-empty">
                  Nenhuma cor adicionado ainda
                </div>
              )}
            </div>

            <footer className="order-modal__grade-footer">
              <span>Total de peças:</span>
              <strong>{totalPieces}</strong>
            </footer>
          </section>

          <footer className="order-modal__footer">
            <button
              type="button"
              disabled={isSubmitting}
              className="order-modal__btn outline"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="order-modal__btn primary"
            >
              {isSubmitting
                ? orderToEdit
                  ? "Atualizando..."
                  : "Criando..."
                : orderToEdit
                ? "Atualizar Ordem"
                : "Criar Ordem"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
