import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Read Supabase credentials from Vite env vars
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

const hasRealSupabase = !!(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL !== 'http://localhost:54321' &&
  !SUPABASE_ANON_KEY.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1v')
);

// ─── Real Supabase Client ────────────────────────────────────────────
const createRealClient = () => {
  return createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
};

// ─── Mock Supabase Client (fallback para desenvolvimento sem Supabase) ─
const createMockClient = () => {
  let authListeners: Array<(event: string, session: any) => void> = [];

  const USERS_KEY = 'mock-registered-users';
  const STORAGE_KEYS: Record<string, string> = {
    perfis_catalogo: 'mock-catalogs',
    window_models: 'mock-catalogs',
    inventory_items: 'mock-inventory-items',
    orcamentos: 'mock-orcamentos',
    pedidos: 'mock-pedidos',
    clientes: 'mock-clientes',
    contas_receber: 'mock-contas-receber',
    contas_pagar: 'mock-contas-pagar',
  };

  const getStore = (key: string) => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  };

  const saveStore = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const hashPassword = (password: string): string => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'hash_' + Math.abs(hash).toString(36);
  };

  const getCurrentContext = () => {
    const stored = localStorage.getItem('sb-localhost-auth-token');
    if (!stored) return null;
    const session = JSON.parse(stored);
    return {
      userId: session.user.id,
      email: session.user.email,
      companyId: 'mock-company-default',
    };
  };

  const getMockProfile = (userId: string, email: string) => ({
    id: userId,
    user_id: userId,
    company_id: 'mock-company-default',
    nome: email.split('@')[0],
    email,
    telefone: '11999999999',
    cargo: 'Usuário',
    avatar_url: null,
  });

  // Thenable query builder — matches real Supabase behavior
  const createQueryBuilder = (table: string, data: any[] = [], isSingle = false) => {
    let filteredData = [...data];

    const builder: any = {
      select: () => createQueryBuilder(table, filteredData),
      eq: (field: string, value: any) => {
        filteredData = filteredData.filter(item => item[field] === value);
        return createQueryBuilder(table, filteredData, isSingle);
      },
      neq: (field: string, value: any) => {
        filteredData = filteredData.filter(item => item[field] !== value);
        return createQueryBuilder(table, filteredData, isSingle);
      },
      in: (field: string, values: any[]) => {
        filteredData = filteredData.filter(item => values.includes(item[field]));
        return createQueryBuilder(table, filteredData, isSingle);
      },
      filter: (field: string, op: string, value: any) => {
        if (op === 'eq') filteredData = filteredData.filter(item => item[field] === value);
        else if (op === 'lt') filteredData = filteredData.filter(item => item[field] < value);
        else if (op === 'gt') filteredData = filteredData.filter(item => item[field] > value);
        else if (op === 'lte') filteredData = filteredData.filter(item => item[field] <= value);
        else if (op === 'gte') filteredData = filteredData.filter(item => item[field] >= value);
        return createQueryBuilder(table, filteredData, isSingle);
      },
      single: () => createQueryBuilder(table, filteredData, true),
      order: (column: string, options?: { ascending: boolean }) => {
        filteredData.sort((a, b) => {
          if (a[column] < b[column]) return options?.ascending ? -1 : 1;
          if (a[column] > b[column]) return options?.ascending ? 1 : -1;
          return 0;
        });
        return createQueryBuilder(table, filteredData, isSingle);
      },
      limit: (count: number) => {
        filteredData = filteredData.slice(0, count);
        return createQueryBuilder(table, filteredData, isSingle);
      },
      // Thenable — allows `await supabase.from(...).select(...)` to resolve
      then: (resolve: (value: any) => void, reject?: (reason: any) => void) => {
        try {
          resolve(isSingle
            ? { data: filteredData[0] || null, error: null }
            : { data: filteredData, error: null });
        } catch (err) {
          if (reject) reject(err);
        }
      },
      delete: () => {
        const del: any = {
          eq: () => del,
          then: (resolve: (v: any) => void) => resolve({ data: null, error: null }),
        };
        return del;
      },
      update: () => {
        const upd: any = {
          eq: () => upd,
          then: (resolve: (v: any) => void) => resolve({ data: null, error: null }),
        };
        return upd;
      },
      upsert: (records: any) => {
        const items = Array.isArray(records) ? records : [records];
        return createQueryBuilder(table, items);
      },
      insert: (records: any) => {
        const items = Array.isArray(records) ? records : [records];
        return createQueryBuilder(table, items);
      },
    };

    return builder;
  };

  // Mock Auth
  const mockAuth = {
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      const users = getStore(USERS_KEY);
      const registeredUser = users[credentials.email.toLowerCase()];

      if (!registeredUser || registeredUser.passwordHash !== hashPassword(credentials.password)) {
        return {
          data: { user: null, session: null },
          error: { message: 'Email ou senha inválidos' } as any,
        };
      }

      const mockUser = {
        id: registeredUser.userId,
        email: credentials.email,
        user_metadata: { name: credentials.email.split('@')[0] },
        aud: 'authenticated',
        created_at: registeredUser.created_at,
        app_metadata: {},
        identities: [],
        last_sign_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any;

      const session = {
        user: mockUser,
        access_token: 'mock-token-' + Math.random().toString(36).substr(2, 9),
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      localStorage.setItem('sb-localhost-auth-token', JSON.stringify(session));
      setTimeout(() => authListeners.forEach(l => l('SIGNED_IN', session)), 0);
      return { data: { user: mockUser, session }, error: null };
    },

    signUp: async (creds: any) => {
      const email = creds.email.toLowerCase();
      const users = getStore(USERS_KEY);
      if (users[email]) {
        return { data: { user: null, session: null }, error: { message: 'Usuário já existe' } as any };
      }
      const userId = 'mock-user-' + Math.random().toString(36).substr(2, 9);
      users[email] = {
        userId,
        email: creds.email,
        passwordHash: hashPassword(creds.password),
        companyId: 'mock-company-default',
        created_at: new Date().toISOString(),
      };
      saveStore(USERS_KEY, users);
      return { data: { user: { id: userId, email: creds.email } as any, session: null }, error: null };
    },

    signOut: async () => {
      localStorage.removeItem('sb-localhost-auth-token');
      authListeners.forEach(l => l('SIGNED_OUT', null));
      return { error: null };
    },

    getSession: async () => {
      const stored = localStorage.getItem('sb-localhost-auth-token');
      return { data: { session: stored ? JSON.parse(stored) : null }, error: null };
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      authListeners.push(callback);
      const stored = localStorage.getItem('sb-localhost-auth-token');
      const session = stored ? JSON.parse(stored) : null;
      setTimeout(() => callback('INITIAL_SESSION', session), 0);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners = authListeners.filter(l => l !== callback);
            },
          },
        },
      };
    },
  };

  return {
    auth: mockAuth,

    from: (table: string) => {
      const context = getCurrentContext();
      const companyId = context?.companyId || 'mock-company-default';
      const userId = context?.userId || 'mock-user-default';

      const loadTableData = (): any[] => {
        if (table === 'profiles') {
          return [getMockProfile(userId, context?.email || 'test@example.com')];
        }
        const storageKey = STORAGE_KEYS[table];
        if (!storageKey) return [];
        const store = getStore(storageKey);
        let items = Object.values(store).filter((item: any) => item.company_id === companyId);
        if (table === 'perfis_catalogo') items = items.filter((item: any) => item.tipo !== 'window_model');
        if (table === 'window_models') items = items.filter((item: any) => item.tipo === 'window_model' || item.ativo !== false);
        return items;
      };

      const saveRecords = (records: any[]) => {
        const storageKey = STORAGE_KEYS[table];
        if (!storageKey) return;
        const store = getStore(storageKey);
        records.forEach((item: any) => {
          const code = item.codigo || item.id || Math.random().toString(36).substr(2, 9);
          const key = (table === 'perfis_catalogo' || table === 'window_models')
            ? `${table}:${companyId}:${code}`
            : `${companyId}:${code}`;
          store[key] = { ...item, company_id: item.company_id || companyId };
        });
        saveStore(storageKey, store);
      };

      return {
        select: () => createQueryBuilder(table, loadTableData()),
        insert: (records: any) => {
          const items = Array.isArray(records) ? records : [records];
          saveRecords(items);
          return createQueryBuilder(table, items);
        },
        upsert: (records: any) => {
          const items = Array.isArray(records) ? records : [records];
          saveRecords(items);
          return createQueryBuilder(table, items);
        },
        delete: () => createQueryBuilder(table, loadTableData()),
        update: (updates: any) => {
          const upd: any = {
            eq: () => upd,
            then: (resolve: (v: any) => void) => resolve({ data: null, error: null }),
          };
          return upd;
        },
        filter: () => createQueryBuilder(table, loadTableData()),
      };
    },

    rpc: async (name: string, params?: any) => {
      if (name === 'auto_provision_company') {
        return { data: 'mock-company-default', error: null };
      }
      if (name === 'import_catalog_atomic') {
        const { p_company_id, p_perfis, p_modelos } = params || {};
        try {
          const store = getStore('mock-catalogs');
          if (Array.isArray(p_perfis)) {
            p_perfis.forEach((item: any) => {
              store[`perfis_catalogo:${p_company_id}:${item.codigo}`] = { ...item, company_id: p_company_id };
            });
          }
          if (Array.isArray(p_modelos)) {
            p_modelos.forEach((item: any) => {
              store[`window_models:${p_company_id}:${item.codigo}`] = { ...item, company_id: p_company_id, tipo: 'window_model', ativo: true };
            });
          }
          saveStore('mock-catalogs', store);
          return {
            data: { success: true, perfis_salvos: p_perfis?.length || 0, modelos_salvos: p_modelos?.length || 0 },
            error: null,
          };
        } catch (err) {
          return { data: null, error: { message: String(err) } as any };
        }
      }
      return { data: null, error: null };
    },
  };
};

// ─── Export ──────────────────────────────────────────────────────────
export const supabase = hasRealSupabase
  ? createRealClient()
  : createMockClient() as any;

// Log which mode is active (dev only)
if (import.meta.env.DEV) {
  console.log(
    hasRealSupabase
      ? `[Supabase] Conectado ao Supabase real: ${SUPABASE_URL}`
      : '[Supabase] Modo mock (localStorage). Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env.local para usar Supabase real.'
  );
}
