import { useEffect, useState } from 'react';
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
import { formatRelativeTime } from '../lib/time';
import { NotificationWithActor, PostAuthor } from '../types/database';
import { Fonts } from '../constants/fonts';

function normalizeActor(raw: any): PostAuthor | null {
  const profiles = raw['profiles'];
  const actorRaw = Array.isArray(profiles) ? (profiles[0] ?? null) : (profiles ?? null);
  if (!actorRaw) return null;
  return {
    id: actorRaw.id,
    full_name: actorRaw.full_name ?? null,
    username: actorRaw.username ?? null,
    avatar_url: actorRaw.avatar_url ?? null,
  };
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<NotificationWithActor[]>([]);
  // Track which items were unread at open-time — stays stable after mark-as-read fires
  const [wasUnreadIds, setWasUnreadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('notifications')
          .select(
            'id, recipient_id, actor_id, type, post_id, comment_id, is_read, created_at, profiles!notifications_actor_id_fkey(id, full_name, username, avatar_url)',
          )
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (fetchError) {
          console.warn('[Notifications] fetch error:', fetchError.message);
          if (!cancelled) setError(true);
          return;
        }

        const normalized: NotificationWithActor[] = (data ?? []).map((raw: any) => ({
          id: raw.id,
          recipient_id: raw.recipient_id,
          actor_id: raw.actor_id,
          type: raw.type as 'post_like' | 'post_comment' | 'comment_reply',
          post_id: raw.post_id,
          comment_id: raw.comment_id ?? null,
          is_read: raw.is_read,
          created_at: raw.created_at,
          actor: normalizeActor(raw),
        }));

        if (cancelled) return;

        // Capture which items were unread before we mark them read
        const unreadIds = new Set(
          normalized.filter((n) => !n.is_read).map((n) => n.id),
        );
        setWasUnreadIds(unreadIds);

        // Optimistically mark all as read locally
        const allRead = normalized.map((n) => ({ ...n, is_read: true }));
        setNotifications(allRead);

        // Fire-and-forget DB update for unread rows
        if (unreadIds.size > 0) {
          supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('recipient_id', user.id)
            .eq('is_read', false)
            .then(({ error: updateError }) => {
              if (updateError) {
                console.warn('[Notifications] mark-as-read error:', updateError.message);
              }
            });
        }
      } catch (e) {
        console.warn('[Notifications] fetch threw:', e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // ── Error state ────────────────────────────────────────────────────────────
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
            Could not load notifications
          </Text>
          <Pressable
            onPress={() => {
              setError(false);
              setLoading(true);
            }}
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
          Notifications
        </Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#c9a84c" size="large" />
        </View>
      ) : (
        <FlatList<NotificationWithActor>
          data={notifications}
          keyExtractor={(item) => item.id}
          style={{ marginTop: 16 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 24,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: '#FFFFFF' }}>
                No notifications yet
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
                When someone likes or comments on your posts, you'll see it here.
              </Text>
            </View>
          }
          renderItem={({ item: notification }) => {
            const actor = notification.actor;
            const initials = getInitials(actor?.full_name, actor?.username);
            const actorName =
              actor?.full_name ??
              (actor?.username ? `@${actor.username}` : 'Legacy Member');
            const actionPhrase =
              notification.type === 'post_like'
                ? ' liked your post'
                : notification.type === 'post_comment'
                  ? ' commented on your post'
                  : ' replied to your comment';
            const wasUnread = wasUnreadIds.has(notification.id);

            return (
              <Pressable
                onPress={() =>
                  router.push(`/post?id=${notification.post_id}` as any)
                }
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(201,168,76,0.08)',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                {/* Avatar + type badge */}
                <View style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#1c1a14',
                      borderWidth: 1,
                      borderColor: 'rgba(201,168,76,0.22)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {actor?.avatar_url ? (
                      <Image
                        source={{ uri: actor.avatar_url }}
                        style={{ width: 40, height: 40 }}
                      />
                    ) : (
                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: '#FFFFFF' }}>
                        {initials}
                      </Text>
                    )}
                  </View>
                  {/* Type badge */}
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: '#0a0900',
                      borderWidth: 1,
                      borderColor: '#1c1a14',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name={
                        notification.type === 'post_like'
                          ? 'heart'
                          : notification.type === 'post_comment'
                            ? 'chatbubble'
                            : 'arrow-undo'
                      }
                      size={10}
                      color="#c9a84c"
                    />
                  </View>
                </View>

                {/* Text */}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: '#FFFFFF', lineHeight: 20 }}>
                    <Text style={{ fontFamily: Fonts.bodySemiBold }}>{actorName}</Text>
                    {actionPhrase}
                  </Text>
                  <Text
                    style={{
                      fontFamily: Fonts.body,
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.55)',
                      marginTop: 2,
                    }}
                  >
                    {formatRelativeTime(notification.created_at)}
                  </Text>
                </View>

                {/* Unread dot */}
                {wasUnread && (
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#c9a84c',
                      marginLeft: 10,
                      flexShrink: 0,
                    }}
                  />
                )}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
