export interface Task {
  id: string;
  description: string;
  time: string;
  scheduledDate: Date;
  priority: "baixa" | "media" | "alta";
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface CreateTaskData {
  description: string;
  time: string;
  scheduledDate: string;
  priority: "baixa" | "media" | "alta";
}

export interface UpdateTaskData {
  description?: string;
  time?: string;
  scheduledDate?: string;
  priority?: "baixa" | "media" | "alta";
  completed?: boolean;
}
