/**
 * Formatting utilities for BourseClair
 */

export function formatFCFA(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'N/A';
  }
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('fr-FR').format(rounded);
  return `${formatted} FCFA`;
}

export function formatPercent(value: number | null | undefined, includeSign = true): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  const formatted = value.toFixed(2).replace('.', ',');
  if (includeSign && value > 0) {
    return `+${formatted} %`;
  }
  return `${formatted} %`;
}

export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDateFrench(dateString: string): string {
  if (!dateString) return 'Date inconnue';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatDateShort(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  }).format(date);
}
