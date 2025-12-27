import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: 'manager' | 'technician', teamId?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Ensure a profile exists after sign-in (useful when sign-up required email confirmation).
    if (data?.user) {
      const { data: existing, error: fetchErr } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!fetchErr && !existing) {
        // Create a minimal profile if it's missing. Use role from auth user metadata if present.
        // Supabase types can be finicky with this TypeScript version — ignore here
        // @ts-expect-error supabase-type-issue
        const { error: insertErr } = await supabase.from<'users'>('users').insert([{
          id: data.user.id,
          email,
          full_name: data.user.user_metadata?.full_name || '',
          role: (data.user.user_metadata as { role?: string } | undefined)?.role || 'technician',
          team_id: null,
        } as Database['public']['Tables']['users']['Insert']]);

        if (insertErr) throw insertErr;
      }

      // Load profile into context so UI shows name/role immediately
      await loadProfile(data.user.id);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'manager' | 'technician',
    teamId?: string
  ) => {
    // Pass the user's full name and role into auth user metadata so it can be used later
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });
    if (error) throw error;

    // If the project requires email confirmation, signUp will not return an active session.
    // In that case the client is not authenticated yet and cannot insert into `users` due to RLS.
    // Only create the profile now when a session exists (user is logged in immediately).
    if (data.user && data.session) {
      // Supabase types can be finicky with this TypeScript version — ignore here
      // @ts-expect-error supabase-type-issue
      const { error: profileError } = await supabase.from<'users'>('users').insert([{
        id: data.user.id,
        email,
        full_name: fullName,
        role,
        team_id: teamId || null,
      } as Database['public']['Tables']['users']['Insert']]);

      if (profileError) throw profileError;

      // Load profile into context so UI shows name/role immediately
      await loadProfile(data.user.id);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
