// Tipos para cadastros auxiliares
export interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  createdAt: Date;
}

export interface Cor {
  id: string;
  nome: string;
  codigo: string; // código hexadecimal da cor
  ativo: boolean;
  createdAt: Date;
}

export interface Tamanho {
  id: string;
  nome: string;
  ordem: number; // para ordenação (P=1, M=2, G=3, etc.)
  ativo: boolean;
  createdAt: Date;
}

export interface EtapaProducao {
  id: string;
  nome: string;
  descricao?: string;
  custo: number;
  ativo: boolean;
  createdAt: Date;
}

// Tipo principal do produto
export interface Produto {
  id: string;
  refCodigo: string;
  descricao: string;
  categoria: Categoria;
  cores: Cor[];
  tamanhos: Tamanho[];
  etapasProducao: EtapaProducaoItem[];
  categoriaId?: string;
  coresIds?: string[];
  tamanhosIds?: string[];
  etapasProducaoIds?: EtapaProducaoItemForm[];
  userId?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Etapa de produção específica do produto com custo
export interface EtapaProducaoItem {
  etapa: EtapaProducao;
  custo: number;
  ordem: number;
}

// Formulários
export interface CategoriaForm {
  nome: string;
  descricao?: string;
}

export interface CorForm {
  nome: string;
  codigo: string;
}

export interface TamanhoForm {
  nome: string;
  ordem: number;
}

export interface EtapaProducaoForm {
  nome: string;
  descricao?: string;
  custo: number;
}

export interface ProdutoForm {
  refCodigo: string;
  descricao: string;
  categoriaId: string;
  coresIds: string[];
  tamanhosIds: string[];
  etapasProducao?: EtapaProducaoItemForm[];
}

export interface EtapaProducaoItemForm {
  etapaId: string;
  custo: number;
  ordem: number;
}
