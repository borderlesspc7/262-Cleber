import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebaseconfig";
import type { Task, CreateTaskData, UpdateTaskData } from "../types/task";

export const taskService = {
  async createTask(userId: string, taskData: CreateTaskData): Promise<Task> {
    try {
      const now = new Date();
      const taskRef = await addDoc(collection(db, "tasks"), {
        ...taskData,
        completed: false,
        userId,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });

      return {
        id: taskRef.id,
        ...taskData,
        completed: false,
        userId,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      throw new Error("Erro ao criar tarefa");
    }
  },

  async getTasksByUser(userId: string): Promise<Task[]> {
    try {
      // Primeiro, buscar todas as tarefas do usuário
      const q = query(collection(db, "tasks"), where("userId", "==", userId));

      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          description: data.description,
          time: data.time,
          priority: data.priority,
          completed: data.completed,
          userId: data.userId,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        });
      });

      // Ordenar localmente por horário
      return tasks.sort((a, b) => a.time.localeCompare(b.time));
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
      throw new Error("Erro ao buscar tarefas");
    }
  },

  async updateTask(taskId: string, updateData: UpdateTaskData): Promise<void> {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        ...updateData,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      throw new Error("Erro ao atualizar tarefa");
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
    } catch (error) {
      console.error("Erro ao deletar tarefa:", error);
      throw new Error("Erro ao deletar tarefa");
    }
  },

  async toggleTaskCompletion(
    taskId: string,
    completed: boolean
  ): Promise<void> {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        completed,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error("Erro ao alterar status da tarefa:", error);
      throw new Error("Erro ao alterar status da tarefa");
    }
  },

  async deleteOldTasks(userId: string): Promise<void> {
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const q = query(collection(db, "tasks"), where("userId", "==", userId));

      const querySnapshot = await getDocs(q);
      const deletePromises: Promise<void>[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const taskDate = data.createdAt.toDate();
        taskDate.setHours(0, 0, 0, 0);

        if (taskDate.getTime() < hoje.getTime()) {
          deletePromises.push(deleteDoc(doc(db, "tasks", docSnapshot.id)));
        }
      });

      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Erro ao deletar tarefas antigas:", error);
      throw new Error("Erro ao deletar tarefas antigas");
    }
  },
};
