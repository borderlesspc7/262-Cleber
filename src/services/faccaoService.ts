import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebaseconfig";
import type { Faccao } from "../types/faccao";

const COLLECTION_NAME = "faccoes";

export const faccaoService = {
  // Criar nova facção
  async createFaccao(faccaoData: Omit<Faccao, "id">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...faccaoData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      throw new Error(
        `Erro ao criar facção: ${error instanceof Error ? error.message : "Erro desconhecido"}`
      );
    }
  },

  // Buscar todas as facções
  async getFaccoes(): Promise<Faccao[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy("nome", "asc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Faccao[];
    } catch (error) {
      throw new Error(
        `Erro ao buscar facções: ${error instanceof Error ? error.message : "Erro desconhecido"}`
      );
    }
  },

  // Atualizar facção
  async updateFaccao(id: string, faccaoData: Partial<Faccao>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...faccaoData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw new Error(
        `Erro ao atualizar facção: ${error instanceof Error ? error.message : "Erro desconhecido"}`
      );
    }
  },

  // Deletar facção
  async deleteFaccao(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      throw new Error(
        `Erro ao deletar facção: ${error instanceof Error ? error.message : "Erro desconhecido"}`
      );
    }
  },
};
