export type ServicoFaccao =
  | "Corte"
  | "Costura"
  | "Silk"
  | "Transfer"
  | "Apontamento";

export interface Faccao {
  id?: string;
  nome: string;
  servicoPrestado: ServicoFaccao; // Agora é apenas um serviço
  enderecoCompleto: string;
  telefone: string;
  email: string;
  ativo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
