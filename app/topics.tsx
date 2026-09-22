import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Topic } from '../types/database';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';

function formatCount(n: number): string {
  if (n >= 1000) {
    const formatted = (n / 1000).toFixed(1);
    return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'k' : formatted + 'k';
  }
  return n.toString();
}

export default function TopicsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [topics, setTopics] = useState<Topic[]>([]);
  // Map of topic_id -> member count (all profiles, not just current user)
  const [memberCounts, setMemberCounts] = useState<Map<string, number>>(new Map());
  // Set of topic IDs the current user has joined (optimistically updated)
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  // Set of topic IDs currently mid-flight (disable button only for that card)
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Derive initial joined set from auth context (no extra query)
  const initialJoinedRef = useRef(false);
  useEffect(() => {
    if (initialJoinedRef.current) return;
    initialJoinedRef.current = true;
    const ids = new Set<string>((profile?.topics ?? []).map((t) => t.id));
    setJoinedIds(ids);
  }, [profile]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);

    let fetchedTopics: Topic[] = [];
    let counts = new Map<string, number>();

    // Both queries run concurrently
    try {
      const [topicsResult, memberResult] = await Promise.all([
        supabase
          .from('topics')
          .select('id, slug, name, description, icon, sort_order')
          .order('sort_order', { ascending: true }),
        supabase.from('profile_topics').select('topic_id'),
      ]);

      if (topicsResult.error) {
        console.warn('[Topics] topics fetch error:', topicsResult.error.message);
      } else {
        fetchedTopics = (topicsResult.data ?? []) as Topic[];
      }

      if (memberResult.error) {
        console.warn('[Topics] member count fetch error:', memberResult.error.message);
      } else {
        // Single pass: reduce all profile_topics rows into a count map
        const rows = memberResult.data ?? [];
        for (const row of rows) {
          const tid = (row as any).topic_id as string;
          counts.set(tid, (counts.get(tid) ?? 0) + 1);
        }
      }
    } catch (e) {
      console.warn('[Topics] fetch threw:', e);
      setError(true);
      setLoading(false);
      return;
    }

    setTopics(fetchedTopics);
    setMemberCounts(counts);

    if (fetchedTopics.length === 0 && !error) {
      // Not an error — genuinely zero topics
    }

    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = useCallback(
    async (topic: Topic) => {
      if (!user) return;

      const isJoined = joinedIds.has(topic.id);

      // Mark in-flight
      setSubmittingIds((prev) => {
        const next = new Set(prev);
        next.add(topic.id);
        return next;
      });

      if (isJoined) {
        // Optimistic leave
        setJoinedIds((prev) => {
          const next = new Set(prev);
          next.delete(topic.id);
          return next;
        });
        setMemberCounts((prev) => {
          const next = new Map(prev);
          next.set(topic.id, Math.max(0, (next.get(topic.id) ?? 1) - 1));
          return next;
        });

        const { error: leaveError } = await supabase
          .from('profile_topics')
          .delete()
          .eq('profile_id', user.id)
          .eq('topic_id', topic.id);

        if (leaveError) {
          // Revert
          setJoinedIds((prev) => {
            const next = new Set(prev);
            next.add(topic.id);
            return next;
          });
          setMemberCounts((prev) => {
            const next = new Map(prev);
            next.set(topic.id, (next.get(topic.id) ?? 0) + 1);
            return next;
          });
          Alert.alert('Could not leave topic', leaveError.message);
        } else {
          refreshProfile();
        }
      } else {
        // Optimistic join
        setJoinedIds((prev) => {
          const next = new Set(prev);
          next.add(topic.id);
          return next;
        });
        setMemberCounts((prev) => {
          const next = new Map(prev);
          next.set(topic.id, (next.get(topic.id) ?? 0) + 1);
          return next;
        });

        const { error: joinError } = await supabase
          .from('profile_topics')
          .insert({ profile_id: user.id, topic_id: topic.id });

        if (joinError) {
          // Revert
          setJoinedIds((prev) => {
            const next = new Set(prev);
            next.delete(topic.id);
            return next;
          });
          setMemberCounts((prev) => {
            const next = new Map(prev);
            next.set(topic.id, Math.max(0, (next.get(topic.id) ?? 1) - 1));
            return next;
          });
          Alert.alert('Could not join topic', joinError.message);
        } else {
          refreshProfile();
        }
      }

      // Clear in-flight
      setSubmittingIds((prev) => {
        const next = new Set(prev);
        next.delete(topic.id);
        return next;
      });
    },
    [user, joinedIds, refreshProfile],
  );

  if (!loading && error) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}
          >
            <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 16,
              color: Colors.textPrimary,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            Could not load topics
          </Text>
          <Pressable
            onPress={fetchData}
            style={({ pressed }) => ({
              backgroundColor: Colors.gold,
              borderRadius: 8,
              paddingHorizontal: 24,
              paddingVertical: 10,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.background }}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Top bar */}
      <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}
        >
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {/* Header */}
      <View style={{ paddingHorizontal: 20, marginTop: 2 }}>
        <Text style={{ fontFamily: Fonts.heading, fontSize: 24, color: Colors.gold }}>Topics</Text>
        <Text
          style={{
            fontFamily: Fonts.body,
            fontSize: 14,
            color: Colors.textMuted,
            marginTop: 4,
          }}
        >
          Join topics to personalize your experience
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.gold} size="large" />
        </View>
      ) : (
        <FlatList<Topic>
          data={topics}
          keyExtractor={(item) => item.id}
          style={{ marginTop: 16 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.textPrimary }}>
                No topics yet
              </Text>
            </View>
          }
          renderItem={({ item: topic }) => {
            const isJoined = joinedIds.has(topic.id);
            const isSubmitting = submittingIds.has(topic.id);
            const count = memberCounts.get(topic.id) ?? 0;
            const memberLabel = `${formatCount(count)} member${count === 1 ? '' : 's'}`;

            return (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: Colors.surface,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                {/* Icon circle */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: Colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Ionicons
                    name={(topic.icon ?? 'ellipse-outline') as any}
                    size={20}
                    color={Colors.gold}
                  />
                </View>

                {/* Middle: name + description + member count */}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={{
                      fontFamily: Fonts.bodySemiBold,
                      fontSize: 15,
                      color: Colors.textPrimary,
                    }}
                  >
                    {topic.name}
                  </Text>
                  {topic.description ? (
                    <Text
                      numberOfLines={2}
                      style={{
                        fontFamily: Fonts.body,
                        fontSize: 13,
                        color: Colors.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {topic.description}
                    </Text>
                  ) : null}
                  <Text
                    style={{
                      fontFamily: Fonts.body,
                      fontSize: 12,
                      color: Colors.textTertiary,
                      marginTop: 4,
                    }}
                  >
                    {memberLabel}
                  </Text>
                </View>

                {/* Join / Joined pill */}
                <Pressable
                  onPress={() => !isSubmitting && handleToggle(topic)}
                  disabled={isSubmitting}
                  style={
                    isJoined
                      ? {
                          backgroundColor: Colors.surface,
                          borderWidth: 1,
                          borderColor: Colors.border,
                          borderRadius: 999,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          opacity: isSubmitting ? 0.6 : 1,
                          marginLeft: 12,
                        }
                      : {
                          backgroundColor: Colors.gold,
                          borderRadius: 999,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          opacity: isSubmitting ? 0.6 : 1,
                          marginLeft: 12,
                        }
                  }
                >
                  <Text
                    style={
                      isJoined
                        ? { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.textPrimary }
                        : { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.background }
                    }
                  >
                    {isJoined ? 'Joined' : 'Join'}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
