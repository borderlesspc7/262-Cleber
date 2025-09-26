import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import type { Tamanho, TamanhoForm } from "../../types/product";

interface TamanhoFormProps {
  tamanhos: Tamanho[];
  onAdd: (tamanho: TamanhoForm) => void;
  onEdit: (id: string, tamanho: TamanhoForm) => void;
  onDelete: (id: string) => void;
}

export const TamanhoFormComponent: React.FC<TamanhoFormProps> = ({
  tamanhos,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TamanhoForm>({
    nome: "",
    ordem: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    if (editingId) {
      onEdit(editingId, formData);
    } else {
      onAdd(formData);
    }

    setFormData({ nome: "", ordem: 1 });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (tamanho: Tamanho) => {
    setFormData({
      nome: tamanho.nome,
      ordem: tamanho.ordem,
    });
    setEditingId(tamanho.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({ nome: "", ordem: 1 });
    setShowForm(false);
    setEditingId(null);
  };

  // Ordenar tamanhos por ordem
  const tamanhosOrdenados = [...tamanhos].sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="tamanho-form">
      <div className="form-header">
        <h3>Tamanhos de Produtos</h3>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="add-button"
        >
          <Plus size={16} />
          Adicionar Tamanho
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="nome">Nome do Tamanho</label>
            <input
              type="text"
              id="nome"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              placeholder="Ex: P, M, G, GG, XG..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="ordem">Ordem de Exibição</label>
            <input
              type="number"
              id="ordem"
              value={formData.ordem}
              onChange={(e) =>
                setFormData({ ...formData, ordem: parseInt(e.target.value) || 1 })
              }
              min="1"
              placeholder="1"
            />
            <small>Menor número aparece primeiro</small>
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

      <div className="tamanhos-list">
        {tamanhosOrdenados.map((tamanho) => (
          <div key={tamanho.id} className="tamanho-item">
            <div className="tamanho-info">
              <div className="tamanho-ordem">{tamanho.ordem}</div>
              <h4>{tamanho.nome}</h4>
            </div>
            <div className="tamanho-actions">
              <button
                onClick={() => handleEdit(tamanho)}
                className="edit-button"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(tamanho.id)}
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
