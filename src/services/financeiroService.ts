import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebaseconfig";
import { removeUndefinedFields } from "../utils/firestoreHelpers";
import type {
  LancamentoFinanceiro,
  CreateLancamentoPayload,
  UpdateLancamentoPayload,
} from "../types/financeiro";

const COLLECTION = "lancamentosFinanceiros";

export const financeiroService = {
  async createLancamento(
    payload: CreateLancamentoPayload,
    userId: string
  ): Promise<string> {
    try {
      const lancamentoData = removeUndefinedFields({
        ...payload,
        dataVencimento: Timestamp.fromDate(payload.dataVencimento),
        status: "pendente",
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const docRef = await addDoc(collection(db, COLLECTION), lancamentoData);
      return docRef.id;
    } catch (error) {
      console.error("Erro ao criar lançamento financeiro:", error);
      throw error;
    }
  },

  async getLancamentosByUser(userId: string): Promise<LancamentoFinanceiro[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("userId", "==", userId),
        orderBy("dataVencimento", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataVencimento: data.dataVencimento?.toDate() || new Date(),
          dataPagamento: data.dataPagamento?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as LancamentoFinanceiro;
      });
    } catch (error) {
      console.error("Erro ao buscar lançamentos:", error);
      throw error;
    }
  },

  async getLancamentosPendentes(
    userId: string
  ): Promise<LancamentoFinanceiro[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("userId", "==", userId),
        where("status", "in", ["pendente", "atrasado"]),
        orderBy("dataVencimento", "asc")
      );

      const querySnapshot = await getDocs(q);
      const lancamentos = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataVencimento: data.dataVencimento?.toDate() || new Date(),
          dataPagamento: data.dataPagamento?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as LancamentoFinanceiro;
      });

      // Atualizar status para atrasado se necessário
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      for (const lancamento of lancamentos) {
        const vencimento = new Date(lancamento.dataVencimento);
        vencimento.setHours(0, 0, 0, 0);

        if (lancamento.status === "pendente" && vencimento < hoje) {
          await this.updateLancamento(lancamento.id, { status: "atrasado" });
          lancamento.status = "atrasado";
        }
      }

      return lancamentos;
    } catch (error) {
      console.error("Erro ao buscar lançamentos pendentes:", error);
      throw error;
    }
  },

  async getLancamentosPagos(userId: string): Promise<LancamentoFinanceiro[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("userId", "==", userId),
        where("status", "==", "pago"),
        orderBy("dataPagamento", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataVencimento: data.dataVencimento?.toDate() || new Date(),
          dataPagamento: data.dataPagamento?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as LancamentoFinanceiro;
      });
    } catch (error) {
      console.error("Erro ao buscar lançamentos pagos:", error);
      throw error;
    }
  },

  async updateLancamento(
    lancamentoId: string,
    payload: UpdateLancamentoPayload
  ): Promise<void> {
    try {
      const lancamentoRef = doc(db, COLLECTION, lancamentoId);
      const updateData = removeUndefinedFields({
        ...payload,
        dataPagamento: payload.dataPagamento
          ? Timestamp.fromDate(payload.dataPagamento)
          : undefined,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(lancamentoRef, updateData);
    } catch (error) {
      console.error("Erro ao atualizar lançamento:", error);
      throw error;
    }
  },

  async marcarComoPago(lancamentoId: string): Promise<void> {
    try {
      await this.updateLancamento(lancamentoId, {
        status: "pago",
        dataPagamento: new Date(),
      });
    } catch (error) {
      console.error("Erro ao marcar lançamento como pago:", error);
      throw error;
    }
  },

  async deleteLancamento(lancamentoId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION, lancamentoId));
    } catch (error) {
      console.error("Erro ao deletar lançamento:", error);
      throw error;
    }
  },

  async deleteLancamentosByOrdem(ordemProducaoId: string): Promise<void> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("ordemProducaoId", "==", ordemProducaoId)
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );

      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Erro ao deletar lançamentos da ordem:", error);
      throw error;
    }
  },
};
