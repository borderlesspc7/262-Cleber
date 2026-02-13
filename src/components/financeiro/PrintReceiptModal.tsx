import React, { useRef } from "react";
import { X, Printer } from "lucide-react";
import type { LancamentoFinanceiro } from "../../types/financeiro";
import "./PrintReceiptModal.css";

interface PrintReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  lancamento: LancamentoFinanceiro;
  empresaNome?: string;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  isOpen,
  onClose,
  lancamento,
  empresaNome = "Empresa",
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const formatDateLong = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const extenso = (valor: number): string => {
    const unidades = [
      "",
      "um",
      "dois",
      "três",
      "quatro",
      "cinco",
      "seis",
      "sete",
      "oito",
      "nove",
    ];
    const dezenas = [
      "",
      "dez",
      "vinte",
      "trinta",
      "quarenta",
      "cinquenta",
      "sessenta",
      "setenta",
      "oitenta",
      "noventa",
    ];
    const especiais = [
      "dez",
      "onze",
      "doze",
      "treze",
      "quatorze",
      "quinze",
      "dezesseis",
      "dezessete",
      "dezoito",
      "dezenove",
    ];
    const centenas = [
      "",
      "cento",
      "duzentos",
      "trezentos",
      "quatrocentos",
      "quinhentos",
      "seiscentos",
      "setecentos",
      "oitocentos",
      "novecentos",
    ];

    const valorInteiro = Math.floor(valor);
    const centavos = Math.round((valor - valorInteiro) * 100);

    const converterAteMil = (n: number): string => {
      if (n === 0) return "";
      if (n === 100) return "cem";

      const c = Math.floor(n / 100);
      const d = Math.floor((n % 100) / 10);
      const u = n % 10;

      let resultado = centenas[c];

      if (d === 1) {
        resultado += (resultado ? " e " : "") + especiais[u];
      } else {
        if (d > 0) resultado += (resultado ? " e " : "") + dezenas[d];
        if (u > 0) resultado += (resultado ? " e " : "") + unidades[u];
      }

      return resultado;
    };

    const converterMilhares = (n: number): string => {
      if (n === 0) return "zero";

      const milhares = Math.floor(n / 1000);
      const resto = n % 1000;

      let resultado = "";

      if (milhares > 0) {
        if (milhares === 1) {
          resultado = "mil";
        } else {
          resultado = converterAteMil(milhares) + " mil";
        }
      }

      if (resto > 0) {
        resultado += (resultado ? " e " : "") + converterAteMil(resto);
      }

      return resultado;
    };

    let extensoTexto = converterMilhares(valorInteiro);
    extensoTexto += valorInteiro === 1 ? " real" : " reais";

    if (centavos > 0) {
      extensoTexto += " e " + converterAteMil(centavos);
      extensoTexto += centavos === 1 ? " centavo" : " centavos";
    }

    return extensoTexto;
  };

  if (!isOpen) return null;

  return (
    <div className="receipt-modal-overlay">
      <div className="receipt-modal">
        <div className="receipt-modal-header no-print">
          <div>
            <h2>Recibo de Pagamento</h2>
            <p>Visualize antes de imprimir</p>
          </div>
          <div className="receipt-modal-actions">
            <button className="btn-print" onClick={handlePrint}>
              <Printer size={18} />
              Imprimir
            </button>
            <button className="btn-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="receipt-modal-content" ref={printRef}>
          <div className="receipt-page">
            {/* Cabeçalho do Recibo */}
            <div className="receipt-header">
              <div className="receipt-company-name">{empresaNome}</div>
              <div className="receipt-title">RECIBO DE PAGAMENTO</div>
              <div className="receipt-number">
                Nº {lancamento.id.substring(0, 8).toUpperCase()}
              </div>
            </div>

            {/* Valor em Destaque */}
            <div className="receipt-value-box">
              <span className="receipt-value-label">VALOR:</span>
              <span className="receipt-value">
                {formatCurrency(lancamento.valor)}
              </span>
            </div>

            {/* Corpo do Recibo */}
            <div className="receipt-body">
              <div className="receipt-text-section">
                <p className="receipt-main-text">
                  Recebi de <strong>{empresaNome}</strong> a quantia de{" "}
                  <strong>{formatCurrency(lancamento.valor)}</strong> (
                  {extenso(lancamento.valor)}), referente ao pagamento de
                  serviços prestados conforme especificado abaixo:
                </p>
              </div>

              {/* Detalhes do Serviço */}
              <div className="receipt-details-section">
                <h3 className="receipt-details-title">Detalhes do Serviço</h3>
                <div className="receipt-details-grid">
                  <div className="receipt-detail-item">
                    <span className="receipt-detail-label">
                      Ordem de Produção:
                    </span>
                    <span className="receipt-detail-value">
                      {lancamento.ordemCodigo}
                    </span>
                  </div>
                  <div className="receipt-detail-item">
                    <span className="receipt-detail-label">Produto:</span>
                    <span className="receipt-detail-value">
                      {lancamento.produtoDescricao}
                    </span>
                  </div>
                  <div className="receipt-detail-item">
                    <span className="receipt-detail-label">
                      Etapa Realizada:
                    </span>
                    <span className="receipt-detail-value">
                      {lancamento.etapaNome}
                    </span>
                  </div>
                  <div className="receipt-detail-item">
                    <span className="receipt-detail-label">
                      Prestador de Serviço:
                    </span>
                    <span className="receipt-detail-value">
                      {lancamento.faccaoNome}
                    </span>
                  </div>
                  <div className="receipt-detail-item">
                    <span className="receipt-detail-label">
                      Data de Vencimento:
                    </span>
                    <span className="receipt-detail-value">
                      {formatDate(lancamento.dataVencimento)}
                    </span>
                  </div>
                  <div className="receipt-detail-item">
                    <span className="receipt-detail-label">
                      Data de Pagamento:
                    </span>
                    <span className="receipt-detail-value">
                      {lancamento.dataPagamento
                        ? formatDate(lancamento.dataPagamento)
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {lancamento.observacoes && (
                <div className="receipt-observations-section">
                  <h3 className="receipt-details-title">Observações</h3>
                  <p className="receipt-observation-text">
                    {lancamento.observacoes}
                  </p>
                </div>
              )}

              {/* Valor por Extenso */}
              <div className="receipt-extenso-section">
                <p className="receipt-extenso-text">
                  ( {extenso(lancamento.valor)} )
                </p>
              </div>
            </div>

            {/* Data e Local */}
            <div className="receipt-date-location">
              <p>
                {empresaNome},{" "}
                {lancamento.dataPagamento
                  ? formatDateLong(lancamento.dataPagamento)
                  : formatDateLong(new Date())}
                .
              </p>
            </div>

            {/* Assinaturas */}
            <div className="receipt-signatures">
              <div className="receipt-signature-box">
                <div className="receipt-signature-line"></div>
                <div className="receipt-signature-info">
                  <p className="receipt-signature-name">
                    {lancamento.faccaoNome}
                  </p>
                  <p className="receipt-signature-label">
                    Assinatura do Prestador de Serviço
                  </p>
                </div>
              </div>

              <div className="receipt-signature-box">
                <div className="receipt-signature-line"></div>
                <div className="receipt-signature-info">
                  <p className="receipt-signature-name">{empresaNome}</p>
                  <p className="receipt-signature-label">
                    Assinatura do Pagador
                  </p>
                </div>
              </div>
            </div>

            {/* Rodapé */}
            <div className="receipt-footer">
              <p className="receipt-footer-text">
                Este recibo tem validade como comprovante de pagamento.
              </p>
              <p className="receipt-footer-info">
                Documento gerado em {new Date().toLocaleString("pt-BR")} - ID:{" "}
                {lancamento.id}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
