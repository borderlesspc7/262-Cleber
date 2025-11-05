export type ProductionProgressStatus = "em_andamento" | "pausada" | "finalizada";

export interface StageProgress {
  etapaId: string;
  etapaNome: string;
  ordem: number;
  finalizadas: number;
  defeituosas: number;
  responsavelId?: string; // ID da facção responsável
  responsavelNome?: string;
  dataInicio?: string;
  dataFim?: string;
  status: ProductionProgressStatus;
}

export interface ProductionOrderProgress {
  id: string;
  ordemProducaoId: string;
  etapas: StageProgress[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface CreateProductionProgressPayload {
  ordemProducaoId: string;
  etapaId: string;
  responsavelId?: string;
  dataInicio?: string;
}

export interface UpdateStageProgressPayload {
  etapaId: string;
  finalizadas?: number;
  defeituosas?: number;
  responsavelId?: string;
  status?: ProductionProgressStatus;
  dataFim?: string;
}

