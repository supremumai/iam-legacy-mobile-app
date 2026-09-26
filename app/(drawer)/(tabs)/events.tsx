import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { fetchSavedIds, toggleSave } from '../../../lib/saves';
import { deleteEventImageIfOwned } from '../../../lib/upload';
import { EventItem } from '../../../types/database';
import { Fonts } from '../../../constants/fonts';
import { useColors } from '../../../contexts/ThemeContext';
import GlobalHeader from '../../../components/GlobalHeader';
import EventCard from '../../../components/EventCard';
import { useLanguage } from '../../../contexts/LanguageContext';

type FilterType = 'All' | 'This Week' | 'Online' | 'In-Person';
const FILTERS: FilterType[] = ['All', 'This Week', 'Online', 'In-Person'];

function getFilterLabel(filter: FilterType, t: (key: string) => string): string {
  switch (filter) {
    case 'All': return t('events.filter_all');
    case 'This Week': return t('events.filter_this_week');
    case 'Online': return t('home.online');
    case 'In-Person': return t('events.in_person');
  }
}

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
  const { t } = useLanguage();
  const colors = useColors();
  const isAdmin = profile?.is_admin === true;

  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());
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

      // Bulk fetch saves — no N+1
      if (user?.id && events.length > 0) {
        try {
          const allIds = events.map((e) => e.id);
          const savedSet = await fetchSavedIds('event', allIds, user.id);
          setSavedEventIds(savedSet);
        } catch (e) {
          console.warn('[Events] saves fetch threw:', e);
          setSavedEventIds(new Set());
        }
      } else {
        setSavedEventIds(new Set());
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

  // ── Delete event (optimistic remove + rollback) — Batch 49 ──────────────
  const handleDeleteEvent = async (event: EventItem) => {
    // Optimistic remove
    setAllEvents((prev) => prev.filter((e) => e.id !== event.id));
    // Delete Storage image first (silent — never blocks DB delete)
    await deleteEventImageIfOwned(event.image_url);
    try {
      const { error } = await supabase.from('events').delete().eq('id', event.id);
      if (error) throw error;
    } catch (e: unknown) {
      // Rollback — restore event; splitEvents re-sorts by date so position is correct
      setAllEvents((prev) => [...prev, event]);
      Alert.alert(
        t('events.could_not_delete'),
        e instanceof Error ? e.message : t('common.unknown_error'),
      );
    }
  };

  // ── Save toggle (optimistic + rollback) — Batch 46b ─────────────────────
  const handleToggleSaveEvent = async (event: EventItem) => {
    if (!user?.id) return;
    const isCurrentlySaved = savedEventIds.has(event.id);

    setSavedEventIds((prev) => {
      const next = new Set(prev);
      isCurrentlySaved ? next.delete(event.id) : next.add(event.id);
      return next;
    });

    try {
      await toggleSave('event', event.id, user.id, isCurrentlySaved);
    } catch (e: unknown) {
      setSavedEventIds((prev) => {
        const next = new Set(prev);
        isCurrentlySaved ? next.add(event.id) : next.delete(event.id);
        return next;
      });
      Alert.alert(t('events.could_not_save'), e instanceof Error ? e.message : t('common.unknown_error'));
    }
  };

  // ── Derived lists ─────────────────────────────────────────────────────────
  const { upcoming, past } = splitEvents(allEvents);
  const filteredUpcoming = applyFilter(upcoming, activeFilter);

  // ── Error screen ──────────────────────────────────────────────────────────
  if (!loading && error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GlobalHeader />
        <Text
          style={{
            fontFamily: Fonts.heading,
            fontSize: 24,
            color: colors.gold,
            paddingHorizontal: 20,
            marginTop: 16,
          }}
        >
          {t('events.title')}
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
              color: colors.textPrimary,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            {t('events.could_not_load')}
          </Text>
          <Pressable
            onPress={() => {
              setLoading(true);
              fetchData();
            }}
            style={({ pressed }) => ({
              backgroundColor: colors.gold,
              borderRadius: 8,
              paddingHorizontal: 24,
              paddingVertical: 10,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: colors.background }}>
              {t('events.retry')}
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
      {/* Title row — admin "+" button lives here, aligned with the heading */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          marginTop: 16,
        }}
      >
        <Text
          style={{
            fontFamily: Fonts.heading,
            fontSize: 24,
            color: colors.gold,
          }}
        >
          {t('events.title')}
        </Text>
        {isAdmin ? (
          <TouchableOpacity
            onPress={() => router.push('/create-event' as any)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={22} color={colors.gold} />
          </TouchableOpacity>
        ) : null}
      </View>

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
                backgroundColor: active ? colors.gold : colors.surface,
                borderWidth: active ? 0 : 1,
                borderColor: colors.border,
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: active ? Fonts.bodyBold : Fonts.bodySemiBold,
                  fontSize: 14,
                  color: active ? colors.background : colors.textPrimary,
                }}
              >
                {getFilterLabel(f, t)}
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
          color: colors.gold,
        }}
      >
        {t('events.upcoming_section')}
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
              color: colors.gold,
            }}
          >
            {t('events.past_section')}
          </Text>
          <View style={{ paddingHorizontal: 20 }}>
            {past.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isPast={true}
                isSaved={savedEventIds.has(event.id)}
                onToggleSave={handleToggleSaveEvent}
                onDelete={handleDeleteEvent}
                onPress={(e) => router.push(`/event/${e.id}` as any)}
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
      <ActivityIndicator color={colors.gold} size="large" />
    </View>
  ) : activeFilter !== 'All' && upcoming.length > 0 ? (
    <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40 }}>
      <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary }}>
        {t('events.no_match_filter')}
      </Text>
      <Text
        style={{
          fontFamily: Fonts.body,
          fontSize: 13,
          color: colors.textMuted,
          marginTop: 4,
          textAlign: 'center',
        }}
      >
        {t('events.try_different_filter')}
      </Text>
    </View>
  ) : (
    <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40 }}>
      <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary }}>
        {t('events.no_events_yet')}
      </Text>
      <Text
        style={{
          fontFamily: Fonts.body,
          fontSize: 13,
          color: colors.textMuted,
          marginTop: 4,
          textAlign: 'center',
        }}
      >
        {t('events.check_back_soon')}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList<EventItem>
        data={filteredUpcoming}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginHorizontal: 20 }}>
            <EventCard
              event={item}
              isPast={false}
              isSaved={savedEventIds.has(item.id)}
              onToggleSave={handleToggleSaveEvent}
              onDelete={handleDeleteEvent}
              onPress={(e) => router.push(`/event/${e.id}` as any)}
            />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
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
