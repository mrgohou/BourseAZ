import { Company, Quote, FinancialPeriod, Dividend } from '../types';
import { DEMO_COMPANIES } from '../data/demo-data';
import { auth } from './firebase';

export interface MarketDataApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  provider?: string;
  count?: number;
}

async function getAdminHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('Failed to retrieve Firebase ID token:', err);
  }
  return headers;
}

export async function fetchPublicCompanies(): Promise<{
  companies: Company[];
  provider: string;
  configError?: string;
}> {
  try {
    const res = await fetch('/api/public/companies', { signal: AbortSignal.timeout(8000) });
    const json = await res.json();

    if (!res.ok || !json.success) {
      if (json.error === 'CONFIGURATION_ERROR') {
        return {
          companies: DEMO_COMPANIES,
          provider: json.provider || 'demo',
          configError: json.message || 'Source de données BRVM non configurée.',
        };
      }
      return {
        companies: DEMO_COMPANIES,
        provider: 'demo',
      };
    }

    const fetchedCompanies = (json.data && json.data.length > 0) ? json.data : DEMO_COMPANIES;
    return {
      companies: fetchedCompanies,
      provider: json.provider || 'demo',
    };
  } catch (err: any) {
    console.info('[API Client] Utilisation du flux local optimisé BRVM:', err.message);
    return {
      companies: DEMO_COMPANIES,
      provider: 'demo',
    };
  }
}

export async function fetchCompanyQuote(symbol: string): Promise<Quote | null> {
  try {
    const res = await fetch(`/api/public/companies/${symbol}/quote`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

export async function fetchCompanyFinancials(symbol: string): Promise<FinancialPeriod[]> {
  try {
    const res = await fetch(`/api/public/companies/${symbol}/financials`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch {
    return [];
  }
}

export async function fetchCompanyDividends(symbol: string): Promise<Dividend[]> {
  try {
    const res = await fetch(`/api/public/companies/${symbol}/dividends`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch {
    return [];
  }
}

export async function fetchAdminDataReviews(limit = 50) {
  try {
    const headers = await getAdminHeaders();
    const res = await fetch(`/api/admin/data-review?limit=${limit}`, {
      headers,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function approveAdminReviewItem(id: string, notes?: string) {
  const headers = await getAdminHeaders();
  const res = await fetch(`/api/admin/data-review/${id}/approve`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ reviewer: 'Admin BourseFacile', notes }),
  });
  return await res.json();
}

export async function rejectAdminReviewItem(id: string, notes?: string) {
  const headers = await getAdminHeaders();
  const res = await fetch(`/api/admin/data-review/${id}/reject`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ reviewer: 'Admin BourseFacile', notes }),
  });
  return await res.json();
}

export async function submitAdminImport(content: string, filename?: string, format: 'csv' | 'json' = 'csv') {
  const headers = await getAdminHeaders();
  const res = await fetch('/api/admin/imports', {
    method: 'POST',
    headers,
    body: JSON.stringify({ content, filename, format }),
  });
  return await res.json();
}
