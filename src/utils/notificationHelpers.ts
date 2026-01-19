import { notificationService } from "../services/notificationService";
import type { ProductionOrder } from "../types/order";
import type { LancamentoFinanceiro } from "../types/financeiro";
import type { ProductionOrderProgress } from "../types/productionProgress";

// Verificar e criar notificações para ordens próximas do prazo
export const checkOrdersDeadline = async (
  orders: ProductionOrder[],
  userId: string
): Promise<void> => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const cincoDias = new Date(hoje);
    cincoDias.setDate(cincoDias.getDate() + 5);

    // Buscar notificações existentes para não duplicar
    const notificacoesExistentes = await notificationService.getNotificationsByUser(userId);
    const notificacoesOrdemPrazo = notificacoesExistentes.filter(
      (n) => n.type === "ordem_prazo" && !n.read
    );

    for (const order of orders) {
      if (order.status === "em_producao") {
        const dataPrevista = new Date(order.dataPrevista);
        dataPrevista.setHours(0, 0, 0, 0);

        // Se está próximo do prazo (5 dias ou menos)
        if (dataPrevista >= hoje && dataPrevista <= cincoDias) {
          // Verificar se já existe notificação para esta ordem
          const jaExiste = notificacoesOrdemPrazo.some(
            (n) => n.metadata?.ordemCodigo === order.codigo
          );

          if (!jaExiste) {
            const diasRestantes = Math.ceil(
              (dataPrevista.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
            );

            await notificationService.createNotification({
              userId,
              type: "ordem_prazo",
              title: "⚠️ Ordem Próxima do Prazo",
              message: `${order.codigo} - ${order.produtoDescricao} vence em ${diasRestantes} dia(s)`,
              link: "gestaoProducoes",
              metadata: {
                ordemId: order.id,
                ordemCodigo: order.codigo,
                dias: diasRestantes,
              },
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Erro ao verificar prazos das ordens:", error);
  }
};

// Verificar pagamentos vencendo
export const checkPaymentsDue = async (
  lancamentos: LancamentoFinanceiro[],
  userId: string
): Promise<void> => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const seteDias = new Date(hoje);
    seteDias.setDate(seteDias.getDate() + 7);

    const notificacoesExistentes = await notificationService.getNotificationsByUser(userId);
    const notificacoesPagamento = notificacoesExistentes.filter(
      (n) => n.type === "pagamento_vencendo" && !n.read
    );

    for (const lancamento of lancamentos) {
      if (lancamento.status === "pendente" || lancamento.status === "atrasado") {
        const dataVencimento = new Date(lancamento.dataVencimento);
        dataVencimento.setHours(0, 0, 0, 0);

        // Pagamento vencendo em até 7 dias
        if (dataVencimento >= hoje && dataVencimento <= seteDias) {
          const jaExiste = notificacoesPagamento.some(
            (n) => n.metadata?.lancamentoId === lancamento.id
          );

          if (!jaExiste) {
            const diasRestantes = Math.ceil(
              (dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
            );

            await notificationService.createNotification({
              userId,
              type: "pagamento_vencendo",
              title: "💰 Pagamento Vencendo",
              message: `${lancamento.faccaoNome} - ${lancamento.valor.toLocaleString(
                "pt-BR",
                { style: "currency", currency: "BRL" }
              )} vence em ${diasRestantes} dia(s)`,
              link: "financeiro",
              metadata: {
                lancamentoId: lancamento.id,
                valor: lancamento.valor,
                dias: diasRestantes,
              },
            });
          }
        }

        // Pagamento já vencido
        if (dataVencimento < hoje && lancamento.status === "atrasado") {
          const jaExiste = notificacoesPagamento.some(
            (n) =>
              n.metadata?.lancamentoId === lancamento.id &&
              n.title.includes("Vencido")
          );

          if (!jaExiste) {
            const diasAtrasado = Math.ceil(
              (hoje.getTime() - dataVencimento.getTime()) / (1000 * 60 * 60 * 24)
            );

            await notificationService.createNotification({
              userId,
              type: "pagamento_vencendo",
              title: "🚨 Pagamento Vencido",
              message: `${lancamento.faccaoNome} - ${lancamento.valor.toLocaleString(
                "pt-BR",
                { style: "currency", currency: "BRL" }
              )} está ${diasAtrasado} dia(s) atrasado`,
              link: "financeiro",
              metadata: {
                lancamentoId: lancamento.id,
                valor: lancamento.valor,
                dias: diasAtrasado,
              },
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Erro ao verificar pagamentos:", error);
  }
};

// Verificar etapas paradas há muito tempo
export const checkStoppedStages = async (
  progressos: ProductionOrderProgress[],
  orders: ProductionOrder[],
  userId: string
): Promise<void> => {
  try {
    const hoje = new Date();
    const notificacoesExistentes = await notificationService.getNotificationsByUser(userId);
    const notificacoesEtapa = notificacoesExistentes.filter(
      (n) => n.type === "etapa_parada" && !n.read
    );

    for (const progresso of progressos) {
      const ordem = orders.find((o) => o.id === progresso.ordemProducaoId);
      if (!ordem || ordem.status !== "em_producao") continue;

      for (const etapa of progresso.etapas) {
        if (etapa.status === "pausada" && etapa.dataInicio) {
          const dataInicio = new Date(etapa.dataInicio);
          const diasParada = Math.ceil(
            (hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Se está parada há mais de 3 dias
          if (diasParada > 3) {
            const jaExiste = notificacoesEtapa.some(
              (n) =>
                n.metadata?.ordemCodigo === ordem.codigo &&
                n.message.includes(etapa.etapaNome)
            );

            if (!jaExiste) {
              await notificationService.createNotification({
                userId,
                type: "etapa_parada",
                title: "⏸️ Etapa Parada",
                message: `${ordem.codigo} - Etapa "${etapa.etapaNome}" está parada há ${diasParada} dia(s)`,
                link: "gestaoProducoes",
                metadata: {
                  ordemId: ordem.id,
                  ordemCodigo: ordem.codigo,
                  dias: diasParada,
                },
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Erro ao verificar etapas paradas:", error);
  }
};

// Notificar quando ordem for concluída
export const notifyOrderCompleted = async (
  order: ProductionOrder,
  userId: string
): Promise<void> => {
  try {
    const notificacoesExistentes = await notificationService.getNotificationsByUser(userId);
    const jaCriada = notificacoesExistentes.some(
      (n) =>
        n.type === "ordem_concluida" &&
        n.metadata?.ordemCodigo === order.codigo &&
        !n.read
    );

    if (!jaCriada) {
      await notificationService.createNotification({
        userId,
        type: "ordem_concluida",
        title: "✅ Ordem Concluída",
        message: `${order.codigo} - ${order.produtoDescricao} foi finalizada com sucesso!`,
        link: "ordemProducoes",
        metadata: {
          ordemId: order.id,
          ordemCodigo: order.codigo,
        },
      });
    }
  } catch (error) {
    console.error("Erro ao notificar ordem concluída:", error);
  }
};

// Função principal que executa todas as verificações
export const runAllNotificationChecks = async (
  userId: string,
  data: {
    orders: ProductionOrder[];
    lancamentos: LancamentoFinanceiro[];
    progressos: ProductionOrderProgress[];
  }
): Promise<void> => {
  try {
    await Promise.all([
      checkOrdersDeadline(data.orders, userId),
      checkPaymentsDue(data.lancamentos, userId),
      checkStoppedStages(data.progressos, data.orders, userId),
    ]);
  } catch (error) {
    console.error("Erro ao executar verificações de notificação:", error);
  }
};
