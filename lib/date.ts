import { parse, format, isValid } from "date-fns";

export const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";

  const formats = [
    "dd-MM-yyyy HH:mm:ss",  // e.g., 15-11-2025 11:59:52
    "yyyy-MM-dd HH:mm:ss",  // e.g., 2025-11-15 11:59:52
    "dd-MMM-yyyy HH:mm:ss", // e.g., 15-Nov-2025 11:59:52
  ];

  for (const fmt of formats) {
    const d = parse(dateString, fmt, new Date());
    if (isValid(d)) return format(d, "MMM d, yyyy");
  }

  return "Invalid Date";
};

export const formatTime = (dateString: string) => {
  if (!dateString) return "N/A";

  const formats = [
    "dd-MM-yyyy HH:mm:ss",
    "yyyy-MM-dd HH:mm:ss",
    "dd-MMM-yyyy HH:mm:ss",
  ];

  for (const fmt of formats) {
    const d = parse(dateString, fmt, new Date());
    if (isValid(d)) return format(d, "hh:mm a");
  }

  return "Invalid Time";
};
