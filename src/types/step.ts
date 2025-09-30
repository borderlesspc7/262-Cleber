export interface ProductionStep {
  id: string;
  name: string;
  description: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface CreateStepData {
  name: string;
  description: string;
  order: number;
}

export interface UpdateStepData {
  name?: string;
  description?: string;
  order?: number;
}
