import React, { useState, useEffect } from "react";
import {
  Search,
  Users,
  MapPin,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Check,
} from "lucide-react";
import { faccaoService } from "../../services/faccaoService";
import type { Faccao } from "../../types/faccao";
import { FaccaoModal } from "../faccoes/FaccaoModal";
import toast from "react-hot-toast";
import { DeleteConfirmModal } from "../../components/ui/DeleteConfirmModal/DeleteConfirmModal";
import "./FaccoesTab.css";

export const FaccoesTab: React.FC = () => {
  const [faccoes, setFaccoes] = useState<Faccao[]>([]);
  const [filteredFaccoes, setFilteredFaccoes] = useState<Faccao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [faccaoToEdit, setFaccaoToEdit] = useState<Faccao | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);
      await faccaoService.deleteFaccao(itemToDelete);
      await loadFaccoes();
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      toast.success("Facção excluída com sucesso!", {
        icon: <Check size={20} />,
      });
    } catch (error) {
      console.error("Erro ao deletar facção:", error);
      toast.error("Erro ao deletar facção. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    loadFaccoes();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredFaccoes(faccoes);
    } else {
      const filtered = faccoes.filter(
        (faccao) =>
          faccao.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faccao.servicoPrestado
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
      setFilteredFaccoes(filtered);
    }
  }, [searchTerm, faccoes]);

  const loadFaccoes = async () => {
    try {
      setLoading(true);
      const data = await faccaoService.getFaccoes();
      setFaccoes(data);
      setFilteredFaccoes(data);
    } catch (error) {
      console.error("Erro ao carregar facções:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (faccaoData: Omit<Faccao, "id">) => {
    try {
      if (faccaoToEdit?.id) {
        await faccaoService.updateFaccao(faccaoToEdit.id, faccaoData);
        toast.success("Facção atualizada com sucesso!", {
          icon: <Check size={20} />,
        });
      } else {
        await faccaoService.createFaccao(faccaoData);
        toast.success("Facção criada com sucesso!", {
          icon: <Check size={20} />,
        });
      }
      await loadFaccoes();
      setIsModalOpen(false);
      setFaccaoToEdit(null);
    } catch (error) {
      console.error("Erro ao salvar facção:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao salvar facção. Tente novamente.";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleEdit = (faccao: Faccao) => {
    setFaccaoToEdit(faccao);
    setIsModalOpen(true);
  };

  const handleNewFaccao = () => {
    setFaccaoToEdit(null);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="header-container">
        <h2 className="header-title-faccoes">Facções / Terceirizados</h2>
        <p className="header-subtitle-faccoes">
          Gerencie seus parceiros de produção
        </p>
      </div>

      <div className="faccoes-container">
        <div className="faccoes-header">
          <div className="faccoes-title-section">
            <h1 className="faccoes-title">Facções / Terceirizados</h1>
            <p className="faccoes-subtitle">
              Gerencie seus parceiros de produção
            </p>
          </div>
          <button className="faccoes-add-button" onClick={handleNewFaccao}>
            <span className="faccoes-add-icon">+</span>
            <span className="faccoes-add-text">Nova Facção</span>
          </button>
        </div>

        <div className="faccoes-search-container">
          <div className="faccoes-search-box">
            <Search size={20} className="faccoes-search-icon" />
            <input
              type="text"
              className="faccoes-search-input"
              placeholder="Buscar por nome ou serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="faccoes-content">
          {loading ? (
            <div className="faccoes-loading">
              <p>Carregando facções...</p>
            </div>
          ) : filteredFaccoes.length === 0 ? (
            <div className="faccoes-empty">
              <Users size={48} />
              <p>
                {searchTerm
                  ? "Nenhuma facção encontrada com esse termo"
                  : "Nenhuma facção cadastrada"}
              </p>
              {!searchTerm && (
                <p className="faccoes-empty-subtitle">
                  Clique em "Nova Facção" para adicionar um parceiro
                </p>
              )}
            </div>
          ) : (
            <div className="faccoes-grid">
              {filteredFaccoes.map((faccao) => (
                <div key={faccao.id} className="faccao-card">
                  <div className="faccao-card-header">
                    <div className="faccao-avatar">
                      <Users size={24} />
                    </div>
                    <div className="faccao-header-info">
                      <h3 className="faccao-name">{faccao.nome}</h3>
                      {faccao.ativo && (
                        <span className="faccao-status">Ativo</span>
                      )}
                    </div>
                    <div className="faccao-actions">
                      <button
                        className="faccao-action-btn faccao-edit-btn"
                        onClick={() => handleEdit(faccao)}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="faccao-action-btn faccao-delete-btn"
                        onClick={() =>
                          faccao.id && handleDeleteClick(faccao.id)
                        }
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="faccao-card-body">
                    <div className="faccao-info-row">
                      <MapPin size={16} className="faccao-icon" />
                      <span className="faccao-info-text">
                        {faccao.enderecoCompleto}
                      </span>
                    </div>

                    <div className="faccao-servicos">
                      <span className="faccao-servicos-label">Serviço:</span>
                      <span className="faccao-servico-tag">
                        {faccao.servicoPrestado}
                      </span>
                    </div>

                    <div className="faccao-contact">
                      {faccao.telefone && (
                        <div className="faccao-contact-item">
                          <Phone size={14} className="faccao-contact-icon" />
                          <span>Telefone: {faccao.telefone}</span>
                        </div>
                      )}
                      {faccao.email && (
                        <div className="faccao-contact-item">
                          <Mail size={14} className="faccao-contact-icon" />
                          <span>E-mail: {faccao.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <FaccaoModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setFaccaoToEdit(null);
          }}
          onSave={handleSave}
          faccaoToEdit={faccaoToEdit}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          itemName={faccoes.find((f) => f.id === itemToDelete)?.nome || ""}
          loading={isDeleting}
          title="Confirmar Exclusão"
          message="Tem certeza que deseja excluir esta facção?"
          confirmText="Excluir"
          cancelText="Cancelar"
        />
      </div>
    </>
  );
};
