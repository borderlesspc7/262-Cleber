export type StatusLancamento = "pendente" | "pago" | "atrasado";

export interface LancamentoFinanceiro {
  id: string;
  ordemProducaoId: string;
  ordemCodigo: string; // Código da OP para exibição
  produtoId: string;
  produtoDescricao: string; // Para exibição
  etapaId: string;
  etapaNome: string; // Para exibição
  faccaoId: string;
  faccaoNome: string; // Para exibição
  valor: number;
  dataVencimento: Date;
  dataPagamento?: Date;
  status: StatusLancamento;
  observacoes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLancamentoPayload {
  ordemProducaoId: string;
  ordemCodigo: string;
  produtoId: string;
  produtoDescricao: string;
  etapaId: string;
  etapaNome: string;
  faccaoId: string;
  faccaoNome: string;
  valor: number;
  dataVencimento: Date;
  observacoes?: string;
}

export interface UpdateLancamentoPayload {
  status?: StatusLancamento;
  dataPagamento?: Date;
  observacoes?: string;
}

