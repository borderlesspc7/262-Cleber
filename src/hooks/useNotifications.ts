import { useState, useEffect, useCallback } from "react";
import { notificationService } from "../services/notificationService";
import type { Notification } from "../types/notification";

export const useNotifications = (userId: string ) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const loadNotifications = useCallback(async () => {
        if (!userId) return;

        try{
            setLoading(true);
            const [allNotifications, unreadNotifications] = await Promise.all([
                notificationService.getNotificationsByUser(userId),
                notificationService.getUnreadNotifications(userId),
            ])

            setNotifications(allNotifications);
            setUnreadCount(unreadNotifications.length);
        } catch (error) {
            console.error("Erro ao carregar notificações:", error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadNotifications();
        if(userId){
            notificationService.deleteOldNotifications(userId);
        }

        const interval = setInterval(() => {
            if(userId){
                loadNotifications();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [userId, loadNotifications]);

    const markAsRead = async (notificationId: string) => {
        try{
            await notificationService.markAsRead(notificationId);
            await loadNotifications();
        } catch (error) {
            console.error("Erro ao marcar notificação como lida:", error);
        }
    }

    const markAllAsRead = async () => {
        if(!userId) return;
        try{
            await notificationService.markAllAsRead(userId);
            await loadNotifications();
        } catch (error) {
            console.error("Erro ao marcar todas as notificações como lidas:", error);
        }
    }

    const deleteNotification = async (notificationId: string) => {
        try{
            await notificationService.deleteNotification(notificationId);
            await loadNotifications();
        } catch (error) {
            console.error("Erro ao deletar notificação:", error);
        }
    }

    return { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, refresh: loadNotifications};
}
