import { useQuery } from "@tanstack/react-query";
import * as Engine from "@/lib/engine";

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => Engine.getStats(),
    refetchInterval: 10_000,
  });
}
