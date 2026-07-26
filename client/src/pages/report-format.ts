// Format every report amount with the shop's requested rupee label and comma grouping.
export const formatRs = (amount: number): string => `Rs ${Math.round(amount).toLocaleString('en-IN')}`;

// Return the current calendar month in the value format accepted by report endpoints.
export const currentMonth = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
};

// Format a stored ISO date for the owner's local calendar without exposing a wide table.
export const formatDate = (date: string): string => new Date(date).toLocaleDateString();