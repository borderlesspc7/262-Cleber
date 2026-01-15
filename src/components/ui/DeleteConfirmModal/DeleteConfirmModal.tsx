import React from "react";
import { X, AlertTriangle } from "lucide-react";
import "./DeleteConfirmModal.css";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  confirmText,
  cancelText,
  loading,
}) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-header">
          <div className="delete-modal-icon-wrapper">
            <AlertTriangle size={24} className="delete-modal-icon" />
          </div>
          <button
            className="delete-modal-close"
            onClick={onClose}
            type="button"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="delete-modal-content">
          <h2 className="delete-modal-title">
            {title || "Confirmar Exclusão"}
          </h2>
          <p className="delete-modal-message">
            {message}
            {itemName && (
              <span className="delete-modal-item-name">"{itemName}"</span>
            )}
            ?
          </p>
          <p className="delete-modal-warning">
            Esta ação não pode ser desfeita.
          </p>
        </div>

        <div className="delete-modal-actions">
          <button
            type="button"
            className="delete-btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText || "Cancelar"}
          </button>
          <button
            className="delete-btn-confirm"
            onClick={handleConfirm}
            disabled={loading}
            type="button"
          >
            {loading ? "Excluindo..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
