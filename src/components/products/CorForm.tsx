import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import type { Cor, CorForm } from "../../types/product";

interface CorFormProps {
  cores: Cor[];
  onAdd: (cor: CorForm) => void;
  onEdit: (id: string, cor: CorForm) => void;
  onDelete: (id: string) => void;
}

export const CorFormComponent: React.FC<CorFormProps> = ({
  cores,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CorForm>({
    nome: "",
    codigo: "#000000",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    if (editingId) {
      onEdit(editingId, formData);
    } else {
      onAdd(formData);
    }

    setFormData({ nome: "", codigo: "#000000" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (cor: Cor) => {
    setFormData({
      nome: cor.nome,
      codigo: cor.codigo,
    });
    setEditingId(cor.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({ nome: "", codigo: "#000000" });
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="cor-form">
      <div className="form-header">
        <h3>Cores de Produtos</h3>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="add-button"
        >
          <Plus size={16} />
          Adicionar Cor
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="nome">Nome da Cor</label>
            <input
              type="text"
              id="nome"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              placeholder="Ex: Preto, Marinho, Branco..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="codigo">Código da Cor</label>
            <div className="color-input-group">
              <input
                type="color"
                id="codigo"
                value={formData.codigo}
                onChange={(e) =>
                  setFormData({ ...formData, codigo: e.target.value })
                }
                className="color-picker"
              />
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) =>
                  setFormData({ ...formData, codigo: e.target.value })
                }
                placeholder="#000000"
                className="color-code"
              />
            </div>
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

      <div className="cores-list">
        {cores.map((cor) => (
          <div key={cor.id} className="cor-item">
            <div className="cor-info">
              <div
                className="cor-preview"
                style={{ backgroundColor: cor.codigo }}
              ></div>
              <div className="cor-details">
                <h4>{cor.nome}</h4>
                <p className="codigo">{cor.codigo}</p>
              </div>
            </div>
            <div className="cor-actions">
              <button
                onClick={() => handleEdit(cor)}
                className="edit-button"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(cor.id)}
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
