import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { EventItem } from '../../../types/database';
import { Fonts } from '../../../constants/fonts';
import GlobalHeader from '../../../components/GlobalHeader';
import EventCard from '../../../components/EventCard';

type FilterType = 'All' | 'This Week' | 'Online' | 'In-Person';
const FILTERS: FilterType[] = ['All', 'This Week', 'Online', 'In-Person'];

function splitEvents(all: EventItem[]): { upcoming: EventItem[]; past: EventItem[] } {
  const now = new Date();
  const upcoming = all
    .filter((e) => !e.event_date || new Date(e.event_date) >= now)
    .sort((a, b) => {
      if (!a.event_date) return 1;
      if (!b.event_date) return -1;
      return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
    });
  const past = all
    .filter((e) => e.event_date && new Date(e.event_date) < now)
    .sort(
      (a, b) => new Date(b.event_date!).getTime() - new Date(a.event_date!).getTime(),
    );
  return { upcoming, past };
}

function applyFilter(upcoming: EventItem[], filter: FilterType): EventItem[] {
  if (filter === 'All') return upcoming;
  if (filter === 'Online') return upcoming.filter((e) => e.is_online === true);
  if (filter === 'In-Person') return upcoming.filter((e) => e.is_online === false);
  if (filter === 'This Week') {
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return upcoming.filter(
      (e) => e.event_date && new Date(e.event_date) <= weekFromNow,
    );
  }
  return upcoming;
}

export default function EventsScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const isAdmin = profile?.is_admin === true;

  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    setError(false);
    try {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (fetchError) {
        console.warn('[Events] fetch error:', fetchError.message);
        setError(true);
        return;
      }

      const events = (data ?? []) as EventItem[];
      setAllEvents(events);

      // Single query for all registration statuses
      if (user?.id && events.length > 0) {
        try {
          const allIds = events.map((e) => e.id);
          const { data: regData } = await supabase
            .from('event_registrations')
            .select('event_id')
            .eq('user_id', user.id)
            .eq('status', 'going')
            .in('event_id', allIds);
          setRegisteredEventIds(
            new Set((regData ?? []).map((r: any) => r.event_id as string)),
          );
        } catch (e) {
          console.warn('[Events] registrations fetch threw:', e);
          setRegisteredEventIds(new Set());
        }
      } else {
        setRegisteredEventIds(new Set());
      }
    } catch (e) {
      console.warn('[Events] fetchData threw:', e);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleToggleRegister = async (event: EventItem) => {
    if (!user?.id) return;
    const currentlyRegistered = registeredEventIds.has(event.id);

    // Optimistic update
    setRegisteredEventIds((prev) => {
      const next = new Set(prev);
      currentlyRegistered ? next.delete(event.id) : next.add(event.id);
      return next;
    });
    setAllEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? {
              ...e,
              attendees_count: currentlyRegistered
                ? Math.max(0, (e.attendees_count ?? 0) - 1)
                : (e.attendees_count ?? 0) + 1,
            }
          : e,
      ),
    );

    try {
      if (!currentlyRegistered) {
        const { error } = await supabase
          .from('event_registrations')
          .insert({ event_id: event.id, user_id: user.id, status: 'going' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_registrations')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', user.id);
        if (error) throw error;
      }
    } catch (e: unknown) {
      // Revert both optimistic changes
      setRegisteredEventIds((prev) => {
        const next = new Set(prev);
        currentlyRegistered ? next.add(event.id) : next.delete(event.id);
        return next;
      });
      setAllEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? {
                ...e,
                attendees_count: currentlyRegistered
                  ? (e.attendees_count ?? 0) + 1
                  : Math.max(0, (e.attendees_count ?? 0) - 1),
              }
            : e,
        ),
      );
      Alert.alert(
        'Could not update registration',
        e instanceof Error ? e.message : 'Unknown error',
      );
    }
  };

  // ── Derived lists ─────────────────────────────────────────────────────────
  const { upcoming, past } = splitEvents(allEvents);
  const filteredUpcoming = applyFilter(upcoming, activeFilter);

  // ── Error screen ──────────────────────────────────────────────────────────
  if (!loading && error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
        <GlobalHeader />
        <Text
          style={{
            fontFamily: Fonts.heading,
            fontSize: 24,
            color: '#c9a84c',
            paddingHorizontal: 20,
            marginTop: 16,
          }}
        >
          Events
        </Text>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 16,
              color: '#FFFFFF',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            Could not load events
          </Text>
          <Pressable
            onPress={() => {
              setLoading(true);
              fetchData();
            }}
            style={({ pressed }) => ({
              backgroundColor: '#c9a84c',
              borderRadius: 8,
              paddingHorizontal: 24,
              paddingVertical: 10,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: '#0a0900' }}>
              Retry
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── List header ───────────────────────────────────────────────────────────
  const listHeader = (
    <View>
      <GlobalHeader />
      <Text
        style={{
          fontFamily: Fonts.heading,
          fontSize: 24,
          color: '#c9a84c',
          paddingHorizontal: 20,
          marginTop: 16,
        }}
      >
        Events
      </Text>

      {/* Admin-only: Create Event button */}
      {isAdmin ? (
        <Pressable
          onPress={() => router.push('/create-event' as any)}
          style={{ marginHorizontal: 20, marginTop: 16, borderRadius: 8, overflow: 'hidden' }}
        >
          {({ pressed }) => (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#c9a84c',
                borderRadius: 8,
                paddingVertical: 12,
                gap: 8,
                opacity: pressed ? 0.85 : 1,
              }}
            >
              <Ionicons name="add" size={20} color="#0a0900" />
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: '#0a0900' }}>
                Create Event
              </Text>
            </View>
          )}
        </Pressable>
      ) : null}

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, gap: 8 }}
      >
        {FILTERS.map((f) => {
          const active = activeFilter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setActiveFilter(f)}
              style={{
                backgroundColor: active ? '#c9a84c' : '#1c1a14',
                borderWidth: active ? 0 : 1,
                borderColor: 'rgba(201,168,76,0.22)',
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: active ? Fonts.bodyBold : Fonts.bodySemiBold,
                  fontSize: 14,
                  color: active ? '#0a0900' : '#FFFFFF',
                }}
              >
                {f}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Section label */}
      <Text
        style={{
          paddingHorizontal: 20,
          marginTop: 24,
          marginBottom: 8,
          fontFamily: Fonts.heading,
          fontSize: 18,
          color: '#c9a84c',
        }}
      >
        Upcoming Events
      </Text>
    </View>
  );

  // ── Footer: past events ───────────────────────────────────────────────────
  const listFooter = (
    <View>
      {past.length > 0 ? (
        <View>
          <Text
            style={{
              paddingHorizontal: 20,
              marginTop: 24,
              marginBottom: 8,
              fontFamily: Fonts.heading,
              fontSize: 18,
              color: '#c9a84c',
            }}
          >
            Past Events
          </Text>
          <View style={{ paddingHorizontal: 20 }}>
            {past.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isRegistered={registeredEventIds.has(event.id)}
                isPast={true}
                onToggleRegister={handleToggleRegister}
              />
            ))}
          </View>
        </View>
      ) : null}
      <View style={{ paddingBottom: 32 }} />
    </View>
  );

  // ── Empty state ───────────────────────────────────────────────────────────
  const listEmpty = loading ? (
    <View style={{ alignItems: 'center', paddingVertical: 48 }}>
      <ActivityIndicator color="#c9a84c" size="large" />
    </View>
  ) : activeFilter !== 'All' && upcoming.length > 0 ? (
    <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40 }}>
      <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: '#FFFFFF' }}>
        No events match this filter
      </Text>
      <Text
        style={{
          fontFamily: Fonts.body,
          fontSize: 13,
          color: 'rgba(255,255,255,0.55)',
          marginTop: 4,
          textAlign: 'center',
        }}
      >
        Try a different filter.
      </Text>
    </View>
  ) : (
    <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40 }}>
      <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: '#FFFFFF' }}>
        No events yet
      </Text>
      <Text
        style={{
          fontFamily: Fonts.body,
          fontSize: 13,
          color: 'rgba(255,255,255,0.55)',
          marginTop: 4,
          textAlign: 'center',
        }}
      >
        Check back soon for upcoming community events.
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
      <FlatList<EventItem>
        data={filteredUpcoming}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginHorizontal: 20 }}>
            <EventCard
              event={item}
              isRegistered={registeredEventIds.has(item.id)}
              isPast={false}
              onToggleRegister={handleToggleRegister}
            />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#c9a84c"
            colors={['#c9a84c']}
          />
        }
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={{ paddingBottom: 0 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
