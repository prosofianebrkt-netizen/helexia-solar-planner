
export const COLORS = {
  HELEXIA_BLUE: '#003d5b',
  HELEXIA_GREEN: '#a4cd39',
  PHASES: {
    NEGOTIATION: '#f59e0b',
    URBANISME: '#d1dce5',
    CRE: '#e11d48',
    BAIL: '#8b5cf6',
    RACCORDEMENT: '#608ba1',
    CONSTRUCTION: '#328e77',
    EXPLOITATION: '#0a4a69',
  }
};

export const RESTRICTED_MONTHS = [0, 3, 7]; // Janvier, Avril, Août

export const addMonths = (date: Date, months: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + Math.floor(months));
  // Handle half months if needed, but for PV planning we stay mostly on full months
  if (months % 1 !== 0) {
    d.setDate(d.getDate() + 15);
  }
  return d;
};

export const diffMonths = (d1: Date, d2: Date): number => {
  return (d2.getFullYear() - d1.getFullYear()) * 12 + d2.getMonth() - d1.getMonth();
};

export const formatMonth = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }).toUpperCase();
};
