import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  useFonts,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_900Black,
} from '@expo-google-fonts/playfair-display';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_900Black,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // undefined = still loading, null = no session, Session = authenticated
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Wait until both fonts and session are resolved
    if ((!fontsLoaded && !fontError) || session === undefined) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Not authenticated — send to welcome
      router.replace('/(auth)/welcome');
    } else if (session && inAuthGroup) {
      // Authenticated — send to app
      router.replace('/(tabs)/');
    }
  }, [session, segments, fontsLoaded, fontError]);

  // Keep splash up while loading
  if ((!fontsLoaded && !fontError) || session === undefined) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
