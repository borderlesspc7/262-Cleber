import React, { useEffect, useState, useRef } from "react";
import { Plus, X, ChevronDown, ImageIcon } from "lucide-react";
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
  onAdd: (produto: ProdutoForm, imagemArquivo?: File | null) => void;
  onEdit: (
    id: string,
    produto: ProdutoForm,
    imagemArquivo?: File | null,
    removerImagem?: boolean
  ) => void;
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
    imagemUrl: "",
    descricao: "",
    categoriaId: "",
    coresIds: [],
    tamanhosIds: [],
    etapasProducao: [],
  });

  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [removerImagemMarcado, setRemoverImagemMarcado] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (!arquivoImagem) {
      setPreviewObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(arquivoImagem);
    setPreviewObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [arquivoImagem]);

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
      onEdit(editingId, formData, arquivoImagem, removerImagemMarcado);
    } else {
      onAdd(formData, arquivoImagem);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      refCodigo: "",
      imagemUrl: "",
      descricao: "",
      categoriaId: "",
      coresIds: [],
      tamanhosIds: [],
      etapasProducao: [],
    });
    setArquivoImagem(null);
    setRemoverImagemMarcado(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setShowForm(false);
    setEditingId(null);
    setShowCategorias(false);
    setValidationMessage("");
  };

  const handleEdit = (produto: Produto) => {
    setFormData({
      refCodigo: produto.refCodigo,
      imagemUrl: produto.imagemUrl || "",
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
    setArquivoImagem(null);
    setRemoverImagemMarcado(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setEditingId(produto.id);
    setShowForm(true);
    setValidationMessage("");
  };

  const handleImagemSelecionada = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setValidationMessage("Selecione um arquivo de imagem (JPG, PNG, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setValidationMessage("A imagem deve ter no máximo 5 MB.");
      return;
    }
    setArquivoImagem(file);
    setRemoverImagemMarcado(false);
    setValidationMessage("");
  };

  const handleRemoverImagem = () => {
    setArquivoImagem(null);
    setRemoverImagemMarcado(!!editingId);
    updateFormField("imagemUrl", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  const imagemPreviewSrc =
    previewObjectUrl ||
    (!removerImagemMarcado && formData.imagemUrl?.trim()
      ? formData.imagemUrl.trim()
      : null);

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

          <div className="form-group produto-imagem-grupo">
            <label htmlFor="produto-imagem">Imagem da peça (opcional)</label>
            <p className="produto-imagem-hint">
              Foto de referência para conferência. JPG ou PNG, até 5 MB.
            </p>
            <div className="produto-imagem-toolbar">
              <label className="produto-imagem-file-label">
                <ImageIcon size={18} aria-hidden />
                Escolher imagem
                <input
                  ref={fileInputRef}
                  id="produto-imagem"
                  type="file"
                  accept="image/*"
                  className="produto-imagem-input-native"
                  onChange={handleImagemSelecionada}
                />
              </label>
              {imagemPreviewSrc && (
                <button
                  type="button"
                  className="produto-imagem-remove-text"
                  onClick={handleRemoverImagem}
                >
                  Remover imagem
                </button>
              )}
            </div>
            {imagemPreviewSrc && (
              <div className="produto-imagem-preview-wrap">
                <img
                  src={imagemPreviewSrc}
                  alt="Pré-visualização da peça"
                  className="produto-imagem-preview"
                />
              </div>
            )}
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
            {produto.imagemUrl?.trim() && (
              <div className="produto-thumb-wrap">
                <img
                  src={produto.imagemUrl.trim()}
                  alt=""
                  className="produto-thumb"
                />
              </div>
            )}
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
