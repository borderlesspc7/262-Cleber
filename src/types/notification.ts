export type NotificationType = 
| "ordem_prazo"
| "pagamento_vencendo"
| "etapa_parada"
| "tarefa_atribuida"
| "ordem_concluida";

export interface Notification {
id: string;
userId: string;
type: NotificationType;
title: string;
message: string;
read: boolean;
link?: string; 
createdAt: Date;
metadata?: {
  ordemId?: string;
  ordemCodigo?: string;
  lancamentoId?: string;
  valor?: number;
  dias?: number;
};
}

export interface CreateNotificationPayload {
userId: string;
type: NotificationType;
title: string;
message: string;
link?: string;
metadata?: Notification['metadata'];
}