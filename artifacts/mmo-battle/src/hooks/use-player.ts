import { useQueryClient } from "@tanstack/react-query";
import {
  useGetPlayer,
  useCreatePlayer,
  getGetPlayerQueryKey,
} from "@/lib/localApi";

export function usePlayer() {
  return useGetPlayer({
    query: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  return useCreatePlayer({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey() });
      }
    }
  });
}
