import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WorkerLocation {
  workerId: string;
  latitude: number | null;
  longitude: number | null;
  isAvailable: boolean;
  lastUpdated: Date;
}

export function useWorkerTracking(workerId: string | null | undefined) {
  const [workerLocation, setWorkerLocation] = useState<WorkerLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workerId) {
      setWorkerLocation(null);
      setIsTracking(false);
      return;
    }

    // Initial fetch
    const fetchWorkerLocation = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('worker_profiles')
          .select('user_id, latitude, longitude, is_available')
          .eq('user_id', workerId)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching worker location:', fetchError);
          setError(fetchError.message);
          return;
        }

        if (data) {
          setWorkerLocation({
            workerId: data.user_id,
            latitude: data.latitude,
            longitude: data.longitude,
            isAvailable: data.is_available ?? true,
            lastUpdated: new Date(),
          });
          setIsTracking(true);
        }
      } catch (err) {
        console.error('Error in worker tracking:', err);
        setError('Failed to track worker location');
      }
    };

    fetchWorkerLocation();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`worker-location-${workerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'worker_profiles',
          filter: `user_id=eq.${workerId}`,
        },
        (payload) => {
          console.log('Worker location updated:', payload);
          const newData = payload.new as any;
          setWorkerLocation({
            workerId: newData.user_id,
            latitude: newData.latitude,
            longitude: newData.longitude,
            isAvailable: newData.is_available ?? true,
            lastUpdated: new Date(),
          });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsTracking(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setIsTracking(false);
    };
  }, [workerId]);

  return { workerLocation, isTracking, error };
}
