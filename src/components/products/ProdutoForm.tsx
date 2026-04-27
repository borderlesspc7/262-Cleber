import React, { useEffect, useState } from "react";
import { Plus, X, ChevronDown } from "lucide-react";
import { stepService } from "../../services/stepService";
import type { ProductionStep } from "../../types/step";
import type {
  Produto,
  ProdutoForm,
  Categoria,
  Cor,
  Tamanho,
} from "../../types/product";
import { useAuth } from "../../hooks/useAuth";
import "./products.css";
import { currencyToNumber } from "../../utils/masks";

interface ProdutoFormProps {
  produtos: Produto[];
  categorias: Categoria[];
  cores: Cor[];
  tamanhos: Tamanho[];
  onAdd: (produto: ProdutoForm) => void;
  onEdit: (id: string, produto: ProdutoForm) => void;
  onDelete: (id: string) => void;
}

export const ProdutoFormComponent: React.FC<ProdutoFormProps> = ({
  produtos,
  categorias,
  cores,
  tamanhos,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCategorias, setShowCategorias] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [etapasDisponiveis, setEtapasDisponiveis] = useState<ProductionStep[]>(
    []
  );
  const [formData, setFormData] = useState<ProdutoForm>({
    refCodigo: "",
    descricao: "",
    categoriaId: "",
    coresIds: [],
    tamanhosIds: [],
    etapasProducao: [],
  });

  const { user } = useAuth();

  const updateFormField = <K extends keyof ProdutoForm>(
    field: K,
    value: ProdutoForm[K]
  ) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));
    setValidationMessage("");
  };

  const getProductValidationMessage = (): string | null => {
    if (!formData.refCodigo.trim()) {
      return "Informe o código do produto.";
    }

    if (!formData.descricao.trim()) {
      return "Informe a descrição do produto.";
    }

    if (!formData.categoriaId) {
      return "Selecione uma categoria para o produto.";
    }

    if (formData.coresIds.length === 0) {
      return "Selecione pelo menos uma cor para o produto.";
    }

    if (formData.tamanhosIds.length === 0) {
      return "Selecione pelo menos um tamanho para o produto.";
    }

    return null;
  };

  useEffect(() => {
    const loadEtapas = async () => {
      if (user) {
        try {
          const etapas = await stepService.getStepsByUser(user.uid);
          setEtapasDisponiveis(etapas);
        } catch (error) {
          console.error("Erro ao carregar etapas:", error);
        }
      }
    };
    loadEtapas();
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const productValidationMessage = getProductValidationMessage();
    if (productValidationMessage) {
      setValidationMessage(productValidationMessage);
      return;
    }

    if (editingId) {
      onEdit(editingId, formData);
    } else {
      onAdd(formData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      refCodigo: "",
      descricao: "",
      categoriaId: "",
      coresIds: [],
      tamanhosIds: [],
      etapasProducao: [],
    });
    setShowForm(false);
    setEditingId(null);
    setShowCategorias(false);
    setValidationMessage("");
  };

  const handleEdit = (produto: Produto) => {
    setFormData({
      refCodigo: produto.refCodigo,
      descricao: produto.descricao,
      categoriaId: produto.categoria.id,
      coresIds: produto.cores.map((c) => c.id),
      tamanhosIds: produto.tamanhos.map((t) => t.id),
      etapasProducao:
        produto.etapasProducao?.map((etapa) => ({
          etapaId: etapa.etapa.id,
          custo: etapa.custo,
          ordem: etapa.ordem,
        })) || [],
    });
    setEditingId(produto.id);
    setShowForm(true);
    setValidationMessage("");
  };

  const handleCategoriaChange = (categoriaId: string) => {
    updateFormField("categoriaId", categoriaId);
  };

  const handleCorToggle = (corId: string) => {
    const coresIds = formData.coresIds.includes(corId)
      ? formData.coresIds.filter((id) => id !== corId)
      : [...formData.coresIds, corId];
    updateFormField("coresIds", coresIds);
  };

  const handleTamanhoToggle = (tamanhoId: string) => {
    const tamanhosIds = formData.tamanhosIds.includes(tamanhoId)
      ? formData.tamanhosIds.filter((id) => id !== tamanhoId)
      : [...formData.tamanhosIds, tamanhoId];
    updateFormField("tamanhosIds", tamanhosIds);
  };

  const handleEtapaToggle = (etapaId: string) => {
    const etapasAtuais = formData.etapasProducao || [];
    const etapaExiste = etapasAtuais.some((e) => e.etapaId === etapaId);

    if (etapaExiste) {
      setFormData({
        ...formData,
        etapasProducao: etapasAtuais.filter((e) => e.etapaId !== etapaId),
      });
      setValidationMessage("");
    } else {
      const etapa = etapasDisponiveis.find((e) => e.id === etapaId);
      if (etapa) {
        setFormData({
          ...formData,
          etapasProducao: [
            ...etapasAtuais,
            {
              etapaId: etapa.id,
              custo: 0,
              ordem: etapa.order,
            },
          ],
        });
        setValidationMessage("");
      }
    }
  };

  const handleEtapaCustoChange = (etapaId: string, custo: number) => {
    const etapasAtuais = formData.etapasProducao || [];
    setFormData({
      ...formData,
      etapasProducao: etapasAtuais.map((etapa) =>
        etapa.etapaId === etapaId
          ? { ...etapa, custo: Math.max(0, custo) }
          : etapa
      ),
    });
  };

  const selectedCategoria = categorias.find(
    (c) => c.id === formData.categoriaId
  );

  return (
    <div className="produto-form">
      <div className="form-header">
        <h3>Produtos</h3>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="add-button"
        >
          <Plus size={16} />
          Adicionar Produto
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="refCodigo">REF/CÓD</label>
              <input
                type="text"
                id="refCodigo"
                value={formData.refCodigo}
                onChange={(e) =>
                  updateFormField("refCodigo", e.target.value)
                }
                placeholder="Ex: BLU-001, REG-002..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="descricao">Descrição</label>
              <input
                type="text"
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  updateFormField("descricao", e.target.value)
                }
                placeholder="Descrição do produto..."
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Categoria</label>
            <div className="dropdown">
              <button
                type="button"
                className="dropdown-button"
                onClick={() => setShowCategorias(!showCategorias)}
              >
                {selectedCategoria
                  ? selectedCategoria.nome
                  : "Selecione uma categoria"}
                <ChevronDown size={16} />
              </button>
              {showCategorias && (
                <div className="dropdown-menu">
                  {categorias.map((categoria) => (
                    <button
                      key={categoria.id}
                      type="button"
                      onClick={() => {
                        handleCategoriaChange(categoria.id);
                        setShowCategorias(false);
                      }}
                      className="dropdown-item"
                    >
                      {categoria.nome}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Cores</label>
            <div className="checkbox-grid">
              {cores.map((cor) => (
                <label key={cor.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.coresIds.includes(cor.id)}
                    onChange={() => handleCorToggle(cor.id)}
                  />
                  <div
                    className="color-preview"
                    style={{ backgroundColor: cor.codigo }}
                  ></div>
                  <span>{cor.nome}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Tamanhos</label>
            <div className="checkbox-grid">
              {tamanhos
                .sort((a, b) => a.ordem - b.ordem)
                .map((tamanho) => (
                  <label key={tamanho.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.tamanhosIds.includes(tamanho.id)}
                      onChange={() => handleTamanhoToggle(tamanho.id)}
                    />
                    <span>{tamanho.nome}</span>
                  </label>
                ))}
            </div>
          </div>

          <div className="form-group">
            <label>Etapas de Produção e Custos</label>
            <div className="etapas-container-simple">
              {etapasDisponiveis.length > 0 ? (
                <div className="etapas-grid">
                  {etapasDisponiveis.map((etapa) => {
                    const etapaSelecionada = formData.etapasProducao?.find(
                      (e) => e.etapaId === etapa.id
                    );
                    const estaSelecionada = !!etapaSelecionada;

                    return (
                      <div
                        key={etapa.id}
                        className={`etapa-card ${
                          estaSelecionada ? "active" : ""
                        }`}
                      >
                        <div className="etapa-card-header">
                          <label className="etapa-card-checkbox">
                            <input
                              type="checkbox"
                              checked={estaSelecionada}
                              onChange={() => handleEtapaToggle(etapa.id)}
                            />
                            <div className="etapa-card-info">
                              <span className="etapa-card-nome">
                                {etapa.name}
                              </span>
                              {etapa.description && (
                                <span className="etapa-card-desc">
                                  {etapa.description}
                                </span>
                              )}
                            </div>
                          </label>
                        </div>

                        {estaSelecionada && (
                          <div className="etapa-card-custo">
                            <label>Custo</label>
                            <div className="currency-input">
                              <span className="currency-symbol">R$</span>
                              <input
                                type="text"
                                value={
                                  etapaSelecionada?.custo
                                    ? etapaSelecionada.custo
                                        .toFixed(2)
                                        .replace(".", ",")
                                    : "0,00"
                                }
                                onChange={(e) => {
                                  const value = e.target.value
                                    .replace(/\D/g, "")
                                    .padStart(3, "0");
                                  const numValue = currencyToNumber(value);
                                  handleEtapaCustoChange(etapa.id, numValue);
                                }}
                                placeholder="0,00"
                                maxLength={15}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="etapas-empty">
                  <p>Nenhuma etapa cadastrada ainda.</p>
                  <span>Cadastre etapas na aba "Etapas" primeiro.</span>
                </div>
              )}
            </div>
          </div>

          {validationMessage && (
            <div className="form-error-message" role="alert">
              {validationMessage}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="save-button">
              {editingId ? "Atualizar" : "Salvar"}
            </button>
            <button type="button" onClick={resetForm} className="cancel-button">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="produtos-list">
        {produtos.map((produto) => (
          <div key={produto.id} className="produto-item">
            <div className="produto-info">
              <div className="produto-header">
                <h4>{produto.refCodigo}</h4>
                <span className="categoria">{produto.categoria.nome}</span>
              </div>
              <p className="descricao">{produto.descricao}</p>
              <div className="produto-details">
                <div className="cores">
                  <strong>Cores:</strong>{" "}
                  {produto.cores.map((c) => c.nome).join(", ")}
                </div>
                <div className="tamanhos">
                  <strong>Tamanhos:</strong>{" "}
                  {produto.tamanhos.map((t) => t.nome).join(", ")}
                </div>
              </div>
            </div>
            <div className="produto-actions">
              <button
                onClick={() => handleEdit(produto)}
                className="edit-button"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(produto.id)}
                className="delete-button"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
