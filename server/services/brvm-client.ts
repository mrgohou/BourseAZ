export interface BrvmClientOptions {
  baseUrl?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export class BrvmClient {
  private baseUrl: string;
  private apiKey?: string;
  private username?: string;
  private password?: string;
  private timeoutMs: number;
  private maxRetries: number;
  private lastRequestTime = 0;
  private minIntervalMs = 100; // Rate limit: max 10 requests per second

  constructor(options?: BrvmClientOptions) {
    this.baseUrl = options?.baseUrl || process.env.BRVM_API_BASE_URL || '';
    this.apiKey = options?.apiKey || process.env.BRVM_API_KEY;
    this.username = options?.username || process.env.BRVM_USERNAME;
    this.password = options?.password || process.env.BRVM_PASSWORD;
    this.timeoutMs = options?.timeoutMs || 8000;
    this.maxRetries = options?.maxRetries || 2;
  }

  public isConfigured(): boolean {
    return Boolean(this.baseUrl && this.baseUrl.trim().length > 0);
  }

  private maskSecrets(str: string): string {
    if (!str) return str;
    let masked = str;
    if (this.apiKey) masked = masked.replace(new RegExp(this.apiKey, 'g'), '***API_KEY_HIDDEN***');
    if (this.password) masked = masked.replace(new RegExp(this.password, 'g'), '***PASSWORD_HIDDEN***');
    return masked;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      await new Promise(resolve => setTimeout(resolve, this.minIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  public async fetchWithRetry<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error(
        'Erreur de configuration BRVM API: BRVM_API_BASE_URL et les identifiants doivent être définis.'
      );
    }

    await this.enforceRateLimit();

    const fullUrl = `${this.baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.apiKey) {
      headers['X-API-KEY'] = this.apiKey;
    } else if (this.username && this.password) {
      const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= this.maxRetries) {
      attempt++;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        console.log(
          `[BRVM Client] [Tentative ${attempt}/${this.maxRetries + 1}] GET ${this.maskSecrets(fullUrl)}`
        );

        const response = await fetch(fullUrl, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!response.ok) {
          throw new Error(`HTTP Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data as T;
      } catch (err: any) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(
          `[BRVM Client] Échec tentative ${attempt}: ${this.maskSecrets(lastError.message)}`
        );

        if (attempt <= this.maxRetries) {
          const backoff = Math.pow(2, attempt) * 200;
          await new Promise(r => setTimeout(r, backoff));
        }
      }
    }

    throw new Error(
      `Impossible d'obtenir les données BRVM après ${this.maxRetries + 1} tentatives: ${this.maskSecrets(
        lastError?.message || 'Erreur réseau inconnue'
      )}`
    );
  }
}
