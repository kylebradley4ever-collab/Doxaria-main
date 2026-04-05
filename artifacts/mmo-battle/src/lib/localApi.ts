// Drop-in replacement for @workspace/api-client-react — all hooks use localStorage
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Engine from "./engine";
import type { Player, InventoryItem } from "./store";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const getGetPlayerQueryKey = () => ["player"] as const;
export const getGetInventoryQueryKey = () => ["inventory"] as const;
export const getBattleQueryKey = () => ["battle"] as const;

// ─── Types (re-exported for pages that import from api-client-react) ──────────

export type { Player, InventoryItem };
export type { LootItem } from "./gameLogic";

// ─── Player hooks ─────────────────────────────────────────────────────────────

export function useGetPlayer(options?: { query?: { retry?: boolean; refetchOnWindowFocus?: boolean } }) {
  return useQuery({
    queryKey: getGetPlayerQueryKey(),
    queryFn: () => {
      const p = Engine.getPlayer();
      if (!p) throw new Error("No player");
      return p;
    },
    retry: options?.query?.retry ?? false,
    refetchOnWindowFocus: options?.query?.refetchOnWindowFocus ?? false,
  });
}

export function useCreatePlayer(options?: { mutation?: { onSuccess?: (data: Player) => void } }) {
  return useMutation({
    mutationFn: ({ name }: { name: string }) => {
      const player = Engine.createPlayer(name);
      return Promise.resolve(player);
    },
    onSuccess: (data) => {
      options?.mutation?.onSuccess?.(data);
    },
  });
}

export function useAscendPlayer(options?: { mutation?: { onSuccess?: (data: any) => void; onError?: (e: Error) => void } }) {
  return useMutation({
    mutationFn: () => {
      const result = Engine.ascendPlayer();
      return Promise.resolve(result);
    },
    onSuccess: (data) => {
      options?.mutation?.onSuccess?.(data);
    },
    onError: (e: Error) => {
      options?.mutation?.onError?.(e);
    },
  });
}

// ─── Inventory hooks ──────────────────────────────────────────────────────────

export function useGetInventory(options?: { query?: { enabled?: boolean } }) {
  return useQuery({
    queryKey: getGetInventoryQueryKey(),
    queryFn: () => Engine.getInventory(),
    enabled: options?.query?.enabled,
  });
}

export function useEquipItem(options?: { mutation?: { onSuccess?: (data: any) => void; onError?: (e: Error) => void } }) {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => Promise.resolve(Engine.equipItem(id)),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export function useUnequipItem(options?: { mutation?: { onSuccess?: (data: any) => void; onError?: (e: Error) => void } }) {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => Promise.resolve(Engine.unequipItem(id)),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export function useSellItem(options?: { mutation?: { onSuccess?: (data: any) => void; onError?: (e: Error) => void } }) {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => Promise.resolve(Engine.sellItem(id)),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export function useSellAllItems(options?: { mutation?: { onSuccess?: (data: any) => void; onError?: (e: Error) => void } }) {
  return useMutation({
    mutationFn: () => Promise.resolve(Engine.sellAllItems()),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export function useEnchantItem(options?: { mutation?: { onSuccess?: (data: any) => void; onError?: (e: Error) => void } }) {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => Promise.resolve(Engine.enchantItem(id)),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export function useEquipBestItems(options?: { mutation?: { onSuccess?: (data: any) => void; onError?: (e: Error) => void } }) {
  return useMutation({
    mutationFn: () => Promise.resolve(Engine.equipBest()),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

// ─── Battle hooks ──────────────────────────────────────────────────────────────

export function useStartBattle(options?: { mutation?: { onSuccess?: (data: any) => void; onError?: (e: Error) => void } }) {
  return useMutation({
    mutationFn: () => Promise.resolve(Engine.startBattle()),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export function usePerformAttack(options?: { mutation?: { onSuccess?: (data: any) => void; onError?: (e: Error) => void } }) {
  return useMutation({
    mutationFn: (_: void) => Promise.resolve(Engine.performAttack()),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export async function getBattle() {
  const result = Engine.getBattle();
  if (!result) throw new Error("No active battle");
  return result;
}
