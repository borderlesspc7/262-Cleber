import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebaseconfig";
import type { Company } from "../types/company";

const COMPANY_DOC_ID = "company_info";

export const companyService = {
  // Buscar informações da empresa
  async getCompanyInfo(): Promise<Company | null> {
    try {
      const docRef = doc(db, "company", COMPANY_DOC_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Company;
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar informações da empresa:", error);
      throw error;
    }
  },

  // Salvar/atualizar informações da empresa
  async saveCompanyInfo(companyData: Omit<Company, "id">): Promise<void> {
    try {
      const docRef = doc(db, "company", COMPANY_DOC_ID);
      await setDoc(
        docRef,
        {
          ...companyData,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Erro ao salvar informações da empresa:", error);
      throw error;
    }
  },

  // Upload de logo
  async uploadLogo(file: File): Promise<string> {
    try {
      const storageRef = ref(
        storage,
        `company/logo_${Date.now()}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Erro ao fazer upload da logo:", error);
      throw error;
    }
  },
};
