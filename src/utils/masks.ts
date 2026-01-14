/**
 * Utilitários para máscaras de input
 */

/**
 * Máscara para telefone brasileiro
 * Formatos: (11) 9999-9999 ou (11) 99999-9999
 */
export const phoneMask = (value: string): string => {
  if (!value) return "";

  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");

  // Limita a 11 dígitos
  const limited = numbers.substring(0, 11);

  // Aplica a máscara
  if (limited.length <= 10) {
    // (11) 9999-9999
    return limited
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  } else {
    // (11) 99999-9999
    return limited
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }
};

/**
 * Máscara para CEP
 * Formato: 12345-678
 */
export const cepMask = (value: string): string => {
  if (!value) return "";

  const numbers = value.replace(/\D/g, "");
  const limited = numbers.substring(0, 8);

  return limited.replace(/^(\d{5})(\d)/, "$1-$2");
};

/**
 * Máscara para CPF
 * Formato: 123.456.789-01
 */
export const cpfMask = (value: string): string => {
  if (!value) return "";

  const numbers = value.replace(/\D/g, "");
  const limited = numbers.substring(0, 11);

  return limited
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
};

/**
 * Máscara para CNPJ
 * Formato: 12.345.678/0001-90
 */
export const cnpjMask = (value: string): string => {
  if (!value) return "";

  const numbers = value.replace(/\D/g, "");
  const limited = numbers.substring(0, 14);

  return limited
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

/**
 * Máscara para moeda brasileira
 * Formato: R$ 1.234,56
 */
export const currencyMask = (value: string | number): string => {
  if (value === "" || value === null || value === undefined) return "";

  // Converte para string e remove tudo que não é número
  const stringValue = String(value);
  const numbers = stringValue.replace(/\D/g, "");

  // Converte para número e divide por 100
  const numericValue = Number(numbers) / 100;

  // Formata com 2 casas decimais
  return numericValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

/**
 * Remove a máscara de moeda e retorna o número
 */
export const currencyToNumber = (value: string): number => {
  if (!value) return 0;

  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");

  // Converte para número e divide por 100
  return Number(numbers) / 100;
};

/**
 * Máscara para data
 * Formato: 31/12/2024
 */
export const dateMask = (value: string): string => {
  if (!value) return "";

  const numbers = value.replace(/\D/g, "");
  const limited = numbers.substring(0, 8);

  return limited
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
};

/**
 * Máscara para números inteiros (apenas dígitos)
 */
export const integerMask = (value: string): string => {
  if (!value) return "";
  return value.replace(/\D/g, "");
};

/**
 * Máscara para números decimais (com vírgula)
 */
export const decimalMask = (value: string): string => {
  if (!value) return "";

  // Remove tudo que não é número ou vírgula
  let cleaned = value.replace(/[^\d,]/g, "");

  // Permite apenas uma vírgula
  const parts = cleaned.split(",");
  if (parts.length > 2) {
    cleaned = parts[0] + "," + parts.slice(1).join("");
  }

  return cleaned;
};

/**
 * Remove todos os caracteres não numéricos
 */
export const removeNonNumeric = (value: string): string => {
  return value.replace(/\D/g, "");
};

/**
 * Formata número com separador de milhares
 */
export const numberWithThousands = (value: string | number): string => {
  if (!value) return "0";

  const stringValue = String(value).replace(/\D/g, "");
  const numericValue = Number(stringValue);

  return numericValue.toLocaleString("pt-BR");
};
