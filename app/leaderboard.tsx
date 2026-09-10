import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getInitials } from '../lib/avatar';
import { Fonts } from '../constants/fonts';
import LevelBadge from '../components/LevelBadge';

interface LeaderboardRow {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  points: number;
}

function formatCount(n: number): string {
  if (n >= 1000) {
    const formatted = (n / 1000).toFixed(1);
    return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'k' : formatted + 'k';
  }
  return n.toString();
}

const TROPHY_COLORS = ['#e8c060', 'rgba(255,255,255,0.75)', '#c98a4c'] as const;

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, points')
        .order('points', { ascending: false })
        .limit(100);

      if (fetchError) {
        console.warn('[Leaderboard] fetch error:', fetchError.message);
        setError(true);
        return;
      }

      setRows(
        (data ?? []).map((row: any) => ({
          id: row.id,
          full_name: row.full_name ?? null,
          username: row.username ?? null,
          avatar_url: row.avatar_url ?? null,
          points: row.points ?? 0,
        })),
      );
    } catch (e) {
      console.warn('[Leaderboard] fetch threw:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (!loading && error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
        <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}
          >
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 16, color: '#FFFFFF', marginBottom: 16, textAlign: 'center' }}>
            Could not load the leaderboard
          </Text>
          <Pressable
            onPress={fetchLeaderboard}
            style={({ pressed }) => ({
              backgroundColor: '#c9a84c',
              borderRadius: 8,
              paddingHorizontal: 24,
              paddingVertical: 10,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: '#0a0900' }}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
      {/* Top bar */}
      <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}
        >
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Header */}
      <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
        <Text style={{ fontFamily: Fonts.heading, fontSize: 24, color: '#c9a84c' }}>
          Leaderboard
        </Text>
        <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
          All-time community ranking
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#c9a84c" size="large" />
        </View>
      ) : (
        <FlatList<LeaderboardRow>
          data={rows}
          keyExtractor={(item) => item.id}
          style={{ marginTop: 16 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: '#FFFFFF' }}>
                No rankings yet
              </Text>
            </View>
          }
          renderItem={({ item: row, index }) => {
            const rank = index + 1;
            const isTopThree = rank <= 3;
            const isCurrentUser = row.id === user?.id;
            const trophyColor = isTopThree ? TROPHY_COLORS[rank - 1] : undefined;
            const avatarBorderColor = isTopThree
              ? trophyColor!
              : 'rgba(201,168,76,0.22)';
            const avatarBorderWidth = isTopThree ? 2 : 1;
            const initials = getInitials(row.full_name, row.username);
            const displayName =
              row.full_name ??
              (row.username ? `@${row.username}` : 'Legacy Member');

            return (
              <Pressable
                onPress={() => router.push(`/profile?id=${row.id}` as any)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: isCurrentUser ? 10 : 0,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(201,168,76,0.08)',
                  backgroundColor: isCurrentUser ? 'rgba(201,168,76,0.08)' : 'transparent',
                  borderRadius: isCurrentUser ? 12 : 0,
                  opacity: pressed ? 0.8 : 1,
                  marginHorizontal: isCurrentUser ? -10 : 0,
                })}
              >
                {/* Rank indicator */}
                <View style={{ width: 32, alignItems: 'center' }}>
                  {isTopThree ? (
                    <Ionicons name="trophy" size={20} color={trophyColor} />
                  ) : (
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>
                      {rank}
                    </Text>
                  )}
                </View>

                {/* Avatar */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#1c1a14',
                    borderWidth: avatarBorderWidth,
                    borderColor: avatarBorderColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    marginLeft: 12,
                    flexShrink: 0,
                  }}
                >
                  {row.avatar_url ? (
                    <Image source={{ uri: row.avatar_url }} style={{ width: 44, height: 44 }} />
                  ) : (
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: '#FFFFFF' }}>
                      {initials}
                    </Text>
                  )}
                </View>

                {/* Name + badge */}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: '#FFFFFF' }} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <View style={{ marginTop: 4, alignSelf: 'flex-start' }}>
                    <LevelBadge points={row.points} size="small" />
                  </View>
                </View>

                {/* Points */}
                <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 16, color: '#c9a84c' }}>
                    {formatCount(row.points)}
                  </Text>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
                    pts
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
