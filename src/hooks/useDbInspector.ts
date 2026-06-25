import { useQuery } from "@tanstack/react-query";
import { dbInspect } from "@/lib/dbInspector";

const KEY = ["db-inspector"] as const;

export function useDbOverview() {
  return useQuery({ queryKey: [...KEY, "overview"], queryFn: () => dbInspect("overview"), staleTime: 30_000 });
}
export function useDbTables() {
  return useQuery({ queryKey: [...KEY, "tables"], queryFn: () => dbInspect<any[]>("tables"), staleTime: 30_000 });
}
export function useDbTableDetail(table: string | null) {
  return useQuery({
    queryKey: [...KEY, "table_detail", table],
    queryFn: () => dbInspect("table_detail", { table }),
    enabled: !!table,
  });
}
export function useDbFunctions() {
  return useQuery({ queryKey: [...KEY, "functions"], queryFn: () => dbInspect<any[]>("functions"), staleTime: 60_000 });
}
export function useDbTriggers() {
  return useQuery({ queryKey: [...KEY, "triggers"], queryFn: () => dbInspect<any[]>("triggers"), staleTime: 60_000 });
}
export function useDbStorage() {
  return useQuery({ queryKey: [...KEY, "storage"], queryFn: () => dbInspect<any[]>("storage"), staleTime: 30_000 });
}
export function useDbSlowQueries() {
  return useQuery({ queryKey: [...KEY, "slow_queries"], queryFn: () => dbInspect("slow_queries"), staleTime: 60_000 });
}
export function useDbIndexUsage() {
  return useQuery({ queryKey: [...KEY, "index_usage"], queryFn: () => dbInspect<any[]>("index_usage"), staleTime: 60_000 });
}
