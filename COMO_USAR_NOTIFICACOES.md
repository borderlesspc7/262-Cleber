# 🔔 Sistema de Notificações - Guia de Uso

## ✅ Implementação Completa

O sistema de notificações está **totalmente integrado** e funcionando automaticamente em todo o sistema!

---

## 📍 Onde está o NotificationCenter?

O sino de notificações aparece **fixo no header** (canto superior direito) em todas as páginas do sistema.

### Características:
- 🔴 Badge vermelho mostra quantidade de notificações não lidas
- 🔔 Sino pulsante quando há notificações
- 📱 Dropdown com lista completa de notificações
- ✅ Clique para marcar como lida e navegar
- 🗑️ Botão para deletar notificações

---

## 🤖 Notificações Automáticas

O sistema verifica automaticamente **a cada 5 minutos** e cria notificações para:

### 1. ⚠️ Ordens Próximas do Prazo
- **Quando:** Ordem em produção vence em 5 dias ou menos
- **Exemplo:** "OP001 - Camiseta Básica vence em 3 dia(s)"
- **Ação:** Clique para ir para Gestão de Produções

### 2. 💰 Pagamentos Vencendo
- **Quando:** Pagamento pendente vence em 7 dias ou menos
- **Exemplo:** "Facção XYZ - R$ 1.500,00 vence em 5 dia(s)"
- **Ação:** Clique para ir para Financeiro

### 3. 🚨 Pagamentos Vencidos
- **Quando:** Pagamento está atrasado
- **Exemplo:** "Facção ABC - R$ 2.000,00 está 3 dia(s) atrasado"
- **Ação:** Clique para ir para Financeiro

### 4. ⏸️ Etapas Paradas
- **Quando:** Etapa está pausada há mais de 3 dias
- **Exemplo:** "OP002 - Etapa 'Costura' está parada há 4 dia(s)"
- **Ação:** Clique para ir para Gestão de Produções

### 5. ✅ Ordens Concluídas
- **Quando:** Uma ordem é finalizada
- **Exemplo:** "OP003 - Regata Fitness foi finalizada com sucesso!"
- **Ação:** Clique para ir para Ordens de Produções

---

## 🎯 Como Funciona

### Inicialização Automática
Quando você abre o Dashboard, o sistema:
1. Carrega todas as notificações existentes
2. Inicia o monitoramento automático
3. Verifica o sistema a cada 5 minutos
4. Cria notificações novas automaticamente
5. Deleta notificações antigas (mais de 30 dias)

### Inteligência Anti-Duplicação
O sistema **não cria notificações duplicadas**:
- Verifica se já existe notificação não lida para o mesmo item
- Evita spam de notificações repetidas
- Atualiza apenas quando houver mudanças

---

## 🛠️ Arquivos da Implementação

### Estrutura Criada:
```
src/
├── types/
│   └── notification.ts              ✅ Tipos TypeScript
├── services/
│   ├── notificationService.ts       ✅ CRUD de notificações
│   └── notificationMonitorService.ts ✅ Monitoramento automático
├── hooks/
│   └── useNotification.ts           ✅ Hook customizado
├── components/
│   └── notifications/
│       ├── NotificationCenter.tsx   ✅ Componente visual
│       └── NotificationCenter.css   ✅ Estilos
└── utils/
    └── notificationHelpers.ts       ✅ Lógica de verificação
```

### Integrado em:
- ✅ `Layout.tsx` - NotificationCenter no header
- ✅ `DashboardTab.tsx` - Inicia monitoramento

---

## 💡 Personalização

### Alterar Intervalo de Verificação

No `DashboardTab.tsx`, linha 57:
```typescript
notificationMonitor.start(user.uid, 5); // 5 minutos (padrão)
```

Altere para:
```typescript
notificationMonitor.start(user.uid, 10); // 10 minutos
notificationMonitor.start(user.uid, 1);  // 1 minuto (teste)
```

### Alterar Prazos de Alerta

No `notificationHelpers.ts`:

**Ordens próximas do prazo:**
```typescript
// Linha 14: atualmente 5 dias
const cincoDias = new Date(hoje);
cincoDias.setDate(cincoDias.getDate() + 5); // ← Altere aqui
```

**Pagamentos vencendo:**
```typescript
// Linha 69: atualmente 7 dias
const seteDias = new Date(hoje);
seteDias.setDate(seteDias.getDate() + 7); // ← Altere aqui
```

**Etapas paradas:**
```typescript
// Linha 155: atualmente 3 dias
if (diasParada > 3) { // ← Altere aqui
```

---

## 🧪 Como Testar

### 1. Teste Manual Rápido
Execute no console do navegador:
```javascript
// Importar o monitor (já está rodando)
import { notificationMonitor } from './services/notificationMonitorService';

// Forçar verificação imediata
notificationMonitor.forceCheck();
```

### 2. Criar Notificação de Teste
No console:
```javascript
import { notificationService } from './services/notificationService';

await notificationService.createNotification({
  userId: "SEU_USER_ID",
  type: "ordem_prazo",
  title: "🧪 Teste de Notificação",
  message: "Esta é uma notificação de teste!",
  link: "dashboard"
});
```

### 3. Simular Cenários
Para testar alertas, crie:
- **Ordem próxima do prazo:** Crie ordem com dataPrevista para daqui 2 dias
- **Pagamento vencendo:** Crie lançamento com vencimento daqui 3 dias
- **Etapa parada:** Pause uma etapa e altere dataInicio para 5 dias atrás

---

## 📊 Status do Sistema

### ✅ Implementado e Funcionando:
- [x] NotificationCenter visual no header
- [x] Badge com contador de não lidas
- [x] Dropdown com lista completa
- [x] Marcar como lida ao clicar
- [x] Marcar todas como lidas
- [x] Deletar notificação individual
- [x] Navegação automática ao clicar
- [x] Verificação automática a cada 5min
- [x] Anti-duplicação inteligente
- [x] Limpeza automática (30 dias)
- [x] Notificações de ordens próximas do prazo
- [x] Notificações de pagamentos vencendo
- [x] Notificações de pagamentos vencidos
- [x] Notificações de etapas paradas
- [x] Notificações de ordens concluídas

### 🎨 Ícones por Tipo:
- ⚠️ Ordem próxima do prazo → 🟡 Amarelo
- 💰 Pagamento vencendo → 🔴 Vermelho
- 🚨 Pagamento vencido → 🔴 Vermelho
- ⏸️ Etapa parada → 🟠 Laranja
- ✅ Ordem concluída → 🟢 Verde

---

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras:
1. **Push Notifications** - Notificações do navegador mesmo com aba fechada
2. **Email Notifications** - Enviar resumo diário por email
3. **WhatsApp Integration** - Alertas via WhatsApp Business
4. **Som Customizado** - Toque ao receber notificação nova
5. **Filtros** - Filtrar por tipo de notificação
6. **Configurações** - Usuário escolher quais alertas quer receber

---

## 📞 Suporte

O sistema está **100% funcional** e integrado. Todas as notificações são criadas automaticamente e aparecem no sino do header.

**Tempo de verificação:** A cada 5 minutos  
**Retenção:** 30 dias  
**Localização:** Header fixo (todas as páginas)  
**Navegação:** Clique na notificação para ir direto à seção

---

**Data de Implementação:** Janeiro 2026  
**Versão:** 1.0.0  
**Status:** ✅ Produção
