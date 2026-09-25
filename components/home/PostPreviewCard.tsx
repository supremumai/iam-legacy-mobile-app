import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../contexts/ThemeContext';
import { Fonts } from '../../constants/fonts';
import { HomePostCard } from '../../lib/home';
import { findFirstYouTubeVideoId, youTubeThumbnailUrl } from '../../lib/youtube';
import { getInitials } from '../../lib/avatar';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return `${Math.floor(d / 30)}mes`;
}

function AuthorHeader({ item, colors }: { item: HomePostCard; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      {/* Avatar */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {item.authorAvatar ? (
          <Image source={{ uri: item.authorAvatar }} style={{ width: 36, height: 36 }} />
        ) : (
          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 13, color: colors.textPrimary }}>
            {getInitials(item.authorName, undefined)}
          </Text>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary }} numberOfLines={1}>
          {item.authorName}
        </Text>
      </View>

      <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: colors.textMuted }}>
        {relativeTime(item.created_at)}
      </Text>
    </View>
  );
}

// ─── Text Post ────────────────────────────────────────────────────────────────

function TextPost({ item, colors }: { item: HomePostCard; colors: any }) {
  return (
    <>
      <AuthorHeader item={item} colors={colors} />
      <Text
        style={{
          fontFamily: Fonts.body,
          fontSize: 15,
          color: colors.textPrimary,
          lineHeight: 22,
        }}
        numberOfLines={3}
      >
        {item.content}
      </Text>
    </>
  );
}

// ─── Image Post ───────────────────────────────────────────────────────────────

function ImagePost({ item, colors }: { item: HomePostCard; colors: any }) {
  return (
    <>
      <AuthorHeader item={item} colors={colors} />
      <Image
        source={{ uri: item.image_url! }}
        style={{
          width: '100%',
          height: 160,
          borderRadius: 10,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        }}
        resizeMode="cover"
      />
      {item.content ? (
        <Text
          style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.textMuted, lineHeight: 20 }}
          numberOfLines={2}
        >
          {item.content}
        </Text>
      ) : null}
    </>
  );
}

// ─── Video Post ───────────────────────────────────────────────────────────────

function VideoPost({ item, colors }: { item: HomePostCard; colors: any }) {
  const videoId = findFirstYouTubeVideoId(item.content);
  const thumb = item.image_url ?? (videoId ? youTubeThumbnailUrl(videoId) : null);

  return (
    <>
      <AuthorHeader item={item} colors={colors} />
      <View
        style={{
          width: '100%',
          height: 160,
          borderRadius: 10,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          marginBottom: 8,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {thumb ? (
          <Image source={{ uri: thumb }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} resizeMode="cover" />
        ) : null}
        {/* Play button overlay */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.gold,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="play" size={20} color="#0a0900" style={{ marginLeft: 3 }} />
        </View>
      </View>
      {item.content ? (
        <Text
          style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.textMuted, lineHeight: 20 }}
          numberOfLines={2}
        >
          {item.content}
        </Text>
      ) : null}
    </>
  );
}

// ─── Poll Post ────────────────────────────────────────────────────────────────

function PollPost({ item, colors }: { item: HomePostCard; colors: any }) {
  const total = item.pollTotalVotes;
  return (
    <>
      <AuthorHeader item={item} colors={colors} />
      <Text
        style={{
          fontFamily: Fonts.bodySemiBold,
          fontSize: 15,
          color: colors.textPrimary,
          marginBottom: 10,
          lineHeight: 22,
        }}
        numberOfLines={2}
      >
        {item.pollQuestion ?? item.content}
      </Text>
      <View style={{ gap: 6 }}>
        {item.pollOptions.slice(0, 4).map((opt) => {
          const pct = total > 0 ? Math.round((opt.votes_count / total) * 100) : 0;
          return (
            <View
              key={opt.id}
              style={{
                height: 36,
                backgroundColor: '#111008',
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                overflow: 'hidden',
                justifyContent: 'center',
              }}
            >
              {/* Fill bar */}
              {pct > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${pct}%`,
                    backgroundColor: 'rgba(201,168,76,0.25)',
                  }}
                />
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.textPrimary }} numberOfLines={1}>
                  {opt.label}
                </Text>
                {total > 0 && (
                  <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: colors.gold }}>
                    {pct}%
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
      <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: colors.textMuted, marginTop: 8 }}>
        {total} {total === 1 ? 'voto' : 'votos'}
      </Text>
    </>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

export default function PostPreviewCard({
  item,
  onPress,
}: {
  item: HomePostCard;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: '#1c1a14',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
      }}
    >
      {item.post_type === 'image' && item.image_url ? (
        <ImagePost item={item} colors={colors} />
      ) : item.post_type === 'video' ? (
        <VideoPost item={item} colors={colors} />
      ) : item.post_type === 'poll' ? (
        <PollPost item={item} colors={colors} />
      ) : (
        <TextPost item={item} colors={colors} />
      )}
    </TouchableOpacity>
  );
}
