import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebaseconfig";
import type {
  FinancialPending,
  FinancialPayment,
  FinancialSummary,
} from "../types/financial";

const PENDINGS_COLLECTION = "financialPendings";
const PAYMENTS_COLLECTION = "financialPayments";

export interface CreateFinancialPendingPayload {
  ordem: string;
  ordemId: string; // ID da ordem de produção
  faccao: string;
  faccaoId: string; // ID da facção
  etapa: string;
  etapaId: string; // ID da etapa
  produto: string;
  produtoId: string; // ID do produto
  valor: number;
  vencimento: string; // Data no formato YYYY-MM-DD
  userId: string;
  quantidadePecas?: number; // Quantidade de peças (para cálculo de custos)
  custoPorPeca?: number; // Custo por peça (para cálculo de custos)
}

export interface CreateFinancialPaymentPayload {
  ordem: string;
  ordemId: string;
  faccao: string;
  faccaoId: string;
  produto: string;
  produtoId: string;
  valor: number;
  dataPagamento: string; // Data no formato YYYY-MM-DD
  etapa: string;
  etapaId: string;
  userId: string;
  pendingId?: string; // ID da pendência original, se existir
}

export const financialService = {
  // ========== PENDÊNCIAS ==========

  /**
   * Buscar todas as pendências financeiras do usuário
   */
  async getPendings(userId: string): Promise<FinancialPending[]> {
    try {
      const q = query(
        collection(db, PENDINGS_COLLECTION),
        where("userId", "==", userId),
        orderBy("vencimento", "asc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((docRef) => {
        const data = docRef.data();
        const vencimento = data.vencimento?.toDate
          ? data.vencimento.toDate().toISOString().split("T")[0]
          : data.vencimento;

        // Calcular dias de atraso se vencido
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataVencimento = new Date(vencimento);
        dataVencimento.setHours(0, 0, 0, 0);
        const diasAtraso =
          dataVencimento < hoje
            ? Math.floor(
                (hoje.getTime() - dataVencimento.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : undefined;

        const status: "pendente" | "atrasado" =
          diasAtraso && diasAtraso > 0 ? "atrasado" : "pendente";

        return {
          id: docRef.id,
          ordem: data.ordem,
          faccao: data.faccao,
          etapa: data.etapa,
          produto: data.produto,
          valor: data.valor,
          vencimento,
          status,
          diasAtraso,
        } as FinancialPending;
      });
    } catch (error) {
      console.error("Erro ao buscar pendências financeiras:", error);
      throw error;
    }
  },

  /**
   * Buscar pendência por ID
   */
  async getPendingById(id: string): Promise<FinancialPending | null> {
    try {
      const docRef = doc(db, PENDINGS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      const vencimento = data.vencimento?.toDate
        ? data.vencimento.toDate().toISOString().split("T")[0]
        : data.vencimento;

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataVencimento = new Date(vencimento);
      dataVencimento.setHours(0, 0, 0, 0);
      const diasAtraso =
        dataVencimento < hoje
          ? Math.floor(
              (hoje.getTime() - dataVencimento.getTime()) / (1000 * 60 * 60 * 24)
            )
          : undefined;

      const status: "pendente" | "atrasado" =
        diasAtraso && diasAtraso > 0 ? "atrasado" : "pendente";

      return {
        id: docSnap.id,
        ordem: data.ordem,
        faccao: data.faccao,
        etapa: data.etapa,
        produto: data.produto,
        valor: data.valor,
        vencimento,
        status,
        diasAtraso,
      } as FinancialPending;
    } catch (error) {
      console.error("Erro ao buscar pendência:", error);
      throw error;
    }
  },

  /**
   * Criar nova pendência financeira
   */
  async createPending(
    payload: CreateFinancialPendingPayload
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, PENDINGS_COLLECTION), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Erro ao criar pendência financeira:", error);
      throw error;
    }
  },

  /**
   * Atualizar pendência financeira
   */
  async updatePending(
    id: string,
    data: Partial<CreateFinancialPendingPayload>
  ): Promise<void> {
    try {
      const docRef = doc(db, PENDINGS_COLLECTION, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao atualizar pendência financeira:", error);
      throw error;
    }
  },

  /**
   * Deletar pendência financeira
   */
  async deletePending(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, PENDINGS_COLLECTION, id));
    } catch (error) {
      console.error("Erro ao deletar pendência financeira:", error);
      throw error;
    }
  },

  // ========== PAGAMENTOS ==========

  /**
   * Buscar todos os pagamentos realizados do usuário
   */
  async getPayments(userId: string): Promise<FinancialPayment[]> {
    try {
      const q = query(
        collection(db, PAYMENTS_COLLECTION),
        where("userId", "==", userId),
        orderBy("dataPagamento", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((docRef) => {
        const data = docRef.data();
        const dataPagamento = data.dataPagamento?.toDate
          ? data.dataPagamento.toDate().toISOString().split("T")[0]
          : data.dataPagamento;

        return {
          id: docRef.id,
          ordem: data.ordem,
          faccao: data.faccao,
          produto: data.produto,
          valor: data.valor,
          dataPagamento,
          etapa: data.etapa,
        } as FinancialPayment;
      });
    } catch (error) {
      console.error("Erro ao buscar pagamentos:", error);
      throw error;
    }
  },

  /**
   * Buscar pagamentos do mês atual
   */
  async getPaymentsThisMonth(userId: string): Promise<FinancialPayment[]> {
    try {
      const hoje = new Date();
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      const q = query(
        collection(db, PAYMENTS_COLLECTION),
        where("userId", "==", userId),
        where("dataPagamento", ">=", Timestamp.fromDate(primeiroDiaMes)),
        where("dataPagamento", "<=", Timestamp.fromDate(ultimoDiaMes)),
        orderBy("dataPagamento", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((docRef) => {
        const data = docRef.data();
        const dataPagamento = data.dataPagamento?.toDate
          ? data.dataPagamento.toDate().toISOString().split("T")[0]
          : data.dataPagamento;

        return {
          id: docRef.id,
          ordem: data.ordem,
          faccao: data.faccao,
          produto: data.produto,
          valor: data.valor,
          dataPagamento,
          etapa: data.etapa,
        } as FinancialPayment;
      });
    } catch (error) {
      console.error("Erro ao buscar pagamentos do mês:", error);
      throw error;
    }
  },

  /**
   * Registrar pagamento (mover pendência para pagamentos)
   */
  async markAsPaid(
    pendingId: string,
    dataPagamento?: string
  ): Promise<string> {
    try {
      // Buscar a pendência
      const pending = await this.getPendingById(pendingId);
      if (!pending) {
        throw new Error("Pendência não encontrada");
      }

      // Buscar dados completos da pendência no Firestore
      const pendingDoc = await getDoc(doc(db, PENDINGS_COLLECTION, pendingId));
      const pendingData = pendingDoc.data();

      if (!pendingData) {
        throw new Error("Dados da pendência não encontrados");
      }

      // Criar registro de pagamento
      const paymentData: CreateFinancialPaymentPayload = {
        ordem: pendingData.ordem,
        ordemId: pendingData.ordemId,
        faccao: pendingData.faccao,
        faccaoId: pendingData.faccaoId,
        produto: pendingData.produto,
        produtoId: pendingData.produtoId,
        valor: pendingData.valor,
        dataPagamento: dataPagamento || new Date().toISOString().split("T")[0],
        etapa: pendingData.etapa,
        etapaId: pendingData.etapaId,
        userId: pendingData.userId,
        pendingId: pendingId,
      };

      const paymentRef = await addDoc(
        collection(db, PAYMENTS_COLLECTION),
        {
          ...paymentData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      // Deletar a pendência
      await this.deletePending(pendingId);

      return paymentRef.id;
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      throw error;
    }
  },

  /**
   * Criar pagamento diretamente (sem pendência)
   */
  async createPayment(
    payload: CreateFinancialPaymentPayload
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, PAYMENTS_COLLECTION), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Erro ao criar pagamento:", error);
      throw error;
    }
  },

  // ========== INTEGRAÇÃO COM PRODUÇÃO ==========

  /**
   * Criar pendência financeira automaticamente quando uma etapa é finalizada
   * Esta função deve ser chamada quando uma etapa de produção é finalizada
   */
  async createPendingFromStageCompletion(
    userId: string,
    params: {
      ordemId: string;
      ordemCodigo: string;
      etapaId: string;
      etapaNome: string;
      faccaoId: string;
      faccaoNome: string;
      produtoId: string;
      produtoDescricao: string;
      quantidadePecas: number; // Quantidade de peças finalizadas
      custoPorPeca: number; // Custo da etapa por peça
      dataVencimento?: string; // Data de vencimento (opcional, padrão: 30 dias)
    }
  ): Promise<string> {
    try {
      // Calcular valor total: quantidade * custo por peça
      const valor = params.quantidadePecas * params.custoPorPeca;

      // Calcular data de vencimento (padrão: 30 dias a partir de hoje)
      const dataVencimento =
        params.dataVencimento ||
        new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString().split("T")[0];

      // Verificar se já existe pendência para esta etapa desta ordem
      const existingPendings = await this.getPendingsByOrderAndStage(
        userId,
        params.ordemId,
        params.etapaId
      );

      if (existingPendings.length > 0) {
        // Atualizar pendência existente
        const existing = existingPendings[0];
        await this.updatePending(existing.id, {
          valor: valor,
          vencimento: dataVencimento,
          userId,
          quantidadePecas: params.quantidadePecas,
          custoPorPeca: params.custoPorPeca,
        });
        return existing.id;
      }

      // Criar nova pendência
      return await this.createPending({
        ordem: params.ordemCodigo,
        ordemId: params.ordemId,
        faccao: params.faccaoNome,
        faccaoId: params.faccaoId,
        etapa: params.etapaNome,
        etapaId: params.etapaId,
        produto: params.produtoDescricao,
        produtoId: params.produtoId,
        valor,
        vencimento: dataVencimento,
        userId,
        quantidadePecas: params.quantidadePecas,
        custoPorPeca: params.custoPorPeca,
      });
    } catch (error) {
      console.error("Erro ao criar pendência da etapa:", error);
      throw error;
    }
  },

  /**
   * Buscar pendências por ordem de produção
   */
  async getPendingsByOrder(
    userId: string,
    ordemId: string
  ): Promise<FinancialPending[]> {
    try {
      const q = query(
        collection(db, PENDINGS_COLLECTION),
        where("userId", "==", userId),
        where("ordemId", "==", ordemId),
        orderBy("vencimento", "asc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((docRef) => {
        const data = docRef.data();
        const vencimento = data.vencimento?.toDate
          ? data.vencimento.toDate().toISOString().split("T")[0]
          : data.vencimento;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataVencimento = new Date(vencimento);
        dataVencimento.setHours(0, 0, 0, 0);
        const diasAtraso =
          dataVencimento < hoje
            ? Math.floor(
                (hoje.getTime() - dataVencimento.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : undefined;

        const status: "pendente" | "atrasado" =
          diasAtraso && diasAtraso > 0 ? "atrasado" : "pendente";

        return {
          id: docRef.id,
          ordem: data.ordem,
          faccao: data.faccao,
          etapa: data.etapa,
          produto: data.produto,
          valor: data.valor,
          vencimento,
          status,
          diasAtraso,
        } as FinancialPending;
      });
    } catch (error) {
      console.error("Erro ao buscar pendências da ordem:", error);
      throw error;
    }
  },

  /**
   * Buscar pendências por ordem e etapa
   */
  async getPendingsByOrderAndStage(
    userId: string,
    ordemId: string,
    etapaId: string
  ): Promise<FinancialPending[]> {
    try {
      const q = query(
        collection(db, PENDINGS_COLLECTION),
        where("userId", "==", userId),
        where("ordemId", "==", ordemId),
        where("etapaId", "==", etapaId)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((docRef) => {
        const data = docRef.data();
        const vencimento = data.vencimento?.toDate
          ? data.vencimento.toDate().toISOString().split("T")[0]
          : data.vencimento;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataVencimento = new Date(vencimento);
        dataVencimento.setHours(0, 0, 0, 0);
        const diasAtraso =
          dataVencimento < hoje
            ? Math.floor(
                (hoje.getTime() - dataVencimento.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : undefined;

        const status: "pendente" | "atrasado" =
          diasAtraso && diasAtraso > 0 ? "atrasado" : "pendente";

        return {
          id: docRef.id,
          ordem: data.ordem,
          faccao: data.faccao,
          etapa: data.etapa,
          produto: data.produto,
          valor: data.valor,
          vencimento,
          status,
          diasAtraso,
        } as FinancialPending;
      });
    } catch (error) {
      console.error("Erro ao buscar pendências da etapa:", error);
      throw error;
    }
  },

  /**
   * Calcular custo total de uma ordem de produção
   * Baseado nas etapas e custos configurados
   */
  async calculateOrderCost(
    userId: string,
    ordemId: string
  ): Promise<{
    custoTotal: number;
    custoPorEtapa: Array<{
      etapaId: string;
      etapaNome: string;
      quantidade: number;
      custoUnitario: number;
      custoTotal: number;
    }>;
  }> {
    try {
      // Buscar pendências da ordem
      const pendings = await this.getPendingsByOrder(userId, ordemId);

      const custoPorEtapa = pendings.map((p) => {
        // Buscar dados completos da pendência
        const pendingDoc = doc(db, PENDINGS_COLLECTION, p.id);
        return getDoc(pendingDoc).then((docSnap) => {
          if (!docSnap.exists()) return null;
          const data = docSnap.data();
          // Tentar calcular quantidade e custo unitário
          // Se não estiver armazenado, usar valor total como estimativa
          return {
            etapaId: data.etapaId,
            etapaNome: p.etapa,
            quantidade: data.quantidadePecas || 0,
            custoUnitario: data.custoPorPeca || 0,
            custoTotal: p.valor,
          };
        });
      });

      const etapas = await Promise.all(custoPorEtapa);
      const custoTotal = etapas.reduce(
        (sum, etapa) => sum + (etapa?.custoTotal || 0),
        0
      );

      return {
        custoTotal,
        custoPorEtapa: etapas.filter((e) => e !== null) as Array<{
          etapaId: string;
          etapaNome: string;
          quantidade: number;
          custoUnitario: number;
          custoTotal: number;
        }>,
      };
    } catch (error) {
      console.error("Erro ao calcular custo da ordem:", error);
      throw error;
    }
  },

  /**
   * Buscar resumo financeiro por ordem de produção
   */
  async getOrderFinancialSummary(
    userId: string,
    ordemId: string
  ): Promise<{
    totalPendente: number;
    totalPago: number;
    pendentes: FinancialPending[];
    pagamentos: FinancialPayment[];
  }> {
    try {
      const [pendings, payments] = await Promise.all([
        this.getPendingsByOrder(userId, ordemId),
        this.getPaymentsByOrder(userId, ordemId),
      ]);

      const totalPendente = pendings.reduce((sum, p) => sum + p.valor, 0);
      const totalPago = payments.reduce((sum, p) => sum + p.valor, 0);

      return {
        totalPendente,
        totalPago,
        pendentes: pendings,
        pagamentos: payments,
      };
    } catch (error) {
      console.error("Erro ao buscar resumo financeiro da ordem:", error);
      throw error;
    }
  },

  /**
   * Buscar pagamentos por ordem de produção
   */
  async getPaymentsByOrder(
    userId: string,
    ordemId: string
  ): Promise<FinancialPayment[]> {
    try {
      const q = query(
        collection(db, PAYMENTS_COLLECTION),
        where("userId", "==", userId),
        where("ordemId", "==", ordemId),
        orderBy("dataPagamento", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((docRef) => {
        const data = docRef.data();
        const dataPagamento = data.dataPagamento?.toDate
          ? data.dataPagamento.toDate().toISOString().split("T")[0]
          : data.dataPagamento;

        return {
          id: docRef.id,
          ordem: data.ordem,
          faccao: data.faccao,
          produto: data.produto,
          valor: data.valor,
          dataPagamento,
          etapa: data.etapa,
        } as FinancialPayment;
      });
    } catch (error) {
      console.error("Erro ao buscar pagamentos da ordem:", error);
      throw error;
    }
  },

  // ========== RESUMO ==========

  /**
   * Calcular resumo financeiro
   */
  async getSummary(userId: string): Promise<FinancialSummary> {
    try {
      const [pendings, paymentsThisMonth] = await Promise.all([
        this.getPendings(userId),
        this.getPaymentsThisMonth(userId),
      ]);

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Calcular totais
      const totalPendente = pendings.reduce((sum, p) => sum + p.valor, 0);
      const totalAtrasado = pendings
        .filter((p) => p.status === "atrasado")
        .reduce((sum, p) => sum + p.valor, 0);
      const totalPagoMes = paymentsThisMonth.reduce(
        (sum, p) => sum + p.valor,
        0
      );

      // Buscar meta mensal (pode ser configurada por empresa)
      // Por enquanto, vamos usar um valor padrão ou calcular baseado em meses anteriores
      const metaMensal = 15000.0; // TODO: Buscar do perfil da empresa

      // Calcular variação da meta (comparar com mês anterior)
      const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const ultimoDiaMesAnterior = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        0
      );

      const qPaymentsLastMonth = query(
        collection(db, PAYMENTS_COLLECTION),
        where("userId", "==", userId),
        where(
          "dataPagamento",
          ">=",
          Timestamp.fromDate(mesAnterior)
        ),
        where(
          "dataPagamento",
          "<=",
          Timestamp.fromDate(ultimoDiaMesAnterior)
        )
      );

      const paymentsLastMonthSnapshot = await getDocs(qPaymentsLastMonth);
      const totalPagoMesAnterior = paymentsLastMonthSnapshot.docs.reduce(
        (sum, doc) => sum + (doc.data().valor || 0),
        0
      );

      const variacaoMeta =
        totalPagoMesAnterior > 0
          ? ((totalPagoMes - totalPagoMesAnterior) / totalPagoMesAnterior) *
            100
          : 0;

      return {
        totalPendente,
        totalAtrasado,
        totalPagoMes,
        metaMensal,
        lancamentosPendentes: pendings.length,
        pagamentosMes: paymentsThisMonth.length,
        variacaoMeta: Math.round(variacaoMeta * 100) / 100,
      };
    } catch (error) {
      console.error("Erro ao calcular resumo financeiro:", error);
      throw error;
    }
  },
};

