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
      console.error("Erro ao criar facção:", error);
      throw error;
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
      console.error("Erro ao buscar facções:", error);
      throw error;
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
      console.error("Erro ao atualizar facção:", error);
      throw error;
    }
  },

  // Deletar facção
  async deleteFaccao(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error("Erro ao deletar facção:", error);
      throw error;
    }
  },
};
