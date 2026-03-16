import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
type TableName = keyof Tables & string;

export function useSupabaseQuery<T extends TableName>(
  table: T,
  options?: {
    select?: string;
    orderBy?: { column: string; ascending?: boolean };
    filters?: { column: string; value: unknown }[];
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: [table, options?.filters],
    queryFn: async () => {
      let query = supabase.from(table).select(options?.select || "*");

      if (options?.filters) {
        for (const f of options.filters) {
          query = query.eq(f.column, f.value as string);
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
      return data as Tables[T]["Row"][];
    },
    enabled: options?.enabled ?? true,
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
