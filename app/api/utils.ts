import { createClient } from "@supabase/supabase-js";

const requireEnvVar = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is missing`);
  }
  return value;
};

// Supabase client initialization
const supabase = await createClient(
  requireEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnvVar("NEXT_PUBLIC_SUPABASE_KEY")
);

export const getSessionMessages = async (sessionId: string) => {
  const { data, error } = await supabase
    .from("messages")
    .select()
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
};

// Utility function to convert snake_case to camelCase
export const toCamelCase = (str: string): string => {
  return str.replace(/[_][a-z]/g, (match) => match.charAt(1).toUpperCase());
};

// List of fields that should be converted to Date objects
const DATE_FIELDS = [
  "created_at",
  "updated_at",
  "createdAt",
  "updatedAt",
  "date",
  "timestamp",
];

// Check if a string is a valid ISO date
const isISODate = (str: string): boolean => {
  const isoDateRegex =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:?\d{2})?$/;
  return isoDateRegex.test(str);
};

// Convert value to Date if it's a date field
const convertToDateIfNeeded = (key: string, value: any): any => {
  if (
    DATE_FIELDS.includes(key) &&
    typeof value === "string" &&
    isISODate(value)
  ) {
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toISOString();
  }
  return value;
};

// Recursively transform object keys from snake_case to camelCase and handle dates
export const transformKeys = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(transformKeys);
  }

  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        const camelKey = toCamelCase(key);
        const transformedValue = transformKeys(value);
        return [camelKey, convertToDateIfNeeded(key, transformedValue)];
      })
    );
  }

  return obj;
};
