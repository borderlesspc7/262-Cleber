import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Faccao } from "../../types/faccao";
import { stepService } from "../../services/stepService";
import type { ProductionStep } from "../../types/step";
import "./FaccaoModal.css";
import { useAuth } from "../../hooks/useAuth";

interface FaccaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (faccao: Omit<Faccao, "id">) => Promise<void>;
  faccaoToEdit?: Faccao | null;
}

export const FaccaoModal: React.FC<FaccaoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  faccaoToEdit,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Omit<Faccao, "id">>({
    nome: "",
    servicoPrestado: "",
    enderecoCompleto: "",
    telefone: "",
    email: "",
    ativo: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [etapas, setEtapas] = useState<ProductionStep[]>([]);

  useEffect(() => {
    const loadEtapas = async () => {
      try {
        const etapasData = await stepService.getStepsByUser(user!.uid);
        setEtapas(etapasData);
      } catch (error) {
        console.error("Erro ao buscar etapas:", error);
      }
      if (isOpen) {
        loadEtapas();
      }
    };
    loadEtapas();
  }, [isOpen, user]);

  useEffect(() => {
    if (faccaoToEdit) {
      setFormData({
        nome: faccaoToEdit.nome,
        servicoPrestado: faccaoToEdit.servicoPrestado,
        enderecoCompleto: faccaoToEdit.enderecoCompleto,
        telefone: faccaoToEdit.telefone,
        email: faccaoToEdit.email,
        ativo: faccaoToEdit.ativo,
      });
    } else {
      setFormData({
        nome: "",
        servicoPrestado: "",
        enderecoCompleto: "",
        telefone: "",
        email: "",
        ativo: true,
      });
    }
    setError(null);
  }, [faccaoToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.nome.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    try {
      setLoading(true);
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error("Erro ao salvar facção:", err);
      setError("Erro ao salvar facção. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="faccao-modal-overlay" onClick={onClose}>
      <div className="faccao-modal" onClick={(e) => e.stopPropagation()}>
        <div className="faccao-modal-header">
          <div className="faccao-modal-title-section">
            <h2 className="faccao-modal-title">
              {faccaoToEdit ? "Editar Facção" : "Cadastrar Nova Facção"}
            </h2>
            <p className="faccao-modal-subtitle">
              {faccaoToEdit
                ? "Atualize as informações do parceiro de produção"
                : "Adicione um novo parceiro de produção ao sistema"}
            </p>
          </div>
          <button
            className="faccao-modal-close"
            onClick={onClose}
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="faccao-modal-form">
          <div className="faccao-modal-row">
            <div className="faccao-modal-field">
              <label htmlFor="nome" className="faccao-modal-label">
                Nome *
              </label>
              <input
                type="text"
                id="nome"
                className="faccao-modal-input"
                placeholder="Nome da facção"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                required
              />
            </div>

            <div className="faccao-modal-field">
              <label htmlFor="servico" className="faccao-modal-label">
                Serviço Prestado *
              </label>
              <select
                id="servico"
                className="faccao-modal-select"
                value={formData.servicoPrestado}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    servicoPrestado: e.target.value as string,
                  })
                }
                required
              >
                {etapas.length === 0 ? (
                  <option value="">Nenhuma etapa encontrada</option>
                ) : (
                  etapas.map((etapa) => (
                    <option key={etapa.id} value={etapa.name}>
                      {etapa.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="faccao-modal-field">
            <label htmlFor="endereco" className="faccao-modal-label">
              Endereço Completo *
            </label>
            <textarea
              id="endereco"
              className="faccao-modal-textarea"
              placeholder="Rua, número, bairro, cidade, estado, CEP"
              value={formData.enderecoCompleto}
              onChange={(e) =>
                setFormData({ ...formData, enderecoCompleto: e.target.value })
              }
              rows={3}
              required
            />
          </div>

          <div className="faccao-modal-row">
            <div className="faccao-modal-field">
              <label htmlFor="telefone" className="faccao-modal-label">
                Telefone
              </label>
              <input
                type="tel"
                id="telefone"
                className="faccao-modal-input"
                placeholder="(11) 99999-9999"
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
              />
            </div>

            <div className="faccao-modal-field">
              <label htmlFor="email" className="faccao-modal-label">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                className="faccao-modal-input"
                placeholder="contato@faccao.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>

          {error && <div className="faccao-modal-error">{error}</div>}

          <div className="faccao-modal-actions">
            <button
              type="button"
              className="faccao-btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="faccao-btn-save"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar Facção"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
