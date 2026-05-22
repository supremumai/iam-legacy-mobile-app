import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          username: string | null;
          role: string | null;
          bio: string | null;
          location: string | null;
          avatar_url: string | null;
          followers_count: number;
          following_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at' | 'followers_count' | 'following_count'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      posts: {
        Row: {
          id: string;
          user_id: string | null;
          content: string | null;
          image_url: string | null;
          likes_count: number;
          comments_count: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'created_at' | 'likes_count' | 'comments_count'>;
        Update: Partial<Database['public']['Tables']['posts']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          title: string | null;
          description: string | null;
          location: string | null;
          event_date: string | null;
          is_online: boolean;
          attendees_count: number;
          image_url: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'attendees_count' | 'is_online'>;
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      courses: {
        Row: {
          id: string;
          title: string | null;
          instructor_id: string | null;
          description: string | null;
          lessons_count: number;
          difficulty: string | null;
          rating: number;
          image_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['courses']['Row'], 'id' | 'created_at' | 'lessons_count' | 'rating'>;
        Update: Partial<Database['public']['Tables']['courses']['Insert']>;
      };
      user_course_progress: {
        Row: {
          id: string;
          user_id: string | null;
          course_id: string | null;
          progress_percent: number;
          completed: boolean;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_course_progress']['Row'], 'id' | 'updated_at' | 'progress_percent' | 'completed'>;
        Update: Partial<Database['public']['Tables']['user_course_progress']['Insert']>;
      };
    };
  };
};
