import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
    orderBy,
    limit,
    Timestamp,
    deleteDoc,
  } from "firebase/firestore";
  import { db } from "../lib/firebaseconfig";
  import type { Notification, CreateNotificationPayload } from "../types/notification";
  
  const COLLECTION = "notifications";
  
  export const notificationService = {
    // Criar notificação
    async createNotification(
      payload: CreateNotificationPayload
    ): Promise<Notification> {
      try {
        const now = new Date();
        const notificationRef = await addDoc(collection(db, COLLECTION), {
          ...payload,
          read: false,
          createdAt: Timestamp.fromDate(now),
        });
  
        return {
          id: notificationRef.id,
          ...payload,
          read: false,
          createdAt: now,
        };
      } catch (error) {
        console.error("Erro ao criar notificação:", error);
        throw new Error("Erro ao criar notificação");
      }
    },
  
    // Buscar notificações do usuário
    async getNotificationsByUser(userId: string): Promise<Notification[]> {
      try {
        const q = query(
          collection(db, COLLECTION),
          where("userId", "==", userId),
          orderBy("createdAt", "desc"),
          limit(50) // Últimas 50 notificações
        );
  
        const querySnapshot = await getDocs(q);
        const notifications: Notification[] = [];
  
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          notifications.push({
            id: docSnapshot.id,
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            read: data.read,
            link: data.link,
            metadata: data.metadata,
            createdAt: data.createdAt.toDate(),
          });
        });
  
        return notifications;
      } catch (error) {
        console.error("Erro ao buscar notificações:", error);
        throw new Error("Erro ao buscar notificações");
      }
    },
  
    // Buscar apenas não lidas
    async getUnreadNotifications(userId: string): Promise<Notification[]> {
      try {
        const q = query(
          collection(db, COLLECTION),
          where("userId", "==", userId),
          where("read", "==", false),
          orderBy("createdAt", "desc")
        );
  
        const querySnapshot = await getDocs(q);
        const notifications: Notification[] = [];
  
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          notifications.push({
            id: docSnapshot.id,
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            read: data.read,
            link: data.link,
            metadata: data.metadata,
            createdAt: data.createdAt.toDate(),
          });
        });
  
        return notifications;
      } catch (error) {
        console.error("Erro ao buscar notificações não lidas:", error);
        throw new Error("Erro ao buscar notificações não lidas");
      }
    },
  
    // Marcar como lida
    async markAsRead(notificationId: string): Promise<void> {
      try {
        const notificationRef = doc(db, COLLECTION, notificationId);
        await updateDoc(notificationRef, {
          read: true,
        });
      } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
        throw new Error("Erro ao marcar notificação como lida");
      }
    },
  
    // Marcar todas como lidas
    async markAllAsRead(userId: string): Promise<void> {
      try {
        const q = query(
          collection(db, COLLECTION),
          where("userId", "==", userId),
          where("read", "==", false)
        );
  
        const querySnapshot = await getDocs(q);
        const updatePromises: Promise<void>[] = [];
  
        querySnapshot.forEach((docSnapshot) => {
          updatePromises.push(
            updateDoc(doc(db, COLLECTION, docSnapshot.id), { read: true })
          );
        });
  
        await Promise.all(updatePromises);
      } catch (error) {
        console.error("Erro ao marcar todas como lidas:", error);
        throw new Error("Erro ao marcar todas como lidas");
      }
    },
  
    // Deletar notificação
    async deleteNotification(notificationId: string): Promise<void> {
      try {
        await deleteDoc(doc(db, COLLECTION, notificationId));
      } catch (error) {
        console.error("Erro ao deletar notificação:", error);
        throw new Error("Erro ao deletar notificação");
      }
    },
  
    // Deletar notificações antigas (mais de 30 dias)
    async deleteOldNotifications(userId: string): Promise<void> {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
        const q = query(
          collection(db, COLLECTION),
          where("userId", "==", userId)
        );
  
        const querySnapshot = await getDocs(q);
        const deletePromises: Promise<void>[] = [];
  
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          const createdAt = data.createdAt.toDate();
  
          if (createdAt < thirtyDaysAgo) {
            deletePromises.push(deleteDoc(doc(db, COLLECTION, docSnapshot.id)));
          }
        });
  
        await Promise.all(deletePromises);
      } catch (error) {
        console.error("Erro ao deletar notificações antigas:", error);
      }
    },
  };