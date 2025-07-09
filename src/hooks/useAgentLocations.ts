import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentLocationService, AgentLocationData } from '@/services/agentLocationService';
import { useToast } from '@/hooks/use-toast';

export const useAgentLocations = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['agent-locations'],
    queryFn: AgentLocationService.getAllAgentLocations,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    onError: (error) => {
      console.error('Error loading agent locations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les positions des agents",
        variant: "destructive"
      });
    }
  });
};

export const useActiveAgentLocations = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['active-agent-locations'],
    queryFn: AgentLocationService.getActiveAgentLocations,
    refetchInterval: 30000, // Refetch every 30 seconds
    onError: (error) => {
      console.error('Error loading active agent locations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les positions des agents actifs",
        variant: "destructive"
      });
    }
  });
};

export const useAgentLocationHistory = (agentId: string, days: number = 7) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['agent-location-history', agentId, days],
    queryFn: () => AgentLocationService.getAgentLocationHistory(agentId, days),
    enabled: !!agentId,
    onError: (error) => {
      console.error('Error loading agent location history:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des positions",
        variant: "destructive"
      });
    }
  });
};

export const useUpdateAgentLocation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      agentId, 
      latitude, 
      longitude, 
      address, 
      zone 
    }: {
      agentId: string;
      latitude: number;
      longitude: number;
      address: string;
      zone?: string;
    }) => AgentLocationService.updateAgentLocation(agentId, latitude, longitude, address, zone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-locations'] });
      queryClient.invalidateQueries({ queryKey: ['active-agent-locations'] });
    },
    onError: (error) => {
      console.error('Error updating agent location:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la position",
        variant: "destructive"
      });
    }
  });
};

export const useDeactivateAgentLocation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (agentId: string) => AgentLocationService.deactivateAgentLocation(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-locations'] });
      queryClient.invalidateQueries({ queryKey: ['active-agent-locations'] });
      toast({
        title: "Position désactivée",
        description: "La géolocalisation de l'agent a été désactivée",
      });
    },
    onError: (error) => {
      console.error('Error deactivating agent location:', error);
      toast({
        title: "Erreur",
        description: "Impossible de désactiver la position",
        variant: "destructive"
      });
    }
  });
};

export const useNearbyAgents = (latitude: number, longitude: number, radiusKm: number = 10) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['nearby-agents', latitude, longitude, radiusKm],
    queryFn: () => AgentLocationService.getAgentsNearLocation(latitude, longitude, radiusKm),
    enabled: !!(latitude && longitude),
    onError: (error) => {
      console.error('Error loading nearby agents:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les agents à proximité",
        variant: "destructive"
      });
    }
  });
};