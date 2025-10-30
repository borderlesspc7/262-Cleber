export interface FinancialPending {
  id: string;
  ordem: string;
  faccao: string;
  etapa: string;
  produto: string;
  valor: number;
  vencimento: string;
  status: 'pendente' | 'atrasado';
  diasAtraso?: number;
}

export interface FinancialSummary {
  totalPendente: number;
  totalAtrasado: number;
  totalPagoMes: number;
  metaMensal: number;
  lancamentosPendentes: number;
  pagamentosMes: number;
  variacaoMeta: number;
}

export interface FinancialPayment {
  id: string;
  ordem: string;
  faccao: string;
  produto: string;
  valor: number;
  dataPagamento: string;
  etapa: string;
}
