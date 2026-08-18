export interface SupabaseClientOptions {
  auth?: {
    persistSession?: boolean;
    autoRefreshToken?: boolean;
    detectSessionInUrl?: boolean;
  };
  accessToken?: () => Promise<string | null>;
}

export class SupabaseQueryBuilder implements PromiseLike<{ data: any; error: any }> {
  private tableName: string;
  private url: string;
  private key: string;
  private options: SupabaseClientOptions;
  private selectFields?: string;
  private filters: Array<{ field: string; op: string; val: any }> = [];
  private orderConfig?: { field: string; ascending: boolean };
  private limitCount?: number;
  private mutationType?: 'upsert' | 'update' | 'insert' | 'delete';
  private mutationData?: any;
  private mutationOptions?: any;

  constructor(tableName: string, url: string, key: string, options: SupabaseClientOptions = {}) {
    this.tableName = tableName;
    this.url = url.replace(/\/+$/, '');
    this.key = key;
    this.options = options;
  }

  select(fields = '*') {
    this.selectFields = fields;
    return this;
  }

  eq(field: string, val: any) {
    this.filters.push({ field, op: 'eq', val });
    return this;
  }

  order(field: string, config: { ascending: boolean } = { ascending: true }) {
    this.orderConfig = { field, ascending: config.ascending };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  upsert(data: any, options?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.mutationType = 'upsert';
    this.mutationData = data;
    this.mutationOptions = options;
    return this;
  }

  update(data: any) {
    this.mutationType = 'update';
    this.mutationData = data;
    return this;
  }

  insert(data: any) {
    this.mutationType = 'insert';
    this.mutationData = data;
    return this;
  }

  async single(): Promise<{ data: any; error: any }> {
    const res = await this.execute();
    if (res.error) return { data: null, error: res.error };
    const arr = Array.isArray(res.data) ? res.data : [res.data];
    return { data: arr[0] || null, error: null };
  }

  async maybeSingle(): Promise<{ data: any; error: any }> {
    const res = await this.execute();
    if (res.error) return { data: null, error: res.error };
    const arr = Array.isArray(res.data) ? res.data : [res.data];
    return { data: arr[0] || null, error: null };
  }

  private async execute(): Promise<{ data: any; error: any }> {
    try {
      const endpoint = `${this.url}/rest/v1/${this.tableName}`;
      const urlObj = new URL(endpoint);

      if (this.selectFields) {
        urlObj.searchParams.set('select', this.selectFields);
      }
      for (const f of this.filters) {
        urlObj.searchParams.set(f.field, `${f.op}.${f.val}`);
      }
      if (this.orderConfig) {
        urlObj.searchParams.set('order', `${this.orderConfig.field}.${this.orderConfig.ascending ? 'asc' : 'desc'}`);
      }
      if (this.limitCount !== undefined) {
        urlObj.searchParams.set('limit', String(this.limitCount));
      }

      let token = this.key;
      if (this.options.accessToken) {
        const customToken = await this.options.accessToken();
        if (customToken) token = customToken;
      }

      const headers: Record<string, string> = {
        'apikey': this.key,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      };

      let method = 'GET';
      let body: string | undefined;

      if (this.mutationType === 'upsert') {
        method = 'POST';
        headers['Prefer'] = `resolution=${this.mutationOptions?.ignoreDuplicates ? 'ignore-duplicates' : 'merge-duplicates'},return=representation`;
        body = JSON.stringify(this.mutationData);
      } else if (this.mutationType === 'update') {
        method = 'PATCH';
        body = JSON.stringify(this.mutationData);
      } else if (this.mutationType === 'insert') {
        method = 'POST';
        body = JSON.stringify(this.mutationData);
      }

      const response = await fetch(urlObj.toString(), {
        method,
        headers,
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { data: null, error: new Error(`Supabase API error (${response.status}): ${errorText}`) };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export class SupabaseClient {
  constructor(
    private url: string,
    private key: string,
    private options: SupabaseClientOptions = {}
  ) {}

  from(tableName: string): SupabaseQueryBuilder {
    return new SupabaseQueryBuilder(tableName, this.url, this.key, this.options);
  }
}

export function createClient(
  url: string,
  key: string,
  options?: SupabaseClientOptions
): SupabaseClient {
  return new SupabaseClient(url, key, options);
}

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secret) throw new Error('Supabase server persistence is not configured.');
  client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  return client;
}

export function setSupabaseAdminForTests(value: SupabaseClient | null): void {
  if (process.env.NODE_ENV === 'production') throw new Error('Test database injection is disabled in production.');
  client = value;
}
