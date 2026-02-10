/**
 * Remove campos undefined de um objeto antes de salvar no Firestore
 */
export const removeUndefinedFields = <T extends Record<string, any>>(
  obj: T
): Partial<T> => {
  const cleaned: Partial<T> = {};
  
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value !== undefined) {
      cleaned[key as keyof T] = value;
    }
  });
  
  return cleaned;
};

/**
 * Remove campos undefined e null de um objeto
 */
export const removeNullishFields = <T extends Record<string, any>>(
  obj: T
): Partial<T> => {
  const cleaned: Partial<T> = {};
  
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value !== undefined && value !== null) {
      cleaned[key as keyof T] = value;
    }
  });
  
  return cleaned;
};
