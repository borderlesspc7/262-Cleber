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
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebaseconfig";
import type {
  ProductionOrder,
  CreateProductionOrderPayload,
} from "../types/order";

const COLLECTION = "ordensProducao";

export const orderService = {
  async getOrders(userId: string): Promise<ProductionOrder[]> {
    const q = query(
      collection(db, COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docRef) => {
      const data = docRef.data();
      return {
        id: docRef.id,
        codigo: data.codigo,
        produtoId: data.produtoId,
        produtoDescricao: data.produtoDescricao,
        produtoRef: data.produtoRef,
        prioridade: data.prioridade,
        status: data.status,
        dataInicio: data.dataInicio,
        dataPrevista: data.dataPrevista,
        createdAt: data.createdAt?.toDate() ?? new Date(),
        updatedAt: data.updatedAt?.toDate() ?? new Date(),
        userId: data.userId,
        grade: data.grade ?? [],
      };
    }) as ProductionOrder[];
  },

  async createOrder(
    userId: string,
    payload: CreateProductionOrderPayload,
    produto: { descricao: string; refCodigo: string }
  ) {
    // Calcula o total de cada linha da grade
    const gradeWithTotals = payload.grade.map((row) => ({
      ...row,
      total: row.pp + row.p + row.m + row.g + row.gg,
    }));

    await addDoc(collection(db, COLLECTION), {
      produtoId: payload.produtoId,
      produtoDescricao: produto.descricao,
      produtoRef: produto.refCodigo,
      prioridade: payload.prioridade,
      dataInicio: payload.dataInicio,
      dataPrevista: payload.dataPrevista,
      grade: gradeWithTotals,
      userId,
      status: "em_producao",
      codigo: `OP${Date.now()}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async updateOrder(id: string, data: Partial<CreateProductionOrderPayload>) {
    await updateDoc(doc(db, COLLECTION, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteOrder(id: string) {
    await deleteDoc(doc(db, COLLECTION, id));
  },
};
