import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Clock,
  Plus,
  Check,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const formatDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const sameDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const loadTasks = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

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

  const monthDays = useMemo(() => {
    const startOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const firstWeekDay = (startOfMonth.getDay() + 6) % 7;
    const calendarStart = new Date(startOfMonth);
    calendarStart.setDate(startOfMonth.getDate() - firstWeekDay);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(calendarStart);
      date.setDate(calendarStart.getDate() + index);
      return date;
    });
  }, [currentMonth]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((task) => {
      const key = formatDateInput(task.scheduledDate);
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [tasks]);

  const selectedDateTasks = useMemo(
    () =>
      tasks
        .filter((task) => sameDate(task.scheduledDate, selectedDate))
        .sort((a, b) => a.time.localeCompare(b.time)),
    [selectedDate, tasks]
  );

  const selectedDateLabel = selectedDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const monthLabel = currentMonth.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const openCreateModalForDate = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
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
            <h3>Agenda</h3>
          </div>
          <p className="agenda-subtitle">Clique duas vezes no dia para criar evento</p>
        </div>
        <button
          className="agenda-add-button"
          onClick={() => openCreateModalForDate(selectedDate)}
          title="Adicionar evento na data selecionada"
        >
          <Plus className="agenda-add-icon" size={20} />
        </button>
      </div>

      <div className="agenda-content">
        <div className="agenda-calendar-toolbar">
          <button
            className="agenda-calendar-nav"
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
              )
            }
            title="Mês anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <strong className="agenda-calendar-month">{monthLabel}</strong>
          <button
            className="agenda-calendar-nav"
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
              )
            }
            title="Próximo mês"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="agenda-calendar-weekdays">
          {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="agenda-calendar-grid">
          {monthDays.map((day) => {
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isSelected = sameDate(day, selectedDate);
            const isToday = sameDate(day, new Date());
            const eventsCount = tasksByDate.get(formatDateInput(day)) ?? 0;

            return (
              <button
                key={day.toISOString()}
                className={`agenda-calendar-day ${isCurrentMonth ? "" : "outside-month"} ${
                  isSelected ? "selected" : ""
                } ${isToday ? "today" : ""}`}
                onClick={() => setSelectedDate(day)}
                onDoubleClick={() => openCreateModalForDate(day)}
                title={`${
                  day.toLocaleDateString("pt-BR")
                } - duplo clique para criar evento`}
              >
                <span>{day.getDate()}</span>
                {eventsCount > 0 && (
                  <small className="agenda-calendar-badge">{eventsCount}</small>
                )}
              </button>
            );
          })}
        </div>

        <div className="agenda-selected-date">
          <strong>{selectedDateLabel}</strong>
          <span>{selectedDateTasks.length} evento(s)</span>
        </div>

        {isLoadingTasks ? (
          <div className="agenda-loading">
            <p>Carregando tarefas...</p>
          </div>
        ) : selectedDateTasks.length === 0 ? (
          <div className="agenda-empty">
            <p>Nenhum evento nesta data</p>
            <p className="agenda-empty-subtitle">
              Dê dois cliques em um dia ou use o botão + para adicionar
            </p>
          </div>
        ) : (
          <div className="agenda-tasks">
            {selectedDateTasks.map((task) => (
              <div
                key={task.id}
                className={`agenda-task ${
                  task.completed ? "task-completed" : ""
                }`}
              >
                <div className="task-content">
                  <div className="task-main">
                    <h4 className="task-description">{task.description}</h4>
                    <div className="task-meta">
                      <span
                        className={`task-priority ${getPriorityColor(
                          task.priority
                        )}`}
                      >
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
                      onClick={() =>
                        handleToggleComplete(task.id, !task.completed)
                      }
                      title={
                        task.completed
                          ? "Marcar como pendente"
                          : "Marcar como concluída"
                      }
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
        initialDate={formatDateInput(selectedDate)}
      />
    </div>
  );
};
