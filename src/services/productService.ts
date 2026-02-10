import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebaseconfig";
import type {
  Categoria,
  Cor,
  Tamanho,
  Produto,
  CategoriaForm,
  CorForm,
  TamanhoForm,
  ProdutoForm,
} from "../types/product";

// ============= CATEGORIAS =============
export const categoriaService = {
  async getCategorias(userId: string): Promise<Categoria[]> {
    try {
      const q = query(
        collection(db, "categorias"),
        where("userId", "==", userId),
        orderBy("nome", "asc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Categoria[];
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      throw error;
    }
  },

  async createCategoria(
    userId: string,
    categoriaForm: CategoriaForm
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "categorias"), {
        ...categoriaForm,
        userId,
        ativo: true,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      throw error;
    }
  },

  async updateCategoria(
    id: string,
    categoriaForm: CategoriaForm
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "categorias", id), {
        ...categoriaForm,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error);
      throw error;
    }
  },

  async deleteCategoria(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "categorias", id));
    } catch (error) {
      console.error("Erro ao deletar categoria:", error);
      throw error;
    }
  },
};

// ============= CORES =============
export const corService = {
  async getCores(userId: string): Promise<Cor[]> {
    try {
      const q = query(
        collection(db, "cores"),
        where("userId", "==", userId),
        orderBy("nome", "asc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Cor[];
    } catch (error) {
      console.error("Erro ao buscar cores:", error);
      throw error;
    }
  },

  async createCor(userId: string, corForm: CorForm): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "cores"), {
        ...corForm,
        userId,
        ativo: true,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Erro ao criar cor:", error);
      throw error;
    }
  },

  async updateCor(id: string, corForm: CorForm): Promise<void> {
    try {
      await updateDoc(doc(db, "cores", id), {
        ...corForm,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao atualizar cor:", error);
      throw error;
    }
  },

  async deleteCor(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "cores", id));
    } catch (error) {
      console.error("Erro ao deletar cor:", error);
      throw error;
    }
  },
};

// ============= TAMANHOS =============
export const tamanhoService = {
  async getTamanhos(userId: string): Promise<Tamanho[]> {
    try {
      const q = query(
        collection(db, "tamanhos"),
        where("userId", "==", userId),
        orderBy("ordem", "asc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Tamanho[];
    } catch (error) {
      console.error("Erro ao buscar tamanhos:", error);
      throw error;
    }
  },

  async createTamanho(
    userId: string,
    tamanhoForm: TamanhoForm
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "tamanhos"), {
        ...tamanhoForm,
        userId,
        ativo: true,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Erro ao criar tamanho:", error);
      throw error;
    }
  },

  async updateTamanho(id: string, tamanhoForm: TamanhoForm): Promise<void> {
    try {
      await updateDoc(doc(db, "tamanhos", id), {
        ...tamanhoForm,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao atualizar tamanho:", error);
      throw error;
    }
  },

  async deleteTamanho(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "tamanhos", id));
    } catch (error) {
      console.error("Erro ao deletar tamanho:", error);
      throw error;
    }
  },
};

// ============= PRODUTOS =============
export const produtoService = {
  async getProdutos(userId: string): Promise<Produto[]> {
    try {
      const q = query(
        collection(db, "produtos"),
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      const produtos = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          refCodigo: data.refCodigo || "",
          descricao: data.descricao || "",
          categoria: { id: "", nome: "", ativo: true, createdAt: new Date() },
          cores: [],
          tamanhos: [],
          etapasProducao: [],
          categoriaId: data.categoriaId || "",
          coresIds: data.coresIds || [],
          tamanhosIds: data.tamanhosIds || [],
          etapasProducaoIds: data.etapasProducaoIds || [],
          ativo: data.ativo !== false,
          userId: data.userId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }) as Produto[];

      return produtos.sort((a, b) => {
        const refA = parseInt(a.refCodigo) || 0;
        const refB = parseInt(b.refCodigo) || 0;
        return refA - refB;
      });
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      throw error;
    }
  },

  async createProduto(
    userId: string,
    produtoForm: ProdutoForm
  ): Promise<string> {
    try {
      // Validar que o produto tem etapas de produção
      if (!produtoForm.etapasProducao || produtoForm.etapasProducao.length === 0) {
        throw new Error("O produto deve ter pelo menos uma etapa de produção definida");
      }

      const docRef = await addDoc(collection(db, "produtos"), {
        refCodigo: produtoForm.refCodigo,
        descricao: produtoForm.descricao,
        categoriaId: produtoForm.categoriaId,
        coresIds: produtoForm.coresIds,
        tamanhosIds: produtoForm.tamanhosIds,
        etapasProducaoIds: produtoForm.etapasProducao || [],
        userId,
        ativo: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      throw error;
    }
  },

  async updateProduto(id: string, produtoForm: ProdutoForm): Promise<void> {
    try {
      // Validar que o produto tem etapas de produção
      if (!produtoForm.etapasProducao || produtoForm.etapasProducao.length === 0) {
        throw new Error("O produto deve ter pelo menos uma etapa de produção definida");
      }

      await updateDoc(doc(db, "produtos", id), {
        refCodigo: produtoForm.refCodigo,
        descricao: produtoForm.descricao,
        categoriaId: produtoForm.categoriaId,
        coresIds: produtoForm.coresIds,
        tamanhosIds: produtoForm.tamanhosIds,
        etapasProducaoIds: produtoForm.etapasProducao || [],
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      throw error;
    }
  },

  async deleteProduto(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "produtos", id));
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      throw error;
    }
  },
};
