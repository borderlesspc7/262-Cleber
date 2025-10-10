import React, { useState, useEffect } from "react";
import { Building2, MapPin, Upload, Save, Loader2 } from "lucide-react";
import { companyService } from "../../services/companyService";
import type { Company } from "../../types/company";
import "./CompanyForm.css";

export const CompanyForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState<Company>({
    nome: "",
    endereco: "",
    logoUrl: "",
  });

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      setLoadingData(true);
      const data = await companyService.getCompanyInfo();
      if (data) {
        setFormData(data);
      }
    } catch (error) {
      console.error("Erro ao carregar informações:", error);
      setMessage({
        type: "error",
        text: "Erro ao carregar informações da empresa",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "Por favor, selecione uma imagem válida",
      });
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "A imagem deve ter no máximo 5MB" });
      return;
    }

    try {
      setUploadingLogo(true);
      const logoUrl = await companyService.uploadLogo(file);
      setFormData((prev) => ({
        ...prev,
        logoUrl,
      }));
      setMessage({ type: "success", text: "Logo enviada com sucesso!" });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      setMessage({ type: "error", text: "Erro ao fazer upload da logo" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      setMessage({ type: "error", text: "O nome da empresa é obrigatório" });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      await companyService.saveCompanyInfo({
        nome: formData.nome,
        endereco: formData.endereco,
        logoUrl: formData.logoUrl,
      });

      setMessage({ type: "success", text: "Informações salvas com sucesso!" });

      // Disparar evento para atualizar o Layout
      window.dispatchEvent(new CustomEvent("companyInfoUpdated"));
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setMessage({ type: "error", text: "Erro ao salvar informações" });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="company-form-loading">
        <Loader2 className="loading-spinner" size={32} />
        <p>Carregando informações...</p>
      </div>
    );
  }

  return (
    <div className="company-form-container">
      <div className="company-form-header">
        <Building2 size={32} />
        <div>
          <h2>Informações da Empresa</h2>
          <p>Configure o nome, logo e endereço da sua empresa</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="company-form">
        {/* Logo Upload */}
        <div className="form-group logo-section">
          <label className="form-label">Logomarca</label>
          <div className="logo-upload-area">
            {formData.logoUrl && (
              <div className="logo-preview">
                <img src={formData.logoUrl} alt="Logo da empresa" />
              </div>
            )}
            <label className="logo-upload-btn">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
              />
              {uploadingLogo ? (
                <>
                  <Loader2 className="upload-icon spinning" size={20} />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Upload className="upload-icon" size={20} />
                  <span>
                    {formData.logoUrl ? "Alterar Logo" : "Enviar Logo"}
                  </span>
                </>
              )}
            </label>
            <p className="logo-upload-hint">
              Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
            </p>
          </div>
        </div>

        {/* Nome da Empresa */}
        <div className="form-group">
          <label htmlFor="nome" className="form-label">
            <Building2 size={18} />
            Nome da Empresa *
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            placeholder="Digite o nome da empresa"
            className="form-input"
            required
          />
        </div>

        {/* Endereço */}
        <div className="form-group">
          <label htmlFor="endereco" className="form-label">
            <MapPin size={18} />
            Endereço Completo
          </label>
          <textarea
            id="endereco"
            name="endereco"
            value={formData.endereco}
            onChange={handleInputChange}
            placeholder="Rua, Número, Bairro, Cidade - Estado, CEP"
            className="form-textarea"
            rows={3}
          />
        </div>

        {/* Mensagem de feedback */}
        {message && (
          <div className={`form-message ${message.type}`}>{message.text}</div>
        )}

        {/* Botão de Salvar */}
        <button
          type="submit"
          className="form-submit-btn"
          disabled={loading || uploadingLogo}
        >
          {loading ? (
            <>
              <Loader2 className="btn-icon spinning" size={20} />
              Salvando...
            </>
          ) : (
            <>
              <Save className="btn-icon" size={20} />
              Salvar Informações
            </>
          )}
        </button>
      </form>
    </div>
  );
};
