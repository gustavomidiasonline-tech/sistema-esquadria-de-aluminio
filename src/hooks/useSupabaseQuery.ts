import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
type TableName = keyof Tables & string;

// Tables that require company_id RLS filtering to avoid 403
const RLS_COMPANY_TABLES: Partial<Record<TableName, boolean>> = {
  orcamento_itens: true,
  orcamentos: true,
  clientes: true,
  pedidos: true,
  pedido_itens: true,
  perfis_catalogo: true,
  perfis_aluminio: true,
  produtos: true,
  inventory_items: true,
  contas_receber: true,
  contas_pagar: true,
  pagamentos: true,
};

export function useSupabaseQuery<T>(
  table: TableName,
  options?: {
    select?: string;
    orderBy?: { column: string; ascending?: boolean };
    filters?: { column: string; operator?: string; value: unknown }[];
    enabled?: boolean;
    skipCompanyFilter?: boolean;
  }
) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: [table, options?.filters, profile?.company_id],
    queryFn: async () => {
      let query = supabase.from(table as any).select(options?.select || "*");

      // Auto-inject company_id filter for RLS-protected tables
      const needsCompany = RLS_COMPANY_TABLES[table] && !options?.skipCompanyFilter;
      if (needsCompany && profile?.company_id) {
        query = query.eq("company_id", profile.company_id);
      }

      if (options?.filters) {
        for (const f of options.filters) {
          const op = f.operator || "eq";
          if (op === "eq") query = query.eq(f.column, f.value as string);
          else if (op === "neq") query = (query as any).neq(f.column, f.value as string);
          else if (op === "in") query = (query as any).in(f.column, f.value as string[]);
          else if (op === "gte") query = (query as any).gte(f.column, f.value as string);
          else if (op === "lte") query = (query as any).lte(f.column, f.value as string);
          else query = query.eq(f.column, f.value as string);
        }
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? false,
        });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as T;
    },
    enabled: (options?.enabled ?? true),
  });
}

export function useSupabaseInsert<T extends TableName>(table: T) {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (values: Tables[T]["Insert"]) => {
      // Auto-inject company_id if not provided and user has one
      const insertValues = { ...values } as Record<string, unknown>;
      if (!insertValues.company_id && profile?.company_id) {
        insertValues.company_id = profile.company_id;
      }
      const { data, error } = await supabase.from(table).insert(insertValues as Tables[T]["Insert"]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao salvar");
    },
  });
}

export function useSupabaseUpdate<T extends TableName>(table: T) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Tables[T]["Update"] }) => {
      const { data, error } = await supabase.from(table).update(values as Tables[T]["Update"]).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar");
    },
  });
}

export function useSupabaseDelete<T extends TableName>(table: T) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao excluir");
    },
  });
}
