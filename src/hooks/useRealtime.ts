import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Equipment = Database['public']['Tables']['equipment']['Row'];
type Request = Database['public']['Tables']['requests']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];

export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEquipment = async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setEquipment(data);
      }
      setLoading(false);
    };

    fetchEquipment();

    const channel = supabase
      .channel('equipment-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'equipment' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEquipment((prev) => [payload.new as Equipment, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setEquipment((prev) =>
              prev.map((eq) => (eq.id === payload.new.id ? (payload.new as Equipment) : eq))
            );
          } else if (payload.eventType === 'DELETE') {
            setEquipment((prev) => prev.filter((eq) => eq.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { equipment, loading };
}

export function useRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRequests(data);
      }
      setLoading(false);
    };

    fetchRequests();

    const channel = supabase
      .channel('requests-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRequests((prev) => [payload.new as Request, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setRequests((prev) =>
              prev.map((req) => (req.id === payload.new.id ? (payload.new as Request) : req))
            );
          } else if (payload.eventType === 'DELETE') {
            setRequests((prev) => prev.filter((req) => req.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { requests, loading };
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (!error && data) {
        setTeams(data);
      }
      setLoading(false);
    };

    fetchTeams();

    const channel = supabase
      .channel('teams-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTeams((prev) => [...prev, payload.new as Team].sort((a, b) => a.name.localeCompare(b.name)));
          } else if (payload.eventType === 'UPDATE') {
            setTeams((prev) =>
              prev.map((team) => (team.id === payload.new.id ? (payload.new as Team) : team))
            );
          } else if (payload.eventType === 'DELETE') {
            setTeams((prev) => prev.filter((team) => team.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { teams, loading };
}
