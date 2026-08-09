import { Company, Quote, FinancialPeriod, Dividend } from '../types';

export interface MarketDataApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  provider?: string;
  count?: number;
}

export async function fetchPublicCompanies(): Promise<{
  companies: Company[];
  provider: string;
  configError?: string;
}> {
  try {
    const res = await fetch('/api/public/companies');
    const json = await res.json();

    if (!res.ok || !json.success) {
      if (json.error === 'CONFIGURATION_ERROR') {
        return {
          companies: [],
          provider: json.provider || 'unknown',
          configError: json.message || 'Source de données BRVM non configurée.',
        };
      }
      throw new Error(json.message || 'Erreur lors de la récupération des données.');
    }

    return {
      companies: json.data || [],
      provider: json.provider || 'demo',
    };
  } catch (err: any) {
    console.warn('[API Client] Erreur réseau / API, bascule sur mode de secours local:', err.message);
    return {
      companies: [],
      provider: 'demo',
      configError: err.message,
    };
  }
}

export async function fetchCompanyQuote(symbol: string): Promise<Quote | null> {
  try {
    const res = await fetch(`/api/public/companies/${symbol}/quote`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

export async function fetchCompanyFinancials(symbol: string): Promise<FinancialPeriod[]> {
  try {
    const res = await fetch(`/api/public/companies/${symbol}/financials`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch {
    return [];
  }
}

export async function fetchCompanyDividends(symbol: string): Promise<Dividend[]> {
  try {
    const res = await fetch(`/api/public/companies/${symbol}/dividends`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch {
    return [];
  }
}

export async function fetchAdminDataReviews() {
  try {
    const res = await fetch('/api/admin/data-review');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function approveAdminReviewItem(id: string, notes?: string) {
  const res = await fetch(`/api/admin/data-review/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewer: 'Admin BourseClair', notes }),
  });
  return await res.json();
}

export async function rejectAdminReviewItem(id: string, notes?: string) {
  const res = await fetch(`/api/admin/data-review/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewer: 'Admin BourseClair', notes }),
  });
  return await res.json();
}

export async function submitAdminImport(content: string, filename?: string, format: 'csv' | 'json' = 'csv') {
  const res = await fetch('/api/admin/imports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, filename, format }),
  });
  return await res.json();
}
