import React, { useEffect, useRef, useState } from "react";
import { X, Printer } from "lucide-react";
import type { ProductionOrder } from "../../types/order";
import type { Produto } from "../../types/product";
import type { Company } from "../../types/company";
import { formatDateBR, formatDateTimeBR } from "../../utils/dateFormatter";
import toast from "react-hot-toast";
import "./PrintOrderModal.css";

interface PrintOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ProductionOrder;
  produto: Produto | undefined;
  company?: Company | null;
}

export const PrintOrderModal: React.FC<PrintOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  produto,
  company,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setLogoLoadFailed(false);
    }
  }, [isOpen, order.id]);

  const handlePrint = () => {
    if (typeof window.print !== "function") {
      toast.error("Seu navegador não suporta impressão nesta tela.");
      return;
    }
    setIsPrinting(true);
    try {
      toast("Abrindo janela de impressão...");
      window.print();
    } catch (error) {
      console.error("Erro ao imprimir ordem:", error);
      toast.error("Não foi possível abrir a impressão.");
    } finally {
      setIsPrinting(false);
    }
  };

  const formatDate = (value: Date | string) => formatDateBR(value);

  const getTotalPecas = () => {
    return order.grade.reduce((acc, row) => acc + row.total, 0);
  };

  const getTamanhosList = () => {
    if (!order.grade || order.grade.length === 0) return [];
    const firstRow = order.grade[0];
    return Object.keys(firstRow.quantidades);
  };

  if (!isOpen) return null;

  return (
    <div className="print-modal-overlay" onClick={onClose}>
      <div
        className="print-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-order-title"
      >
        <div className="print-modal-header no-print">
          <div>
            <h2 id="print-order-title">Impressão de Ordem de Produção</h2>
            <p>Visualize antes de imprimir</p>
          </div>
          <div className="print-modal-actions">
            <button className="btn-print" onClick={handlePrint} disabled={isPrinting}>
              <Printer size={18} />
              {isPrinting ? "Preparando..." : "Imprimir"}
            </button>
            <button
              ref={closeButtonRef}
              className="btn-close"
              onClick={onClose}
              aria-label="Fechar visualização de impressão"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="print-modal-content" ref={printRef}>
          <div className="print-page">
            {!company?.nome && !company?.logoUrl && (
              <div className="print-warning-banner">
                Cabeçalho da empresa incompleto. Cadastre os dados da empresa para
                uma impressão mais profissional.
              </div>
            )}
            {!produto && (
              <div className="print-warning-banner">
                Alguns dados do produto não foram localizados para esta ordem.
              </div>
            )}
            {(company?.logoUrl || company?.nome || company?.email) && (
              <div className="print-company-banner">
                {company?.logoUrl && !logoLoadFailed && (
                  <img
                    src={company.logoUrl}
                    alt=""
                    className="print-company-logo"
                    onError={() => setLogoLoadFailed(true)}
                  />
                )}
                <div className="print-company-details">
                  {company?.nome && (
                    <div className="print-company-name">{company.nome}</div>
                  )}
                  {company?.email && (
                    <div className="print-company-email">{company.email}</div>
                  )}
                  {company?.endereco && (
                    <div className="print-company-address">
                      {company.endereco}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cabeçalho */}
            <div className="print-header">
              <div className="print-title-section">
                <h1 className="print-main-title">ORDEM DE PRODUÇÃO</h1>
                <div className="print-order-code">{order.codigo}</div>
              </div>
              <div className="print-date-info">
                <div className="print-date-item">
                  <strong>Data Emissão:</strong>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div className="print-date-item">
                  <strong>Data Início:</strong>
                  <span>{formatDate(order.dataInicio)}</span>
                </div>
                <div className="print-date-item">
                  <strong>Previsão:</strong>
                  <span>{formatDate(order.dataPrevista)}</span>
                </div>
              </div>
            </div>

            {/* Informações do Produto */}
            <div className="print-section">
              <h2 className="print-section-title">DADOS DO PRODUTO</h2>
              <div className="print-info-grid">
                <div className="print-info-item">
                  <span className="print-label">Referência:</span>
                  <span className="print-value">{order.produtoRef}</span>
                </div>
                <div className="print-info-item">
                  <span className="print-label">Descrição:</span>
                  <span className="print-value">{order.produtoDescricao}</span>
                </div>
                <div className="print-info-item">
                  <span className="print-label">Categoria:</span>
                  <span className="print-value">
                    {produto?.categoria?.nome || "N/A"}
                  </span>
                </div>
                <div className="print-info-item">
                  <span className="print-label">Prioridade:</span>
                  <span className="print-value print-priority">
                    {order.prioridade.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Grade de Produção */}
            <div className="print-section">
              <h2 className="print-section-title">GRADE DE PRODUÇÃO</h2>
              <table className="print-grade-table">
                <thead>
                  <tr>
                    <th className="print-table-header">Cor</th>
                    {getTamanhosList().map((tamanho) => (
                      <th key={tamanho} className="print-table-header print-table-center">
                        {tamanho}
                      </th>
                    ))}
                    <th className="print-table-header print-table-center">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.grade.map((row, index) => (
                    <tr key={index}>
                      <td className="print-table-cell print-table-bold">
                        {row.corNome}
                      </td>
                      {getTamanhosList().map((tamanho) => (
                        <td
                          key={tamanho}
                          className="print-table-cell print-table-center"
                        >
                          {row.quantidades[tamanho] || 0}
                        </td>
                      ))}
                      <td className="print-table-cell print-table-center print-table-bold">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                  <tr className="print-table-footer">
                    <td className="print-table-cell print-table-bold">
                      TOTAL GERAL
                    </td>
                    {getTamanhosList().map((tamanho) => (
                      <td
                        key={tamanho}
                        className="print-table-cell print-table-center print-table-bold"
                      >
                        {order.grade.reduce(
                          (acc, row) => acc + (row.quantidades[tamanho] || 0),
                          0
                        )}
                      </td>
                    ))}
                    <td className="print-table-cell print-table-center print-table-bold print-total-highlight">
                      {getTotalPecas()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Informações de Produção */}
            <div className="print-section">
              <h2 className="print-section-title">RESPONSÁVEL</h2>
              <div className="print-info-box">
                <span className="print-label">Responsável pela Produção:</span>
                <span className="print-value">
                  {order.responsavelNome || "Não atribuído"}
                </span>
              </div>
            </div>

            {/* Etapas de Produção */}
            {produto?.etapasProducao && produto.etapasProducao.length > 0 && (
              <div className="print-section">
                <h2 className="print-section-title">ETAPAS DE PRODUÇÃO</h2>
                <table className="print-steps-table">
                  <thead>
                    <tr>
                      <th className="print-table-header">Ordem</th>
                      <th className="print-table-header">Etapa</th>
                      <th className="print-table-header">Descrição</th>
                      <th className="print-table-header print-table-center">
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {produto.etapasProducao.map((etapa, index) => (
                      <tr key={index}>
                        <td className="print-table-cell print-table-center">
                          {etapa.ordem}
                        </td>
                        <td className="print-table-cell">{etapa.etapa.nome}</td>
                        <td className="print-table-cell">
                          {etapa.etapa.descricao || "-"}
                        </td>
                        <td className="print-table-cell print-table-center">
                          R$ {etapa.custo.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Observações */}
            <div className="print-section">
              <h2 className="print-section-title">OBSERVAÇÕES</h2>
              <div className="print-observations">
                <div className="print-observation-line"></div>
                <div className="print-observation-line"></div>
                <div className="print-observation-line"></div>
              </div>
            </div>

            {/* Assinaturas */}
            <div className="print-signatures">
              <div className="print-signature-box">
                <div className="print-signature-line"></div>
                <span className="print-signature-label">
                  Responsável pela Emissão
                </span>
              </div>
              <div className="print-signature-box">
                <div className="print-signature-line"></div>
                <span className="print-signature-label">
                  Responsável pela Produção
                </span>
              </div>
            </div>

            {/* Rodapé */}
            <div className="print-footer">
              <p>
                Documento gerado em {formatDateTimeBR(new Date())} - Sistema de
                Gestão de Produção
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
