export interface Company {
  id?: string;
  nome: string;
  endereco: string;
  /** E-mail institucional (ex.: cabeçalho de impressão) */
  email?: string;
  logoUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
