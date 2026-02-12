/**
 * Remove campos undefined de um objeto antes de salvar no Firestore
 */
export const removeUndefinedFields = <T extends object>(obj: T): Partial<T> => {
  const cleaned: Partial<T> = {};

  Object.keys(obj as Record<string, unknown>).forEach((key) => {
    const value = (obj as Record<string, unknown>)[key];
    if (value !== undefined) {
      cleaned[key as keyof T] = value as T[keyof T];
    }
  });

  return cleaned;
};

/**
 * Remove campos undefined e null de um objeto
 */
export const removeNullishFields = <T extends object>(obj: T): Partial<T> => {
  const cleaned: Partial<T> = {};

  Object.keys(obj as Record<string, unknown>).forEach((key) => {
    const value = (obj as Record<string, unknown>)[key];
    if (value !== undefined && value !== null) {
      cleaned[key as keyof T] = value as T[keyof T];
    }
  });

  return cleaned;
};
