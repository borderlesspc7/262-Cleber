import React, { useState } from "react";
import { Plus, X, ChevronDown } from "lucide-react";
import type {
  Produto,
  ProdutoForm,
  Categoria,
  Cor,
  Tamanho,
} from "../../types/product";
import "./products.css";

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
  const [formData, setFormData] = useState<ProdutoForm>({
    refCodigo: "",
    descricao: "",
    categoriaId: "",
    coresIds: [],
    tamanhosIds: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.refCodigo.trim() ||
      !formData.descricao.trim() ||
      !formData.categoriaId
    )
      return;

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
    });
    setShowForm(false);
    setEditingId(null);
    setShowCategorias(false);
  };

  const handleEdit = (produto: Produto) => {
    setFormData({
      refCodigo: produto.refCodigo,
      descricao: produto.descricao,
      categoriaId: produto.categoria.id,
      coresIds: produto.cores.map((c) => c.id),
      tamanhosIds: produto.tamanhos.map((t) => t.id),
    });
    setEditingId(produto.id);
    setShowForm(true);
  };

  const handleCategoriaChange = (categoriaId: string) => {
    setFormData({ ...formData, categoriaId });
  };

  const handleCorToggle = (corId: string) => {
    const coresIds = formData.coresIds.includes(corId)
      ? formData.coresIds.filter((id) => id !== corId)
      : [...formData.coresIds, corId];
    setFormData({ ...formData, coresIds });
  };

  const handleTamanhoToggle = (tamanhoId: string) => {
    const tamanhosIds = formData.tamanhosIds.includes(tamanhoId)
      ? formData.tamanhosIds.filter((id) => id !== tamanhoId)
      : [...formData.tamanhosIds, tamanhoId];
    setFormData({ ...formData, tamanhosIds });
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
                  setFormData({ ...formData, refCodigo: e.target.value })
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
                  setFormData({ ...formData, descricao: e.target.value })
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
