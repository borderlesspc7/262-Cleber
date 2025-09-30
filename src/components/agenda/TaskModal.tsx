import React, { useState } from "react";
import { Clock, X } from "lucide-react";
import { Button } from "../ui/Button/Button";
import type { CreateTaskData } from "../../types/task";
import "./TaskModal.css";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: CreateTaskData) => Promise<void>;
  isLoading?: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateTaskData>({
    description: "",
    time: "",
    priority: "media",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim() || !formData.time) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      await onSubmit(formData);
      setFormData({
        description: "",
        time: "",
        priority: "media",
      });
      onClose();
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
    }
  };

  const handleClose = () => {
    setFormData({
      description: "",
      time: "",
      priority: "media",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="task-modal-overlay" onClick={handleClose}>
      <div className="task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="task-modal-header">
          <div className="task-modal-title-section">
            <h2 className="task-modal-title">Nova Tarefa</h2>
            <p className="task-modal-subtitle">
              Adicione uma nova tarefa à sua agenda
            </p>
          </div>
          <button className="task-modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form className="task-modal-form" onSubmit={handleSubmit}>
          <div className="task-modal-field">
            <label className="task-modal-label" htmlFor="description">
              Descrição da Tarefa
            </label>
            <input
              id="description"
              name="description"
              type="text"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Digite a descrição da tarefa"
              className="task-modal-input"
              required
            />
          </div>

          <div className="task-modal-field">
            <label className="task-modal-label" htmlFor="time">
              Horário
            </label>
            <div className="task-modal-time-container">
              <input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                className="task-modal-input task-modal-time-input"
                required
              />
              <Clock className="task-modal-time-icon" size={16} />
            </div>
          </div>

          <div className="task-modal-field">
            <label className="task-modal-label" htmlFor="priority">
              Prioridade
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="task-modal-select"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          <div className="task-modal-actions">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={!formData.description.trim() || !formData.time}
            >
              Adicionar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
