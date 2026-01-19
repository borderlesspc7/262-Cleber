import React,  { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, X, AlertCircle, DollarSign, Clock, Package } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotification";
import type { Notification } from "../../types/notification";
import "./NotificationCenter.css";

interface NotificationCenterProps {
    onNavigate: (tab: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
    const {user} = useAuth();
    const {notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification} = useNotifications(user?.uid || "");
    
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if(dropdownRef.current && !dropdownRef.current.contains(event.target as Node)){
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getNotificationIcon = (type: Notification["type"]) => {
        switch(type){
            case "ordem_prazo":
                return <Clock size={20} className="notification-icon warning" />;
              case "pagamento_vencendo":
                return <DollarSign size={20} className="notification-icon danger" />;
              case "etapa_parada":
                return <AlertCircle size={20} className="notification-icon alert" />;
              case "ordem_concluida":
                return <Package size={20} className="notification-icon success" />;
              default:
                return <Bell size={20} className="notification-icon info" />;
        }
    }

    const handleNotificationClick = async (notification: Notification) => {
        if(!notification.read){
            await markAsRead(notification.id);
        }

        if(notification.link && onNavigate){
            onNavigate(notification.link);
            setIsOpen(false);
        }
    }

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    }

    const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>, notificationId: string) => {
        e.stopPropagation();
        await deleteNotification(notificationId);
    }

    const getTimeAgo = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
    
        if (diffMins < 1) return "Agora";
        if (diffMins < 60) return `${diffMins}min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays === 1) return "Ontem";
        if (diffDays < 7) return `${diffDays} dias atrás`;
        return date.toLocaleDateString("pt-BR");
      };
    

      return (
        <div className="notification-center" ref={dropdownRef}>
            <button className="notification-bell" onClick={() => setIsOpen(!isOpen)} aria-label="Notificações">
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <div className="notification-header-title">
                            <Bell size={20} />
                            <h3>Notificações</h3>
                            {unreadCount > 0 && (
                                <span className="unread-count-badge">{unreadCount}</span>
                            )}
                        </div>
                        <div className="notification-header-actions">
                            {unreadCount > 0 && (
                                <button className="mark-all-read-btn" onClick={handleMarkAllAsRead} title="Marcar todas como lidas">
                                    <Check size={20} />
                                </button> 
                            )}
                            <button className="close-dropdown-btn" onClick={() => setIsOpen(false)} title="Fechar">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="notification-content">
                        {loading ? (
                            <div className="notification-loading">
                                <p>Carregando...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="notification-empty">
                                <Bell size={48} />
                                <p>Nenhuma notificação</p>
                            </div>
                        ) : (
                            <div className="notification-list">
                                {notifications.map((notification: Notification) => (
                                    <div  key={notification.id}
                                    className={`notification-item ${
                                      !notification.read ? "unread" : ""
                                    }`}
                                    onClick={() => handleNotificationClick(notification)}>
                                        <div className="notification-item-icon">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="notification-item-content">
                                            <h4 className="notification-item-title">{notification.title}</h4>
                                            <p className="notification-item-message">{notification.message}</p>
                                            <span className="notification-item-time">{getTimeAgo(notification.createdAt)}</span>
                                        </div>
                                        <button className="notification-item-delete" onClick={(e) => handleDelete(e, notification.id)} title="Remover">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      )
}