export interface Faccao {
  id?: string;
  nome: string;
  servicoPrestado: string; // Agora é apenas um serviço
  enderecoCompleto: string;
  telefone: string;
  email: string;
  ativo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
