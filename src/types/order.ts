export type OrderPriority = "alta" | "media" | "baixa";
export type OrderStatus = "planejada" | "em_producao" | "concluida";

export interface ProductionOrderGradeRow {
  corId: string;
  corNome: string;
  pp: number;
  p: number;
  m: number;
  g: number;
  gg: number;
  total: number;
}

export interface ProductionOrder {
  id: string;
  codigo: string;
  produtoId: string;
  produtoDescricao: string;
  produtoRef: string;
  prioridade: OrderPriority;
  status: OrderStatus;
  dataInicio: string;
  dataPrevista: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  grade: ProductionOrderGradeRow[];
}

export interface CreateProductionOrderPayload {
  produtoId: string;
  prioridade: OrderPriority;
  dataInicio: string;
  dataPrevista: string;
  grade: Array<Omit<ProductionOrderGradeRow, "corNome" | "total">>;
}
