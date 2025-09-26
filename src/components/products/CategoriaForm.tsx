import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import type { Categoria, CategoriaForm } from "../../types/product";

interface CategoriaFormProps {
  categorias: Categoria[];
  onAdd: (categoria: CategoriaForm) => void;
  onEdit: (id: string, categoria: CategoriaForm) => void;
  onDelete: (id: string) => void;
}

export const CategoriaFormComponent: React.FC<CategoriaFormProps> = ({
  categorias,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoriaForm>({
    nome: "",
    descricao: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    if (editingId) {
      onEdit(editingId, formData);
    } else {
      onAdd(formData);
    }

    setFormData({ nome: "", descricao: "" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (categoria: Categoria) => {
    setFormData({
      nome: categoria.nome,
      descricao: categoria.descricao || "",
    });
    setEditingId(categoria.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({ nome: "", descricao: "" });
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="categoria-form">
      <div className="form-header">
        <h3>Categorias de Produtos</h3>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="add-button"
        >
          <Plus size={16} />
          Adicionar Categoria
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="nome">Nome da Categoria</label>
            <input
              type="text"
              id="nome"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              placeholder="Ex: Blusa, Regata, Calça..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="descricao">Descrição (Opcional)</label>
            <textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              placeholder="Descrição da categoria..."
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="save-button">
              {editingId ? "Atualizar" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-button"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="categorias-list">
        {categorias.map((categoria) => (
          <div key={categoria.id} className="categoria-item">
            <div className="categoria-info">
              <h4>{categoria.nome}</h4>
              {categoria.descricao && (
                <p className="descricao">{categoria.descricao}</p>
              )}
            </div>
            <div className="categoria-actions">
              <button
                onClick={() => handleEdit(categoria)}
                className="edit-button"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(categoria.id)}
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
