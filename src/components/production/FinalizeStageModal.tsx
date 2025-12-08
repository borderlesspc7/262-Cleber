import React, { useState } from "react";
import { X, AlertCircle, ChevronDown } from "lucide-react";
import type { ProductionOrder } from "../../types/order";
import type { StageProgress } from "../../types/productionProgress";
import type { ProductionStep } from "../../types/step";
import type { Faccao } from "../../types/faccao";
import { toast } from "react-hot-toast";
import "./FinalizeStageModal.css";

interface FinalizeStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ProductionOrder;
  currentStage: StageProgress;
  availableStages: ProductionStep[];
  faccoes: Faccao[];
  totalPecas: number;
  onSubmit: (data: FinalizeStageData) => Promise<void>;
  isSubmitting: boolean;
}

export interface FinalizeStageData {
  finalizadas: number;
  defeituosas: number;
  proximaEtapaId: string;
  responsavelProximaEtapaId: string;
  observacoes: string;
}

export const FinalizeStageModal: React.FC<FinalizeStageModalProps> = ({
  isOpen,
  onClose,
  order,
  currentStage,
  availableStages,
  faccoes,
  totalPecas,
  onSubmit,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState<FinalizeStageData>({
    finalizadas: totalPecas,
    defeituosas: 0,
    proximaEtapaId: "",
    responsavelProximaEtapaId: "",
    observacoes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.finalizadas + formData.defeituosas > totalPecas) {
      toast.error(
        "O número de peças finalizadas e defeituosas não pode ser maior que o total de peças"
      );
      return;
    }

    // Só validar próxima etapa e responsável se não for a última etapa
    if (!isLastStage) {
      if (!formData.proximaEtapaId) {
        alert("Selecione a próxima etapa");
        return;
      }

      if (!formData.responsavelProximaEtapaId) {
        alert("Selecione o responsável pela próxima etapa");
        return;
      }
    }

    await onSubmit(formData);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        finalizadas: totalPecas,
        defeituosas: 0,
        proximaEtapaId: "",
        responsavelProximaEtapaId: "",
        observacoes: "",
      });
      onClose();
    }
  };

  // Se não há próximas etapas disponíveis, então esta é a última etapa
  const isLastStage = availableStages.length === 0;

  if (!isOpen) return null;

  return (
    <div className="finalize-modal-overlay">
      <div className="finalize-modal">
        <header className="finalize-modal-header">
          <div>
            <h2>Finalizar Etapa</h2>
            <p>
              {order.codigo} - {currentStage.etapaNome}
            </p>
          </div>

          <button
            className="finalize-modal-close"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </header>

        <form className="finalize-modal-form" onSubmit={handleSubmit}>
          <div className="finalize-form-section">
            <h3 className="finalize-section-title">Quantidades</h3>
            <div className="finalize-form-row">
              <div className="finalize-form-field">
                <label>
                  Peças Finalizadas*
                  <span className="field-hint">Total: {totalPecas}</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={totalPecas}
                  value={formData.finalizadas}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      finalizadas: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="finalize-form-field">
                <label>
                  Peças Defeituosas*
                  <span className="field-hint">Opcional</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.defeituosas}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defeituosas: parseInt(e.target.value) || 0,
                    })
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {formData.finalizadas + formData.defeituosas > totalPecas && (
              <div className="finalize-alert">
                <AlertCircle size={20} />
                <span>A soma não pode ser maior que {totalPecas} peças</span>
              </div>
            )}
          </div>

          <div className="finalize-form-section">
            <h3 className="finalize-section-title">Próxima Etapa</h3>
            {isLastStage ? (
              <div className="finalize-alert">
                <AlertCircle size={20} />
                <span>
                  Esta é a última etapa da produção. Ao finalizar, a ordem será
                  concluída.
                </span>
              </div>
            ) : (
              <>
                <div className="finalize-form-field">
                  <label>Etapa*</label>
                  <div className="finalize-select-wrapper">
                    <select
                      value={formData.proximaEtapaId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          proximaEtapaId: e.target.value,
                        })
                      }
                      required={!isLastStage}
                      disabled={isSubmitting || isLastStage}
                    >
                      <option value="">Selecione a etapa</option>
                      {availableStages.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="select-icon" />
                  </div>
                </div>

                <div className="finalize-form-field">
                  <label>Responsável*</label>
                  <div className="finalize-select-wrapper">
                    <select
                      value={formData.responsavelProximaEtapaId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          responsavelProximaEtapaId: e.target.value,
                        })
                      }
                      required={!isLastStage}
                      disabled={isSubmitting || isLastStage}
                    >
                      <option value="">Selecione o responsável</option>
                      {faccoes.map((faccao) => (
                        <option key={faccao.id} value={faccao.id}>
                          {faccao.nome}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="select-icon" />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="finalize-form-section">
            <h3 className="finalize-section-title">Observações</h3>
            <div className="finalize-form-field">
              <label>
                Problemas ou observações
                <span className="field-hint">Opcional</span>
              </label>
              <textarea
                rows={4}
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                disabled={isSubmitting}
                placeholder="Descreva problemas encontrados, atrasos, ou outras observações relevantes..."
              />
            </div>
          </div>

          <footer className="finalize-modal-footer">
            <button
              type="button"
              className="finalize-btn finalize-btn-cancel"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="finalize-btn finalize-btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Finalizando..." : "Finalizar Etapa"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
