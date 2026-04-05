import { useQueryClient } from "@tanstack/react-query";
import {
  useGetInventory,
  useEquipItem,
  useUnequipItem,
  useSellItem,
  useSellAllItems,
  useEnchantItem,
  useEquipBestItems,
  getGetInventoryQueryKey,
  getGetPlayerQueryKey,
} from "@/lib/localApi";

export function useInventory() {
  return useGetInventory();
}

export function useEquip() {
  const queryClient = useQueryClient();
  return useEquipItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey() });
      },
      onError: (e: Error) => {
        console.error("[useEquip] failed:", e.message);
        queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
      },
    },
  });
}

export function useUnequip() {
  const queryClient = useQueryClient();
  return useUnequipItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey() });
      },
      onError: (e: Error) => {
        console.error("[useUnequip] failed:", e.message);
        queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
      },
    },
  });
}

export function useSell() {
  const queryClient = useQueryClient();
  return useSellItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey() });
      },
    },
  });
}

export function useSellAll() {
  const queryClient = useQueryClient();
  return useSellAllItems({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey() });
      },
    },
  });
}

export function useEnchant() {
  const queryClient = useQueryClient();
  return useEnchantItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey() });
      },
    },
  });
}

export function useEquipBest() {
  const queryClient = useQueryClient();
  return useEquipBestItems({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey() });
      },
    },
  });
}
