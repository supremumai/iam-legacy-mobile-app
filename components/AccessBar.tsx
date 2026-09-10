import { useEffect, useState } from 'react';
import { Pressable, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Fonts } from '../constants/fonts';

// Topics item removed (Batch 36). Row is now 3 icons: Notifications, Members, Leaderboard.
const ITEMS = [
  { icon: 'notifications-outline' as const, label: 'Notifications', route: '/notifications' },
  { icon: 'people-outline' as const, label: 'Members', route: '/members' },
  { icon: 'trophy-outline' as const, label: 'Leaderboard', route: '/leaderboard' },
] as const;

interface AccessBarProps {
  /** compact=true removes the standalone paddingHorizontal and marginTop so the
   *  component can be embedded inline inside a header row without misalignment. */
  compact?: boolean;
}

export default function AccessBar({ compact = false }: AccessBarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      try {
        const { count } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('is_read', false);
        setUnreadCount(count ?? 0);
      } catch (e) {
        console.warn('[AccessBar] unread count threw:', e);
        setUnreadCount(0);
      }
    })();
  }, [user?.id]);

  const badgeLabel = unreadCount >= 10 ? '9+' : String(unreadCount);

  return (
    // Flat nav-bar style: icons grouped left with gap, no card chrome per icon.
    // paddingHorizontal/marginTop only applied in standalone (non-compact) mode.
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: compact ? 0 : 20,
      marginTop: compact ? 0 : 16,
      gap: 4,
    }}>
      {ITEMS.map((item) => {
        const isNotifications = item.label === 'Notifications';
        const showBadge = isNotifications && unreadCount > 0;

        return (
          // position:relative keeps the badge anchored over the icon.
          <View key={item.label} style={{ position: 'relative' }}>
            {/* SAFE Pressable: padding is layout (static style); pressed-opacity in children. */}
            <Pressable
              onPress={() => router.push(item.route as any)}
              hitSlop={10}
              style={{ padding: 8 }}
            >
              {({ pressed }) => (
                <View style={{ opacity: pressed ? 0.6 : 1 }}>
                  <Ionicons name={item.icon} size={24} color="#c9a84c" />
                </View>
              )}
            </Pressable>

            {/* Unread badge — Notifications icon only */}
            {showBadge && (
              <View
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#EF4444',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: unreadCount >= 10 ? 4 : 0,
                }}
              >
                <Text
                  style={{
                    fontFamily: Fonts.bodyBold,
                    fontSize: 10,
                    color: '#FFFFFF',
                  }}
                >
                  {badgeLabel}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
