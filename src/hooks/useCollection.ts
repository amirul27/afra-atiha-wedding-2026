import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { Collection } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { uid } from "@/lib/utils";

/**
 * One hook to read and mutate any sheet-backed collection.
 * Optimistic updates keep the UI snappy; the server is the source of truth.
 */
export function useCollection<T extends { id: string }>(collection: Collection) {
  const qc = useQueryClient();
  const key = [collection];

  const query = useQuery<T[]>({
    queryKey: key,
    queryFn: () => api.list<T>(collection),
    staleTime: 30_000,
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: key });
  }

  const createMutation = useMutation({
    mutationFn: (payload: Partial<T>) => api.create<T>(collection, payload),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<T[]>(key) ?? [];
      const optimistic = { id: uid(collection.slice(0, 3)), ...payload } as T;
      qc.setQueryData<T[]>(key, [optimistic, ...prev]);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast({ variant: "error", title: "Couldn't save", description: "Please try again." });
    },
    onSuccess: () => toast({ variant: "success", title: "Saved" }),
    onSettled: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<T> & { id: string }) => api.update<T>(collection, payload),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<T[]>(key) ?? [];
      qc.setQueryData<T[]>(
        key,
        prev.map((row) => (row.id === payload.id ? { ...row, ...payload } : row)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast({ variant: "error", title: "Couldn't update" });
    },
    onSettled: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.remove(collection, id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<T[]>(key) ?? [];
      qc.setQueryData<T[]>(key, prev.filter((row) => row.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast({ variant: "error", title: "Couldn't delete" });
    },
    onSuccess: () => toast({ variant: "success", title: "Removed" }),
    onSettled: invalidate,
  });

  return {
    rows: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    remove: removeMutation.mutate,
    isMutating:
      createMutation.isPending || updateMutation.isPending || removeMutation.isPending,
  };
}
