import { useMutation, useQuery, useQueryClient } from "react-query";
import { apiRoutes } from "../lib/api-routes";
import { LocationInterface } from "@/lib/types";
import axios from "axios";

export const useGetLocations = (sessionId?: string | null) => {
  return useQuery({
    queryKey: ["locations", sessionId],
    queryFn: async (): Promise<Array<LocationInterface>> => {
      const response = await fetch(
        `${apiRoutes.location}?sessionId=${sessionId}`
      );
      return await response.json();
    },
    enabled: !!sessionId,
  });
};

export const useAddLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      newLocation: Omit<LocationInterface, "locationId" | "createdAt">
    ) => {
      const res = await axios.post(apiRoutes.location, newLocation);
      return res.data;
    },
    onMutate: async (newLocation) => {
      await queryClient.cancelQueries(["locations", newLocation.sessionId]);

      const previousLocations = queryClient.getQueryData<LocationInterface[]>([
        "locations",
        newLocation.sessionId,
      ]);

      queryClient.setQueryData<LocationInterface[]>(
        ["locations", newLocation.sessionId],
        (old = []) => [
          ...old,
          {
            ...newLocation,
            locationId: "temp-id-" + new Date().getTime(),
            createdAt: new Date().toISOString(),
          },
        ]
      );

      return { previousLocations };
    },
    onError: (err, newLocation, context) => {
      if (context?.previousLocations) {
        queryClient.setQueryData(
          ["locations", newLocation.sessionId],
          context.previousLocations
        );
      }
    },
    onSettled: (data, error, newLocation) => {
      queryClient.invalidateQueries(["locations", newLocation.sessionId]);
    },
  });
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      locationId,
      ...updateData
    }: Partial<LocationInterface> & { locationId: string }) => {
      const res = await axios.put(
        `${apiRoutes.location}/${locationId}`,
        updateData
      );
      return res.data;
    },
    onMutate: async ({ locationId, sessionId, ...updates }) => {
      await queryClient.cancelQueries(["locations", sessionId]);

      const previousLocations = queryClient.getQueryData<LocationInterface[]>([
        "locations",
        sessionId,
      ]);

      queryClient.setQueryData<LocationInterface[]>(
        ["locations", sessionId],
        (old = []) =>
          old.map((location) =>
            location.locationId === locationId
              ? { ...location, ...updates }
              : location
          )
      );

      return { previousLocations };
    },
    onError: (err, { sessionId }, context) => {
      if (context?.previousLocations) {
        queryClient.setQueryData(
          ["locations", sessionId],
          context.previousLocations
        );
      }
    },
    onSettled: (data, error, { sessionId }) => {
      queryClient.invalidateQueries(["locations", sessionId]);
    },
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      locationId,
      sessionId,
    }: {
      locationId: string;
      sessionId: string;
    }) => {
      await axios.delete(`${apiRoutes.location}/${locationId}`);
      return { locationId, sessionId };
    },
    onMutate: async ({ locationId, sessionId }) => {
      await queryClient.cancelQueries(["locations", sessionId]);

      const previousLocations = queryClient.getQueryData<LocationInterface[]>([
        "locations",
        sessionId,
      ]);

      queryClient.setQueryData<LocationInterface[]>(
        ["locations", sessionId],
        (old = []) =>
          old.filter((location) => location.locationId !== locationId)
      );

      return { previousLocations };
    },
    onError: (err, { sessionId }, context) => {
      if (context?.previousLocations) {
        queryClient.setQueryData(
          ["locations", sessionId],
          context.previousLocations
        );
      }
    },
    onSettled: (data, error, { sessionId }) => {
      queryClient.invalidateQueries(["locations", sessionId]);
    },
  });
};
