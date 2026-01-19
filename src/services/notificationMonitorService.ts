import { orderService } from "./orderService";
import { financeiroService } from "./financeiroService";
import { productionProgressService } from "./productionProgressService";
import { runAllNotificationChecks } from "../utils/notificationHelpers";

/**
 * Serviço de monitoramento automático de notificações
 * Executa verificações periódicas em todo o sistema
 */
export class NotificationMonitorService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private userId: string | null = null;

  /**
   * Inicia o monitoramento automático
   * @param userId - ID do usuário logado
   * @param intervalMinutes - Intervalo em minutos (padrão: 5)
   */
  start(userId: string, intervalMinutes: number = 5): void {
    if (this.isRunning) {
      console.log("Monitoramento de notificações já está em execução");
      return;
    }

    this.userId = userId;
    this.isRunning = true;

    console.log(
      `🔔 Iniciando monitoramento de notificações (intervalo: ${intervalMinutes}min)`
    );

    // Executar imediatamente na primeira vez
    this.runChecks();

    // Configurar intervalo
    const intervalMs = intervalMinutes * 60 * 1000;
    this.intervalId = setInterval(() => {
      this.runChecks();
    }, intervalMs);
  }

  /**
   * Para o monitoramento automático
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.userId = null;
    console.log("🔕 Monitoramento de notificações parado");
  }

  /**
   * Executa todas as verificações de notificação
   */
  private async runChecks(): Promise<void> {
    if (!this.userId) {
      console.error("UserId não definido para monitoramento");
      return;
    }

    try {
      console.log("🔍 Executando verificações de notificação...");

      // Buscar dados necessários
      const [orders, progressos] = await Promise.all([
        orderService.getOrders(this.userId),
        productionProgressService.getAllProgress(this.userId),
      ]);

      // Buscar lançamentos financeiros
      const [pendentes, pagos] = await Promise.all([
        financeiroService.getLancamentosPendentes(this.userId),
        financeiroService.getLancamentosPagos(this.userId),
      ]);

      const lancamentos = [...pendentes, ...pagos];

      // Executar todas as verificações
      await runAllNotificationChecks(this.userId, {
        orders,
        lancamentos,
        progressos,
      });

      console.log("✅ Verificações de notificação concluídas");
    } catch (error) {
      console.error("❌ Erro ao executar verificações de notificação:", error);
    }
  }

  /**
   * Força execução imediata das verificações
   */
  async forceCheck(): Promise<void> {
    await this.runChecks();
  }

  /**
   * Verifica se o monitoramento está ativo
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

// Instância global do serviço
export const notificationMonitor = new NotificationMonitorService();
