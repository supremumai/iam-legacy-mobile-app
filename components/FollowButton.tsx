import { useEffect, useState } from 'react';
import { Pressable, Text, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Fonts } from '../constants/fonts';

interface FollowButtonProps {
  targetUserId: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ targetUserId, onFollowChange }: FollowButtonProps) {
  const { user, refreshProfile } = useAuth();
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Guard: never render for own profile
  if (user?.id && targetUserId === user.id) return null;

  useEffect(() => {
    if (!user?.id || !targetUserId) {
      setIsFollowing(false);
      setChecking(false);
      return;
    }

    let cancelled = false;
    setChecking(true);

    (async () => {
      try {
        const { data } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .maybeSingle();

        if (!cancelled) {
          setIsFollowing(data !== null);
        }
      } catch (e) {
        console.warn('[FollowButton] check error:', e);
        if (!cancelled) setIsFollowing(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [targetUserId, user?.id]);

  const handlePress = async () => {
    if (!user?.id || submitting || checking || isFollowing === null) return;

    const willFollow = !isFollowing;
    setSubmitting(true);
    setIsFollowing(willFollow); // optimistic

    try {
      if (willFollow) {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: targetUserId });

        if (error) {
          setIsFollowing(false); // revert
          Alert.alert('Could not follow', error.message);
          return;
        }
      } else {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) {
          setIsFollowing(true); // revert
          Alert.alert('Could not unfollow', error.message);
          return;
        }
      }

      onFollowChange?.(willFollow);
      refreshProfile(); // fire and forget
    } catch (e: unknown) {
      // Revert on unexpected throw
      setIsFollowing(!willFollow);
      Alert.alert(
        willFollow ? 'Could not follow' : 'Could not unfollow',
        e instanceof Error ? e.message : 'Unknown error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const following = isFollowing === true;

  return (
    <Pressable
      onPress={handlePress}
      disabled={checking || submitting}
      style={{
        backgroundColor: following ? '#1c1a14' : '#c9a84c',
        borderRadius: 999,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderWidth: following ? 1 : 0,
        borderColor: 'rgba(201,168,76,0.22)',
        opacity: submitting ? 0.6 : 1,
      }}
    >
      <Text
        style={{
          fontFamily: following ? Fonts.bodySemiBold : Fonts.bodyBold,
          fontSize: 13,
          color: following ? '#FFFFFF' : '#0a0900',
        }}
      >
        {following ? 'Following' : 'Follow'}
      </Text>
    </Pressable>
  );
}
