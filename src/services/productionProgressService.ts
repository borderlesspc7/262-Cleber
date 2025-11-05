import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebaseconfig";
import type {
  ProductionOrderProgress,
  CreateProductionProgressPayload,
  UpdateStageProgressPayload,
  StageProgress,
  ProductionProgressStatus,
} from "../types/productionProgress";
import type { ProductionStep } from "../types/step";

const COLLECTION = "producaoProgresso";

export const productionProgressService = {
  async getProgressByOrderId(
    ordemProducaoId: string
  ): Promise<ProductionOrderProgress | null> {
    const q = query(
      collection(db, COLLECTION),
      where("ordemProducaoId", "==", ordemProducaoId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docRef = snapshot.docs[0];
    const data = docRef.data();
    return {
      id: docRef.id,
      ordemProducaoId: data.ordemProducaoId,
      etapas: data.etapas ?? [],
      createdAt: data.createdAt?.toDate() ?? new Date(),
      updatedAt: data.updatedAt?.toDate() ?? new Date(),
      userId: data.userId,
    };
  },

  async getAllProgress(userId: string): Promise<ProductionOrderProgress[]> {
    const q = query(
      collection(db, COLLECTION),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docRef) => {
      const data = docRef.data();
      return {
        id: docRef.id,
        ordemProducaoId: data.ordemProducaoId,
        etapas: data.etapas ?? [],
        createdAt: data.createdAt?.toDate() ?? new Date(),
        updatedAt: data.updatedAt?.toDate() ?? new Date(),
        userId: data.userId,
      };
    });
  },

  async initializeProgress(
    userId: string,
    ordemProducaoId: string,
    steps: ProductionStep[]
  ): Promise<void> {
    // Verificar se já existe progresso para esta ordem
    const existing = await this.getProgressByOrderId(ordemProducaoId);
    if (existing) return;

    // Criar progresso inicial com todas as etapas
    const etapas: StageProgress[] = steps
      .sort((a, b) => a.order - b.order)
      .map((step, index) => ({
        etapaId: step.id,
        etapaNome: step.name,
        ordem: step.order,
        finalizadas: 0,
        defeituosas: 0,
        status: (index === 0 ? "em_andamento" : "pausada") as ProductionProgressStatus,
      }));

    await addDoc(collection(db, COLLECTION), {
      ordemProducaoId,
      etapas,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async updateStageProgress(
    progressId: string,
    payload: UpdateStageProgressPayload
  ): Promise<void> {
    const progressRef = doc(db, COLLECTION, progressId);
    
    // Buscar o documento atual para obter as etapas
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      throw new Error("Progresso não encontrado");
    }

    const data = progressDoc.data();
    const etapas: StageProgress[] = data.etapas ?? [];

    const etapaIndex = etapas.findIndex(
      (e) => e.etapaId === payload.etapaId
    );

    if (etapaIndex === -1) {
      throw new Error("Etapa não encontrada no progresso");
    }

    // Atualizar a etapa
    etapas[etapaIndex] = {
      ...etapas[etapaIndex],
      ...payload,
      etapaNome: etapas[etapaIndex].etapaNome,
      etapaId: etapas[etapaIndex].etapaId,
      ordem: etapas[etapaIndex].ordem,
    };

    await updateDoc(progressRef, {
      etapas,
      updatedAt: serverTimestamp(),
    });
  },

  async finalizeStage(
    progressId: string,
    etapaId: string,
    finalizadas: number,
    defeituosas: number = 0
  ): Promise<void> {
    await this.updateStageProgress(progressId, {
      etapaId,
      finalizadas,
      defeituosas,
      status: "finalizada",
      dataFim: new Date().toISOString().split("T")[0],
    });
  },

  async pauseStage(progressId: string, etapaId: string): Promise<void> {
    await this.updateStageProgress(progressId, {
      etapaId,
      status: "pausada",
    });
  },

  async resumeStage(progressId: string, etapaId: string): Promise<void> {
    await this.updateStageProgress(progressId, {
      etapaId,
      status: "em_andamento",
    });
  },
};

