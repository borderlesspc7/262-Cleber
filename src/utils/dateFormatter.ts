/**
 * Formata uma data para o formato YYYY-MM-DD
 */
export const formatDateToISO = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function toLocalDate(input: Date | string | number): Date | null {
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (DATE_ONLY_REGEX.test(trimmed)) {
      const [y, m, day] = trimmed.split("-").map(Number);
      const d = new Date(y, m - 1, day);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Data no formato dd/MM/yyyy (calendário local). Aceita Date, ISO string ou "YYYY-MM-DD".
 */
export function formatDateBR(
  input: Date | string | number | null | undefined,
  fallback = "--"
): string {
  if (input === null || input === undefined) return fallback;
  const d = toLocalDate(input);
  if (!d) return fallback;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/**
 * @deprecated Use formatDateBR — mesmo comportamento com nome mais claro
 */
export const formatDateToBR = (date: Date): string => {
  return formatDateBR(date);
};

/**
 * Data e hora no padrão brasileiro (dd/MM/yyyy HH:mm)
 */
export function formatDateTimeBR(
  input: Date | string | number | null | undefined,
  fallback = "--"
): string {
  if (input === null || input === undefined) return fallback;
  const d = toLocalDate(input);
  if (!d) return fallback;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Calcula a diferença em dias entre duas datas
 */
export const getDaysDifference = (date1: Date, date2: Date): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const diff = d1.getTime() - d2.getTime();
  const diffDays = diff / (1000 * 60 * 60 * 24);
  // Se a diferença é positiva, arredonda pra cima. Se é negativa, pra baixo.
  return diff >= 0 ? Math.ceil(diffDays) : Math.floor(diffDays);
};

/**
 * Retorna a data atual no formato YYYY-MM-DD
 */
export const getTodayISO = (): string => {
  return formatDateToISO(new Date());
};
