import type { Database } from './types';

// Enhanced Mock Supabase client with full data support
const createMockClient = () => {
  // State listeners for auth changes
  let authListeners: Array<(event: string, session: any) => void> = [];

  // Storage keys
  const USERS_STORAGE_KEY = 'mock-registered-users';
  const CATALOGS_STORAGE_KEY = 'mock-catalogs';
  const CLIENTES_STORAGE_KEY = 'mock-clientes';
  const ORCAMENTOS_STORAGE_KEY = 'mock-orcamentos';
  const PEDIDOS_STORAGE_KEY = 'mock-pedidos';
  const CONTAS_RECEBER_STORAGE_KEY = 'mock-contas-receber';
  const CONTAS_PAGAR_STORAGE_KEY = 'mock-contas-pagar';

  // Initialize data stores
  const getStore = (key: string) => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  };

  const saveStore = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Hash password
  const hashPassword = (password: string): string => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'hash_' + Math.abs(hash).toString(36);
  };

  // Mock Auth
  const mockAuth = {
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      const users = getStore(USERS_STORAGE_KEY);
      const registeredUser = users[credentials.email.toLowerCase()];

      if (!registeredUser || registeredUser.passwordHash !== hashPassword(credentials.password)) {
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid email or password' } as any
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
      setTimeout(() => {
        authListeners.forEach(listener => listener('SIGNED_IN', session));
      }, 0);

      return { data: { user: mockUser, session }, error: null };
    },

    signUp: async (creds: any) => {
      const email = creds.email.toLowerCase();
      const users = getStore(USERS_STORAGE_KEY);

      if (users[email]) {
        return {
          data: { user: null, session: null },
          error: { message: 'User already exists' } as any
        };
      }

      const userId = 'mock-user-' + Math.random().toString(36).substr(2, 9);
      const companyId = 'mock-company-' + Math.random().toString(36).substr(2, 9);

      users[email] = {
        userId,
        email: creds.email,
        passwordHash: hashPassword(creds.password),
        companyId,
        created_at: new Date().toISOString(),
      };
      saveStore(USERS_STORAGE_KEY, users);

      const user = { id: userId, email: creds.email } as any;
      return { data: { user, session: null }, error: null };
    },

    signOut: async () => {
      localStorage.removeItem('sb-localhost-auth-token');
      authListeners.forEach(listener => listener('SIGNED_OUT', null));
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
            }
          }
        }
      };
    },
  };

  // Get current user context
  const getCurrentContext = () => {
    const stored = localStorage.getItem('sb-localhost-auth-token');
    if (!stored) return null;
    const session = JSON.parse(stored);
    return {
      userId: session.user.id,
      email: session.user.email,
      companyId: 'mock-company-default'
    };
  };

  // Get mock profile
  const getMockProfile = (userId: string, email: string) => ({
    id: userId,
    user_id: userId,
    company_id: 'mock-company-default',
    nome: email.split('@')[0],
    email: email,
    telefone: '11999999999',
    cargo: 'Usuário',
    avatar_url: null,
  });

  // Advanced Query Builder
  const createQueryBuilder = (table: string, data: any[] = []) => {
    let filteredData = [...data];
    let filters: Array<{ field: string; op: string; value: any }> = [];

    return {
      select: (columns?: string) => {
        return createQueryBuilder(table, filteredData);
      },
      eq: (field: string, value: any) => {
        filters.push({ field, op: 'eq', value });
        filteredData = filteredData.filter(item => item[field] === value);
        return createQueryBuilder(table, filteredData);
      },
      in: (field: string, values: any[]) => {
        filters.push({ field, op: 'in', value: values });
        filteredData = filteredData.filter(item => values.includes(item[field]));
        return createQueryBuilder(table, filteredData);
      },
      filter: (field: string, op: string, value: any) => {
        filters.push({ field, op, value });
        if (op === 'lt') {
          filteredData = filteredData.filter(item => item[field] < value);
        } else if (op === 'gt') {
          filteredData = filteredData.filter(item => item[field] > value);
        } else if (op === 'lte') {
          filteredData = filteredData.filter(item => item[field] <= value);
        } else if (op === 'gte') {
          filteredData = filteredData.filter(item => item[field] >= value);
        }
        return createQueryBuilder(table, filteredData);
      },
      single: async () => {
        return { data: filteredData[0] || null, error: null };
      },
      data: async () => {
        return { data: filteredData, error: null };
      },
      delete: async () => {
        // Delete from store
        let store = getStore(CATALOGS_STORAGE_KEY);
        if (table === 'perfis_catalogo') {
          const keysToDelete = filteredData.map(item => `${item.company_id}:${item.codigo}`);
          const updated = Object.fromEntries(
            Object.entries(store).filter(([k]) => !keysToDelete.includes(k))
          );
          saveStore(CATALOGS_STORAGE_KEY, updated);
          return { data: null, error: null };
        }
        if (table === 'window_models') {
          const keysToDelete = filteredData.map(item => `${item.company_id}:${item.codigo}`);
          const updated = Object.fromEntries(
            Object.entries(store).filter(([k]) => !keysToDelete.includes(k))
          );
          saveStore(CATALOGS_STORAGE_KEY, updated);
          return { data: null, error: null };
        }
        return { data: null, error: null };
      },
      update: async (updates: any) => {
        return { data: filteredData, error: null };
      },
      insert: async (records: any | any[]) => {
        const items = Array.isArray(records) ? records : [records];
        const store = getStore(CATALOGS_STORAGE_KEY);

        items.forEach(item => {
          const key = `${table}:${item.company_id}:${item.codigo}`;
          store[key] = item;
        });

        saveStore(CATALOGS_STORAGE_KEY, store);
        return { data: items, error: null };
      },
      order: (column: string, options?: { ascending: boolean }) => {
        filteredData.sort((a, b) => {
          if (a[column] < b[column]) return options?.ascending ? -1 : 1;
          if (a[column] > b[column]) return options?.ascending ? 1 : -1;
          return 0;
        });
        return createQueryBuilder(table, filteredData);
      },
      limit: (count: number) => {
        filteredData = filteredData.slice(0, count);
        return createQueryBuilder(table, filteredData);
      },
    };
  };

  return {
    auth: mockAuth,

    from: (table: string) => {
      const context = getCurrentContext();
      const companyId = context?.companyId || 'mock-company-default';
      const userId = context?.userId || 'mock-user-default';

      // Profile queries
      if (table === 'profiles') {
        const profile = getMockProfile(userId, context?.email || 'test@example.com');
        return {
          select: () => createQueryBuilder(table, [profile]),
          insert: async (data: any) => {
            return { data: profile, error: null };
          },
          update: async (data: any) => {
            return { data: profile, error: null };
          },
        };
      }

      // Catalog queries (perfis_catalogo, window_models)
      if (table === 'perfis_catalogo' || table === 'window_models') {
        // Get stored data
        const store = getStore(CATALOGS_STORAGE_KEY);
        const tableData = Object.values(store)
          .filter((item: any) => item.company_id === companyId)
          .filter((item: any) => {
            if (table === 'perfis_catalogo') return item.tipo !== 'window_model';
            if (table === 'window_models') return item.tipo === 'window_model' || (item.ativo !== false);
            return true;
          });

        return {
          select: () => createQueryBuilder(table, tableData),
          insert: async (records: any) => {
            const items = Array.isArray(records) ? records : [records];
            const updated = { ...store };
            items.forEach((item: any) => {
              const key = `${table}:${companyId}:${item.codigo}`;
              updated[key] = { ...item, company_id: companyId };
            });
            saveStore(CATALOGS_STORAGE_KEY, updated);
            return { data: items, error: null };
          },
          delete: () => createQueryBuilder(table, tableData),
          update: async (data: any) => {
            return { data: tableData, error: null };
          },
          filter: () => createQueryBuilder(table, tableData),
        };
      }

      // Business tables (orcamentos, pedidos, clientes, contas_receber, contas_pagar)
      if (table === 'orcamentos') {
        const store = getStore(ORCAMENTOS_STORAGE_KEY);
        const tableData = Object.values(store)
          .filter((item: any) => item.company_id === companyId);
        return {
          select: () => createQueryBuilder(table, tableData),
          insert: async (records: any) => {
            const items = Array.isArray(records) ? records : [records];
            const updated = { ...store };
            items.forEach((item: any) => {
              const key = `${companyId}:${item.id || Math.random().toString(36).substr(2, 9)}`;
              updated[key] = { ...item, company_id: companyId };
            });
            saveStore(ORCAMENTOS_STORAGE_KEY, updated);
            return { data: items, error: null };
          },
          delete: () => createQueryBuilder(table, tableData),
          update: async (data: any) => {
            return { data: tableData, error: null };
          },
          filter: () => createQueryBuilder(table, tableData),
        };
      }

      if (table === 'pedidos') {
        const store = getStore(PEDIDOS_STORAGE_KEY);
        const tableData = Object.values(store)
          .filter((item: any) => item.company_id === companyId);
        return {
          select: () => createQueryBuilder(table, tableData),
          insert: async (records: any) => {
            const items = Array.isArray(records) ? records : [records];
            const updated = { ...store };
            items.forEach((item: any) => {
              const key = `${companyId}:${item.id || Math.random().toString(36).substr(2, 9)}`;
              updated[key] = { ...item, company_id: companyId };
            });
            saveStore(PEDIDOS_STORAGE_KEY, updated);
            return { data: items, error: null };
          },
          delete: () => createQueryBuilder(table, tableData),
          update: async (data: any) => {
            return { data: tableData, error: null };
          },
          filter: () => createQueryBuilder(table, tableData),
        };
      }

      if (table === 'clientes') {
        const store = getStore(CLIENTES_STORAGE_KEY);
        const tableData = Object.values(store)
          .filter((item: any) => item.company_id === companyId);
        return {
          select: () => createQueryBuilder(table, tableData),
          insert: async (records: any) => {
            const items = Array.isArray(records) ? records : [records];
            const updated = { ...store };
            items.forEach((item: any) => {
              const key = `${companyId}:${item.id || Math.random().toString(36).substr(2, 9)}`;
              updated[key] = { ...item, company_id: companyId };
            });
            saveStore(CLIENTES_STORAGE_KEY, updated);
            return { data: items, error: null };
          },
          delete: () => createQueryBuilder(table, tableData),
          update: async (data: any) => {
            return { data: tableData, error: null };
          },
          filter: () => createQueryBuilder(table, tableData),
        };
      }

      if (table === 'contas_receber') {
        const store = getStore(CONTAS_RECEBER_STORAGE_KEY);
        const tableData = Object.values(store)
          .filter((item: any) => item.company_id === companyId);
        return {
          select: () => createQueryBuilder(table, tableData),
          insert: async (records: any) => {
            const items = Array.isArray(records) ? records : [records];
            const updated = { ...store };
            items.forEach((item: any) => {
              const key = `${companyId}:${item.id || Math.random().toString(36).substr(2, 9)}`;
              updated[key] = { ...item, company_id: companyId };
            });
            saveStore(CONTAS_RECEBER_STORAGE_KEY, updated);
            return { data: items, error: null };
          },
          delete: () => createQueryBuilder(table, tableData),
          update: async (data: any) => {
            return { data: tableData, error: null };
          },
          filter: () => createQueryBuilder(table, tableData),
        };
      }

      if (table === 'contas_pagar') {
        const store = getStore(CONTAS_PAGAR_STORAGE_KEY);
        const tableData = Object.values(store)
          .filter((item: any) => item.company_id === companyId);
        return {
          select: () => createQueryBuilder(table, tableData),
          insert: async (records: any) => {
            const items = Array.isArray(records) ? records : [records];
            const updated = { ...store };
            items.forEach((item: any) => {
              const key = `${companyId}:${item.id || Math.random().toString(36).substr(2, 9)}`;
              updated[key] = { ...item, company_id: companyId };
            });
            saveStore(CONTAS_PAGAR_STORAGE_KEY, updated);
            return { data: items, error: null };
          },
          delete: () => createQueryBuilder(table, tableData),
          update: async (data: any) => {
            return { data: tableData, error: null };
          },
          filter: () => createQueryBuilder(table, tableData),
        };
      }

      // Default empty response for other tables
      return {
        select: () => createQueryBuilder(table, []),
        insert: async (data: any) => ({ data: data || null, error: null }),
        delete: () => createQueryBuilder(table, []),
        update: async (data: any) => ({ data: null, error: null }),
        filter: () => createQueryBuilder(table, []),
      };
    },

    rpc: async (name: string, params?: any) => {
      if (name === 'auto_provision_company') {
        return { data: 'mock-company-' + Math.random().toString(36).substr(2, 9), error: null };
      }

      if (name === 'import_catalog_atomic') {
        // Handle atomic catalog import
        const { p_company_id, p_perfis, p_modelos } = params || {};

        try {
          const store = getStore(CATALOGS_STORAGE_KEY);

          // Save perfis
          if (Array.isArray(p_perfis)) {
            p_perfis.forEach((item: any) => {
              const key = `perfis_catalogo:${p_company_id}:${item.codigo}`;
              store[key] = { ...item, company_id: p_company_id };
            });
          }

          // Save modelos
          if (Array.isArray(p_modelos)) {
            p_modelos.forEach((item: any) => {
              const key = `window_models:${p_company_id}:${item.codigo}`;
              store[key] = { ...item, company_id: p_company_id, tipo: 'window_model', ativo: true };
            });
          }

          saveStore(CATALOGS_STORAGE_KEY, store);

          return {
            data: {
              success: true,
              perfis_salvos: p_perfis?.length || 0,
              modelos_salvos: p_modelos?.length || 0,
              company_id_usado: p_company_id
            },
            error: null
          };
        } catch (err) {
          return {
            data: null,
            error: { message: String(err) } as any
          };
        }
      }

      return { data: null, error: null };
    },
  };
};

export const supabase = createMockClient() as any;
