/**
 * Formata uma data para o formato YYYY-MM-DD
 */
export const formatDateToISO = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

/**
 * Formata uma data para o formato dd/MM/yyyy
 */
export const formatDateToBR = (date: Date): string => {
  return new Intl.DateTimeFormat("pt-BR").format(date);
};

/**
 * Calcula a diferença em dias entre duas datas
 */
export const getDaysDifference = (date1: Date, date2: Date): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const diff = d1.getTime() - d2.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Retorna a data atual no formato YYYY-MM-DD
 */
export const getTodayISO = (): string => {
  return formatDateToISO(new Date());
};
