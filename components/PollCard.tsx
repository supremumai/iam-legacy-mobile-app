import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { getInitials } from '../lib/avatar';
import { formatRelativeTime } from '../lib/time';
import { Poll, PollOption, PollWithMeta, PostWithAuthor } from '../types/database';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';
import { useLanguage } from '../contexts/LanguageContext';

interface PollCardProps {
  post: PostWithAuthor;
  pollMeta: PollWithMeta;
  currentUserId: string | undefined;
  onVoteChange: (updated: PollWithMeta) => void;
}

function formatCloses(
  closesAt: string | null,
  isClosed: boolean,
  t: (key: string, params?: object) => string,
): string {
  if (!closesAt) return '';
  if (isClosed) return t('community.poll_closed_suffix');
  const diffMs = new Date(closesAt).getTime() - Date.now();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return t('community.poll_closes_under_1h_suffix');
  if (hours < 24) return t('community.poll_closes_in_hours_suffix', { hours });
  return t('community.poll_closes_in_days_suffix', { days: Math.floor(hours / 24) });
}

export default function PollCard({
  post,
  pollMeta,
  currentUserId,
  onVoteChange,
}: PollCardProps) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [localMeta, setLocalMeta] = useState<PollWithMeta>(pollMeta);
  const [voting, setVoting] = useState(false);

  // Sync when parent refreshes the feed
  useEffect(() => {
    setLocalMeta(pollMeta);
  }, [pollMeta]);

  const author = post.author;
  const initials = getInitials(author?.full_name, author?.username);
  const displayName =
    author?.full_name ?? (author?.username ? `@${author.username}` : 'Legacy Member');
  const subLine = author?.username
    ? `@${author.username} · ${formatRelativeTime(post.created_at, locale)}`
    : formatRelativeTime(post.created_at, locale);

  const { poll, options, userVotedOptionIds, total_votes } = localMeta;
  const isClosed = poll.closes_at !== null && new Date(poll.closes_at) < new Date();
  const hasVoted = userVotedOptionIds.length > 0;
  const showResults = hasVoted || isClosed;

  const handleOptionPress = useCallback(
    async (optionId: string) => {
      if (voting || !currentUserId || isClosed) return;

      const isCurrentlyVoted = userVotedOptionIds.includes(optionId);

      let newVotedIds: string[];
      let newOptions: PollOption[];

      if (poll.allow_multiple) {
        if (isCurrentlyVoted) {
          newVotedIds = userVotedOptionIds.filter((id) => id !== optionId);
          newOptions = options.map((o) =>
            o.id === optionId ? { ...o, votes_count: Math.max(0, o.votes_count - 1) } : o,
          );
        } else {
          newVotedIds = [...userVotedOptionIds, optionId];
          newOptions = options.map((o) =>
            o.id === optionId ? { ...o, votes_count: o.votes_count + 1 } : o,
          );
        }
      } else {
        // Single-choice: change vote — DB trigger removes the previous one
        const previousVotedId = userVotedOptionIds[0] ?? null;
        newVotedIds = [optionId];
        newOptions = options.map((o) => {
          if (o.id === optionId) return { ...o, votes_count: o.votes_count + 1 };
          if (previousVotedId && o.id === previousVotedId)
            return { ...o, votes_count: Math.max(0, o.votes_count - 1) };
          return o;
        });
      }

      const newTotal = newOptions.reduce((sum, o) => sum + o.votes_count, 0);
      const optimisticMeta: PollWithMeta = {
        ...localMeta,
        options: newOptions,
        userVotedOptionIds: newVotedIds,
        total_votes: newTotal,
      };

      const prevMeta = localMeta;
      setLocalMeta(optimisticMeta);
      onVoteChange(optimisticMeta);
      setVoting(true);

      try {
        if (poll.allow_multiple && isCurrentlyVoted) {
          // Deselect: delete the specific vote row
          const { error } = await supabase
            .from('poll_votes')
            .delete()
            .eq('poll_id', poll.id)
            .eq('poll_option_id', optionId)
            .eq('user_id', currentUserId);
          if (error) throw error;
        } else {
          // Insert vote (DB trigger removes old single-choice vote automatically)
          const { error } = await supabase
            .from('poll_votes')
            .insert({ poll_id: poll.id, poll_option_id: optionId, user_id: currentUserId });
          if (error) throw error;
        }
      } catch (e) {
        // Rollback optimistic update
        setLocalMeta(prevMeta);
        onVoteChange(prevMeta);
        Alert.alert(
          t('community.could_not_vote'),
          e instanceof Error ? e.message : t('common.unknown_error'),
        );
      } finally {
        setVoting(false);
      }
    },
    [voting, currentUserId, isClosed, userVotedOptionIds, poll, options, localMeta, onVoteChange],
  );

  // ─── Shared avatar + name block ───────────────────────────────────────────
  const avatarBlock = (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {author?.avatar_url ? (
        <Image source={{ uri: author.avatar_url }} style={{ width: 40, height: 40 }} />
      ) : (
        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.textPrimary }}>
          {initials}
        </Text>
      )}
    </View>
  );

  const nameBlock = (
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.textPrimary }}>
        {displayName}
      </Text>
      <Text
        style={{
          fontFamily: Fonts.body,
          fontSize: 12,
          color: Colors.textMuted,
          marginTop: 1,
        }}
      >
        {subLine}
      </Text>
    </View>
  );

  return (
    <View
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 12,
      }}
    >
      {/* ── Header: same structure as PostCard ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
        {author?.id ? (
          <Pressable
            onPress={() => router.push(`/profile?id=${author.id}` as any)}
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
          >
            {({ pressed }) => (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  flex: 1,
                  opacity: pressed ? 0.7 : 1,
                }}
              >
                {avatarBlock}
                {nameBlock}
              </View>
            )}
          </Pressable>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {avatarBlock}
            {nameBlock}
          </View>
        )}

        {/* Poll badge */}
        <View
          style={{
            backgroundColor: Colors.borderSubtle,
            borderWidth: 1,
            borderColor: Colors.borderStrong,
            borderRadius: 100,
            paddingHorizontal: 8,
            paddingVertical: 3,
            marginLeft: 8,
          }}
        >
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 10, color: Colors.gold }}>
            {t('community.poll_badge')}
          </Text>
        </View>
      </View>

      {/* ── Poll question ── */}
      <Text
        style={{
          fontFamily: Fonts.bodySemiBold,
          fontSize: 15,
          color: Colors.textPrimary,
          lineHeight: 22,
          marginTop: 12,
          marginBottom: 10,
        }}
      >
        {poll.question}
      </Text>

      {/* ── Options ── */}
      {!showResults ? (
        // Not yet voted + poll open → tappable rows with radio/checkbox indicator
        <View style={{ gap: 8 }}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleOptionPress(option.id)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: Colors.whiteOverlay4,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              {/* Radio (circle) for single-choice, square for multiple */}
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: poll.allow_multiple ? 4 : 9,
                  borderWidth: 1.5,
                  borderColor: Colors.borderStrong,
                  flexShrink: 0,
                }}
              />
              <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: Colors.textPrimary, flex: 1 }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        // Results view: progress bars + percentages + voted check marks
        <View style={{ gap: 10 }}>
          {options.map((option) => {
            const pct =
              total_votes > 0
                ? Math.round((option.votes_count / total_votes) * 100)
                : 0;
            const isVoted = userVotedOptionIds.includes(option.id);

            const resultContent = (
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 5,
                  }}
                >
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 }}
                  >
                    {isVoted ? (
                      <Ionicons name="checkmark-circle" size={15} color={Colors.gold} />
                    ) : (
                      <View style={{ width: 15, height: 15 }} />
                    )}
                    <Text
                      style={{
                        fontFamily: Fonts.body,
                        fontSize: 13,
                        color: Colors.textPrimary,
                        flex: 1,
                      }}
                    >
                      {option.label}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: Fonts.bodySemiBold,
                      fontSize: 12,
                      color: Colors.textSecondary,
                      marginLeft: 8,
                    }}
                  >
                    {pct}%
                  </Text>
                </View>
                {/* Progress bar */}
                <View
                  style={{
                    height: 6,
                    backgroundColor: Colors.whiteOverlay10,
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      width: `${pct}%`,
                      height: 6,
                      backgroundColor: isVoted ? Colors.gold : Colors.borderStrong,
                      borderRadius: 3,
                    }}
                  />
                </View>
              </View>
            );

            if (isClosed) {
              return <View key={option.id}>{resultContent}</View>;
            }

            // Open poll in results mode: still tappable to change/toggle vote
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => handleOptionPress(option.id)}
                activeOpacity={0.8}
              >
                {resultContent}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ── Footer: vote count + closes info ── */}
      <Text
        style={{
          fontFamily: Fonts.body,
          fontSize: 12,
          color: Colors.textTertiary,
          marginTop: 12,
        }}
      >
        {total_votes === 1 ? t('community.one_vote') : t('community.count_votes', { count: total_votes })}
        {formatCloses(poll.closes_at, isClosed, t)}
      </Text>
    </View>
  );
}
