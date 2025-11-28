import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, Plus, Trash2, Search } from "lucide-react";
import { produtoService, corService } from "../../services/productService";
import { faccaoService } from "../../services/faccaoService";
import { useAuth } from "../../hooks/useAuth";
import type { Produto, Cor } from "../../types/product";
import type { Faccao } from "../../types/faccao";
import type { CreateProductionOrderPayload } from "../../types/order";
import "./OrderModal.css";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductionOrderPayload) => Promise<void>;
  isSubmitting: boolean;
}

interface GradeRowForm {
  corId: string;
  pp: number;
  p: number;
  m: number;
  g: number;
  gg: number;
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
      const [prodList, coresList, faccoesList] = await Promise.all([
        produtoService.getProdutos(user.uid),
        corService.getCores(user.uid),
        faccaoService.getFaccoes(),
      ]);
      setProdutos(prodList);
      setCores(coresList);
      setFaccoes(faccoesList.filter((f) => f.ativo));
      setSelectedColorId(coresList[0]?.id || "");
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

  const produtoSelecionado = useMemo(
    () => produtos.find((produto) => produto.id === form.produtoId),
    [produtos, form.produtoId]
  );

  const produtosFiltrados = useMemo(() => {
    if (!produtoSearch.trim()) return produtos;
    const searchLower = produtoSearch.toLowerCase();
    return produtos.filter(
      (produto) =>
        produto.refCodigo.toLowerCase().includes(searchLower) ||
        produto.descricao.toLowerCase().includes(searchLower)
    );
  }, [produtos, produtoSearch]);

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

    setGradeRows((rows) => [
      ...rows,
      { corId: selectedColorId, pp: 0, p: 0, m: 0, g: 0, gg: 0 },
    ]);
  };

  const handleRemoveGradeRow = (corId: string) => {
    setGradeRows((rows) => rows.filter((row) => row.corId !== corId));
  };

  const handleGradeChange = (
    corId: string,
    field: keyof GradeRowForm,
    value: number
  ) => {
    setGradeRows((rows) =>
      rows.map((row) =>
        row.corId === corId
          ? {
              ...row,
              [field]: Number.isNaN(value) ? 0 : Math.max(0, Math.floor(value)),
            }
          : row
      )
    );
  };

  const computeRowTotal = (row: GradeRowForm) =>
    row.pp + row.p + row.m + row.g + row.gg;

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
          pp: row.pp,
          p: row.p,
          m: row.m,
          g: row.g,
          gg: row.gg,
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
            <h2>Nova Ordem de Produção</h2>
            <p>Crie uma nova ordem com todas as especificações.</p>
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
              <div className="order-modal__grade-header-row">
                <span>Cor</span>
                <span>PP</span>
                <span>P</span>
                <span>M</span>
                <span>G</span>
                <span>GG</span>
                <span>Total</span>
                <span />
              </div>

              {gradeRows.map((row) => {
                const corInfo = cores.find((cor) => cor.id === row.corId);
                return (
                  <div key={row.corId} className="order-modal__grade-row">
                    <span>{corInfo?.nome ?? "Cor removida"}</span>
                    {(["pp", "p", "m", "g", "gg"] as const).map((field) => (
                      <input
                        key={field}
                        type="number"
                        min={0}
                        value={row[field]}
                        onChange={(event) =>
                          handleGradeChange(
                            row.corId,
                            field,
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
              {isSubmitting ? "Criando..." : "Criar Ordem"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
