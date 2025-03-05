const PENDING_QUERY_KEY = "trip-gen-pending-query";

export const savePendingQuery = (query: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(PENDING_QUERY_KEY, query);
  }
};

export const getPendingQuery = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(PENDING_QUERY_KEY);
  }
  return null;
};

export const clearPendingQuery = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(PENDING_QUERY_KEY);
  }
};
