export interface Task {
  id: string;
  description: string;
  time: string;
  priority: "baixa" | "media" | "alta";
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface CreateTaskData {
  description: string;
  time: string;
  priority: "baixa" | "media" | "alta";
}

export interface UpdateTaskData {
  description?: string;
  time?: string;
  priority?: "baixa" | "media" | "alta";
  completed?: boolean;
}
