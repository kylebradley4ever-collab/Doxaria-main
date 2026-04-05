import { useQueryClient } from "@tanstack/react-query";
import { 
  useStartBattle, 
  usePerformAttack, 
  getGetPlayerQueryKey,
  getGetInventoryQueryKey
} from "@/lib/localApi";

export function useBattleStart() {
  return useStartBattle();
}

export function useBattleAttack() {
  const queryClient = useQueryClient();
  
  return usePerformAttack({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey() });
        if (data.loot) {
          queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
        }
      }
    }
  });
}
