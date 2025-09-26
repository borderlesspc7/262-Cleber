import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import type { EtapaProducao, EtapaProducaoForm } from "../../types/product";

interface EtapaProducaoFormProps {
  etapas: EtapaProducao[];
  onAdd: (etapa: EtapaProducaoForm) => void;
  onEdit: (id: string, etapa: EtapaProducaoForm) => void;
  onDelete: (id: string) => void;
}

export const EtapaProducaoFormComponent: React.FC<EtapaProducaoFormProps> = ({
  etapas,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EtapaProducaoForm>({
    nome: "",
    descricao: "",
    custo: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    if (editingId) {
      onEdit(editingId, formData);
    } else {
      onAdd(formData);
    }

    setFormData({ nome: "", descricao: "", custo: 0 });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (etapa: EtapaProducao) => {
    setFormData({
      nome: etapa.nome,
      descricao: etapa.descricao || "",
      custo: etapa.custo,
    });
    setEditingId(etapa.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({ nome: "", descricao: "", custo: 0 });
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="etapa-producao-form">
      <div className="form-header">
        <h3>Etapas de Produção</h3>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="add-button"
        >
          <Plus size={16} />
          Adicionar Etapa
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="nome">Nome da Etapa</label>
            <input
              type="text"
              id="nome"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              placeholder="Ex: Corte, Costura, Acabamento..."
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
              placeholder="Descrição da etapa de produção..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="custo">Custo Padrão (R$)</label>
            <input
              type="number"
              id="custo"
              value={formData.custo}
              onChange={(e) =>
                setFormData({ ...formData, custo: parseFloat(e.target.value) || 0 })
              }
              min="0"
              step="0.01"
              placeholder="0.00"
            />
            <small>Custo padrão para esta etapa (pode ser alterado por produto)</small>
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

      <div className="etapas-list">
        {etapas.map((etapa) => (
          <div key={etapa.id} className="etapa-item">
            <div className="etapa-info">
              <h4>{etapa.nome}</h4>
              {etapa.descricao && (
                <p className="descricao">{etapa.descricao}</p>
              )}
              <div className="custo">
                <strong>R$ {etapa.custo.toFixed(2)}</strong>
              </div>
            </div>
            <div className="etapa-actions">
              <button
                onClick={() => handleEdit(etapa)}
                className="edit-button"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(etapa.id)}
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
