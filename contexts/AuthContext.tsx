import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, ProfileWithTopics, Topic } from '../types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: ProfileWithTopics | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileWithTopics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, profile_topics(topics(*))')
        .eq('id', userId)
        .single();

      if (error || !data) {
        setProfile(null);
        return;
      }

      const raw = data as any;
      const topics: Topic[] = (raw.profile_topics ?? [])
        .map((pt: any) => pt.topics as Topic | null)
        .filter((t: Topic | null): t is Topic => t !== null && t !== undefined);

      const profileData: ProfileWithTopics = {
        id: raw.id,
        full_name: raw.full_name ?? null,
        username: raw.username ?? null,
        role: raw.role ?? null,
        bio: raw.bio ?? null,
        location: raw.location ?? null,
        avatar_url: raw.avatar_url ?? null,
        cover_url: raw.cover_url ?? null,
        followers_count: raw.followers_count ?? 0,
        following_count: raw.following_count ?? 0,
        points: raw.points ?? 0,
        is_admin: raw.is_admin ?? false,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
        topics,
      };

      setProfile(profileData);
    } catch {
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session: initial } }) => {
      if (!mounted) return;
      const s = initial ?? null;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await fetchProfile(s.user.id);
      }
      if (mounted) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      const s = newSession ?? null;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await fetchProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
