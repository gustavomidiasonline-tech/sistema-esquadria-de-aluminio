import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type TableName = "clientes" | "produtos" | "planos_de_corte" | "perfis_aluminio" |
  "orcamentos" | "orcamento_itens" | "pedidos" | "pedido_itens" | "servicos" |
  "contas_receber" | "contas_pagar" | "notas_fiscais" | "contratos" | "documentos" | "profiles";

export function useSupabaseQuery<T = any>(
  table: TableName,
  options?: {
    select?: string;
    orderBy?: { column: string; ascending?: boolean };
    filters?: { column: string; value: any }[];
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: [table, options?.filters],
    queryFn: async () => {
      let query = (supabase.from(table) as any).select(options?.select || "*");

      if (options?.filters) {
        for (const f of options.filters) {
          query = query.eq(f.column, f.value);
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
      return data as T[];
    },
    enabled: options?.enabled ?? true,
  });
}

export function useSupabaseInsert(table: TableName) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const { data, error } = await supabase.from(table).insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar");
    },
  });
}

export function useSupabaseUpdate(table: TableName) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, any> }) => {
      const { data, error } = await supabase.from(table).update(values).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar");
    },
  });
}

export function useSupabaseDelete(table: TableName) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir");
    },
  });
}
