import { useMutation, useQuery, useQueryClient } from "react-query";
import { apiRoutes } from "../lib/api-routes";
import { LocationDataInterface } from "@/lib/types";
import axios from "axios";

export const useGetLocationData = (sessionId?: string | null) => {
  return useQuery({
    queryKey: ["locationData", sessionId],
    queryFn: async (): Promise<Array<LocationDataInterface>> => {
      const response = await fetch(
        `${apiRoutes.locationData}?sessionId=${sessionId}`
      );
      return await response.json();
    },
    enabled: !!sessionId,
  });
};

export const useAddLocationData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      newLocationData: Omit<
        LocationDataInterface,
        "locationDataId" | "createdAt"
      >
    ) => {
      const res = await axios.post(apiRoutes.locationData, newLocationData);
      return res.data;
    },
    onMutate: async (newLocationData) => {
      await queryClient.cancelQueries([
        "locationData",
        newLocationData.sessionId,
      ]);

      const previousLocationData = queryClient.getQueryData<
        LocationDataInterface[]
      >(["locationData", newLocationData.sessionId]);

      queryClient.setQueryData<LocationDataInterface[]>(
        ["locationData", newLocationData.sessionId],
        (old = []) => [
          ...old,
          {
            ...newLocationData,
            locationDataId: "temp-id-" + new Date().getTime(),
            createdAt: new Date().toISOString(),
          },
        ]
      );

      return { previousLocationData };
    },
    onError: (err, newLocationData, context) => {
      if (context?.previousLocationData) {
        queryClient.setQueryData(
          ["locationData", newLocationData.sessionId],
          context.previousLocationData
        );
      }
    },
    onSettled: (data, error, newLocationData) => {
      queryClient.invalidateQueries([
        "locationData",
        newLocationData.sessionId,
      ]);
    },
  });
};

export const useUpdateLocationData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      locationDataId,
      ...updateData
    }: Partial<LocationDataInterface> & { locationDataId: string }) => {
      const res = await axios.put(
        `${apiRoutes.locationData}/${locationDataId}`,
        updateData
      );
      return res.data;
    },
    onMutate: async ({ locationDataId, sessionId, ...updates }) => {
      await queryClient.cancelQueries(["locationData", sessionId]);

      const previousLocationData = queryClient.getQueryData<
        LocationDataInterface[]
      >(["locationData", sessionId]);

      queryClient.setQueryData<LocationDataInterface[]>(
        ["locationData", sessionId],
        (old = []) =>
          old.map((locationData) =>
            locationData.locationDataId === locationDataId
              ? { ...locationData, ...updates }
              : locationData
          )
      );

      return { previousLocationData };
    },
    onError: (err, { sessionId }, context) => {
      if (context?.previousLocationData) {
        queryClient.setQueryData(
          ["locationData", sessionId],
          context.previousLocationData
        );
      }
    },
    onSettled: (data, error, { sessionId }) => {
      queryClient.invalidateQueries(["locationData", sessionId]);
    },
  });
};

export const useDeleteLocationData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      locationDataId,
      sessionId,
    }: {
      locationDataId: string;
      sessionId: string;
    }) => {
      await axios.delete(`${apiRoutes.locationData}/${locationDataId}`);
      return { locationDataId, sessionId };
    },
    onMutate: async ({ locationDataId, sessionId }) => {
      await queryClient.cancelQueries(["locationData", sessionId]);

      const previousLocationData = queryClient.getQueryData<
        LocationDataInterface[]
      >(["locationData", sessionId]);

      queryClient.setQueryData<LocationDataInterface[]>(
        ["locationData", sessionId],
        (old = []) =>
          old.filter(
            (locationData) => locationData.locationDataId !== locationDataId
          )
      );

      return { previousLocationData };
    },
    onError: (err, { sessionId }, context) => {
      if (context?.previousLocationData) {
        queryClient.setQueryData(
          ["locationData", sessionId],
          context.previousLocationData
        );
      }
    },
    onSettled: (data, error, { sessionId }) => {
      queryClient.invalidateQueries(["locationData", sessionId]);
    },
  });
};
