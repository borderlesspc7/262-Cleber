import React, { useState, useEffect } from "react";
import { Clock, Plus, Check, Edit, Trash2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { taskService } from "../../services/taskService";
import { TaskModal } from "./TaskModal";
import type { Task, CreateTaskData } from "../../types/task";
import "./AgendaCard.css";

export const AgendaCard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  const loadTasks = async () => {
    if (!user) return;
    
    try {
      setIsLoadingTasks(true);
      const userTasks = await taskService.getTasksByUser(user.uid);
      setTasks(userTasks);
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user]);

  const handleCreateTask = async (taskData: CreateTaskData) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      await taskService.createTask(user.uid, taskData);
      await loadTasks(); // Recarregar a lista
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      await taskService.toggleTaskCompletion(taskId, completed);
      await loadTasks(); // Recarregar a lista
    } catch (error) {
      console.error("Erro ao alterar status da tarefa:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;
    
    try {
      await taskService.deleteTask(taskId);
      await loadTasks(); // Recarregar a lista
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta":
        return "task-priority-high";
      case "media":
        return "task-priority-medium";
      case "baixa":
        return "task-priority-low";
      default:
        return "task-priority-medium";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "alta":
        return "Alta";
      case "media":
        return "Média";
      case "baixa":
        return "Baixa";
      default:
        return "Média";
    }
  };

  return (
    <div className="agenda-card">
      <div className="agenda-header">
        <div className="agenda-title-section">
          <div className="agenda-title">
            <Clock className="agenda-icon" size={20} />
            <h3>Agenda do Dia</h3>
          </div>
          <p className="agenda-subtitle">
            Suas tarefas e compromissos de hoje
          </p>
        </div>
        <button
          className="agenda-add-button"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="agenda-add-icon" size={20} />
        </button>
      </div>

      <div className="agenda-content">
        {isLoadingTasks ? (
          <div className="agenda-loading">
            <p>Carregando tarefas...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="agenda-empty">
            <p>Nenhuma tarefa cadastrada</p>
            <p className="agenda-empty-subtitle">
              Clique no botão + para adicionar uma nova tarefa
            </p>
          </div>
        ) : (
          <div className="agenda-tasks">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`agenda-task ${task.completed ? "task-completed" : ""}`}
              >
                <div className="task-content">
                  <div className="task-main">
                    <h4 className="task-description">{task.description}</h4>
                    <div className="task-meta">
                      <span className={`task-priority ${getPriorityColor(task.priority)}`}>
                        {getPriorityText(task.priority)}
                      </span>
                      <span className="task-time">{task.time}</span>
                    </div>
                  </div>
                  <div className="task-actions">
                    <button
                      className={`task-action task-complete ${
                        task.completed ? "task-completed-icon" : ""
                      }`}
                      onClick={() => handleToggleComplete(task.id, !task.completed)}
                      title={task.completed ? "Marcar como pendente" : "Marcar como concluída"}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      className="task-action task-edit"
                      title="Editar tarefa"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className="task-action task-delete"
                      onClick={() => handleDeleteTask(task.id)}
                      title="Excluir tarefa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTask}
        isLoading={isLoading}
      />
    </div>
  );
};
