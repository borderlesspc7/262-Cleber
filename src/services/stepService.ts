import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  Timestamp 
} from "firebase/firestore";
import { db } from "../lib/firebaseconfig";
import type { ProductionStep, CreateStepData, UpdateStepData } from "../types/step";

export const stepService = {
  async createStep(userId: string, stepData: CreateStepData): Promise<ProductionStep> {
    try {
      const now = new Date();
      const stepRef = await addDoc(collection(db, "productionSteps"), {
        ...stepData,
        userId,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });

      return {
        id: stepRef.id,
        ...stepData,
        userId,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error("Erro ao criar etapa:", error);
      throw new Error("Erro ao criar etapa");
    }
  },

  async getStepsByUser(userId: string): Promise<ProductionStep[]> {
    try {
      // Buscar todas as etapas do usuário
      const q = query(
        collection(db, "productionSteps"),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(q);
      const steps: ProductionStep[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        steps.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          order: data.order,
          userId: data.userId,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        });
      });

      // Ordenar localmente por ordem
      return steps.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error("Erro ao buscar etapas:", error);
      throw new Error("Erro ao buscar etapas");
    }
  },

  async updateStep(stepId: string, updateData: UpdateStepData): Promise<void> {
    try {
      const stepRef = doc(db, "productionSteps", stepId);
      await updateDoc(stepRef, {
        ...updateData,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error("Erro ao atualizar etapa:", error);
      throw new Error("Erro ao atualizar etapa");
    }
  },

  async deleteStep(stepId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "productionSteps", stepId));
    } catch (error) {
      console.error("Erro ao deletar etapa:", error);
      throw new Error("Erro ao deletar etapa");
    }
  },
};
