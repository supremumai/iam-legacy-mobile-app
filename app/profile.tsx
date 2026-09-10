import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getInitials } from '../lib/avatar';
import { fetchProfileWithTopics } from '../lib/profiles';
import { ProfileWithTopics } from '../types/database';
import { Fonts } from '../constants/fonts';
import LevelBadge from '../components/LevelBadge';

function formatCount(n: number): string {
  if (n >= 1000) {
    const formatted = (n / 1000).toFixed(1);
    return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'k' : formatted + 'k';
  }
  return n.toString();
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { profile: ownProfile, user, refreshProfile, loading: authLoading } = useAuth();

  const isOwnProfile = !id || id === user?.id;

  // ── Other-user state ──────────────────────────────────────────────────────
  const [viewedProfile, setViewedProfile] = useState<ProfileWithTopics | null>(null);
  const [loadingViewed, setLoadingViewed] = useState(false);
  const [viewedError, setViewedError] = useState(false);

  const handleLoadViewed = useCallback(async () => {
    if (!id) return;
    setLoadingViewed(true);
    setViewedError(false);
    const { data, error } = await fetchProfileWithTopics(id);
    if (error || !data) {
      setViewedError(true);
    } else {
      setViewedProfile(data);
    }
    setLoadingViewed(false);
  }, [id]);

  useEffect(() => {
    if (isOwnProfile || !id) return;
    handleLoadViewed();
  }, [id, isOwnProfile, handleLoadViewed]);

  // ── Activity counts (Posts / Comments / Resources) ───────────────────────
  const targetUserId = isOwnProfile ? user?.id : id;

  const [postsCount, setPostsCount] = useState<number>(0);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [commentsCount, setCommentsCount] = useState<number>(0);
  const [loadingComments, setLoadingComments] = useState(true);

  const [resourcesCount, setResourcesCount] = useState<number>(0);
  const [loadingResources, setLoadingResources] = useState(true);

  useEffect(() => {
    setPostsCount(0);
    setCommentsCount(0);
    setResourcesCount(0);
    setLoadingPosts(true);
    setLoadingComments(true);
    setLoadingResources(true);

    if (!targetUserId) {
      setLoadingPosts(false);
      setLoadingComments(false);
      setLoadingResources(false);
      return;
    }

    (async () => {
      try {
        const { count } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', targetUserId);
        setPostsCount(count ?? 0);
      } catch (e) {
        console.warn('[Profile] posts count threw:', e);
        setPostsCount(0);
      } finally {
        setLoadingPosts(false);
      }
    })();

    (async () => {
      try {
        const { count } = await supabase
          .from('post_comments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', targetUserId);
        setCommentsCount(count ?? 0);
      } catch (e) {
        console.warn('[Profile] comments count threw:', e);
        setCommentsCount(0);
      } finally {
        setLoadingComments(false);
      }
    })();

    (async () => {
      try {
        const { count } = await supabase
          .from('resources')
          .select('id', { count: 'exact', head: true })
          .eq('submitted_by', targetUserId);
        setResourcesCount(count ?? 0);
      } catch (e) {
        console.warn('[Profile] resources count threw:', e);
        setResourcesCount(0);
      } finally {
        setLoadingResources(false);
      }
    })();
  }, [targetUserId]);

  // ── Loading ───────────────────────────────────────────────────────────────
  const isLoading = isOwnProfile ? authLoading : loadingViewed;
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0900', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#c9a84c" size="large" />
      </View>
    );
  }

  // ── Error / null ──────────────────────────────────────────────────────────
  const activeProfile: ProfileWithTopics | null = isOwnProfile ? ownProfile : viewedProfile;
  const hasError = isOwnProfile ? !ownProfile : viewedError || !viewedProfile;
  const handleRetry = isOwnProfile ? refreshProfile : handleLoadViewed;

  if (!activeProfile || hasError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0900', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 16, color: '#FFFFFF', marginBottom: 16, textAlign: 'center' }}>
          Could not load profile
        </Text>
        <Pressable
          onPress={handleRetry}
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
    );
  }

  const initials = getInitials(activeProfile.full_name, activeProfile.username);

  // ── Name / role fallbacks differ by branch ────────────────────────────────
  const displayName = isOwnProfile
    ? (activeProfile.full_name ?? 'Complete your profile')
    : (activeProfile.full_name ?? (activeProfile.username ? `@${activeProfile.username}` : 'Legacy Member'));

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
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

        {/* Hero zone */}
        <View
          style={{
            backgroundColor: '#111008',
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            alignItems: 'center',
            paddingTop: 8,
            paddingBottom: 32,
            paddingHorizontal: 20,
            overflow: 'hidden',
          }}
        >
          {/* Cover photo background — purely additive, shown only when cover_url is set */}
          {activeProfile.cover_url ? (
            <Image
              source={{ uri: activeProfile.cover_url }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 140,
              }}
              resizeMode="cover"
            />
          ) : null}

          {/* Avatar */}
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: '#1c1a14',
              borderWidth: 2,
              borderColor: 'rgba(201,168,76,0.22)',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {activeProfile.avatar_url ? (
              <Image source={{ uri: activeProfile.avatar_url }} style={{ width: 88, height: 88 }} />
            ) : (
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 30, color: '#FFFFFF' }}>
                {initials}
              </Text>
            )}
          </View>

          {/* Name */}
          <Text
            style={{
              fontFamily: Fonts.heading,
              fontSize: 22,
              color: '#FFFFFF',
              marginTop: 12,
              textAlign: 'center',
            }}
          >
            {displayName}
          </Text>

          {/* Username */}
          {activeProfile.username ? (
            <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              @{activeProfile.username}
            </Text>
          ) : null}

          {/* Role */}
          {activeProfile.role ? (
            <Text style={{ fontFamily: Fonts.body, fontSize: 14, marginTop: 4, color: 'rgba(255,255,255,0.55)' }}>
              {activeProfile.role}
            </Text>
          ) : isOwnProfile ? (
            <Text style={{ fontFamily: Fonts.body, fontSize: 14, marginTop: 4, color: 'rgba(255,255,255,0.35)' }}>
              Add your role
            </Text>
          ) : null}

          {/* Location */}
          {activeProfile.location ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Ionicons name="location-outline" size={13} color="#c9a84c" />
              <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                {activeProfile.location}
              </Text>
            </View>
          ) : null}

          {/* Level badge */}
          <View style={{ marginTop: 8 }}>
            <LevelBadge points={activeProfile.points} />
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', marginTop: 20, marginBottom: 2, gap: 40 }}>
            {[
              { value: loadingPosts ? '—' : formatCount(postsCount), label: 'Posts' },
              { value: loadingComments ? '—' : formatCount(commentsCount), label: 'Comments' },
              { value: loadingResources ? '—' : formatCount(resourcesCount), label: 'Resources' },
            ].map((stat) => (
              <View key={stat.label} style={{ alignItems: 'center' }}>
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 20, color: '#c9a84c' }}>
                  {stat.value}
                </Text>
                <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action row */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginTop: 16, gap: 12, alignItems: 'center' }}>
          {isOwnProfile ? (
            // Branch A: Edit Profile + Share
            <>
              <Pressable
                onPress={() => router.push('/edit-profile' as any)}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: '#1c1a14',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(201,168,76,0.22)',
                  alignItems: 'center',
                  paddingVertical: 14,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Ionicons name="create-outline" size={22} color="#c9a84c" />
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: '#FFFFFF', marginTop: 4 }}>
                  Edit Profile
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {}}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: '#1c1a14',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(201,168,76,0.22)',
                  alignItems: 'center',
                  paddingVertical: 14,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Ionicons name="share-social-outline" size={22} color="#c9a84c" />
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: '#FFFFFF', marginTop: 4 }}>
                  Share
                </Text>
              </Pressable>
            </>
          ) : (
            // Branch B: Share only
            <Pressable
              onPress={() => {}}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: '#1c1a14',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(201,168,76,0.22)',
                alignItems: 'center',
                paddingVertical: 14,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="share-social-outline" size={22} color="#c9a84c" />
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: '#FFFFFF', marginTop: 4 }}>
                Share
              </Text>
            </Pressable>
          )}
        </View>

        {/* About section */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontFamily: Fonts.heading, fontSize: 18, color: '#c9a84c' }}>About</Text>
          <View
            style={{
              marginTop: 10,
              backgroundColor: '#1c1a14',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(201,168,76,0.22)',
              padding: 16,
            }}
          >
            {activeProfile.bio ? (
              <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: '#FFFFFF', lineHeight: 22 }}>
                {activeProfile.bio}
              </Text>
            ) : (
              <View>
                <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.35)', lineHeight: 22 }}>
                  Add a bio to tell the community who you are.
                </Text>
                {/* "Add bio" link only appears on own profile */}
                {isOwnProfile && (
                  <Pressable onPress={() => router.push('/edit-profile' as any)}>
                    <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: '#c9a84c', marginTop: 8 }}>
                      Add bio
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Topics */}
            {activeProfile.topics && activeProfile.topics.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 8 }}>
                {activeProfile.topics.map((topic) => (
                  <View
                    key={topic.id}
                    style={{
                      backgroundColor: '#111008',
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: 'rgba(201,168,76,0.22)',
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: '#c9a84c' }}>
                      #{topic.name.replace(/\s+/g, '')}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
