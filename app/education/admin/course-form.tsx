import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useColors } from '../../../contexts/ThemeContext';
import { Fonts } from '../../../constants/fonts';
import ActionSheet from '../../../components/ActionSheet';
import { pickAndUploadImage } from '../../../lib/upload';
import {
  createCourse,
  updateCourse,
  deleteCourse,
  getNextCourseOrderIndex,
} from '../../../lib/education';
import { supabase } from '../../../lib/supabase';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

export default function CourseFormScreen() {
  const { id, track_id } = useLocalSearchParams<{ id?: string; track_id?: string }>();
  const isEdit = !!id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLanguage();
  const colors = useColors();

  const [trackId, setTrackId] = useState(track_id ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [orderIndex, setOrderIndex] = useState(1);
  const [isPublished, setIsPublished] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) {
      if (trackId) getNextCourseOrderIndex(trackId).then(setOrderIndex);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('edu_courses')
        .select('title, description, difficulty, thumbnail_url, order_index, is_published, track_id')
        .eq('id', id)
        .single();
      if (data) {
        setTitle(data.title ?? '');
        setDescription(data.description ?? '');
        setDifficulty(data.difficulty ?? null);
        setThumbnailUrl(data.thumbnail_url ?? null);
        setOrderIndex(data.order_index ?? 1);
        setIsPublished(data.is_published ?? false);
        setTrackId(data.track_id ?? '');
      }
      setLoading(false);
    })();
  }, [id, isEdit, trackId]);

  const handlePickThumbnail = async () => {
    if (!user?.id) return;
    setUploadingThumb(true);
    const result = await pickAndUploadImage(user.id, 'posts', { aspect: [16, 9] });
    setUploadingThumb(false);
    if ('url' in result) setThumbnailUrl(result.url);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError(t('education.admin_title_required'));
      return;
    }
    setTitleError('');
    setSaving(true);
    const fields = {
      title: title.trim(),
      description: description.trim() || null,
      difficulty,
      thumbnail_url: thumbnailUrl,
      order_index: orderIndex,
      is_published: isPublished,
    };
    let err: string | null = null;
    if (isEdit) {
      err = await updateCourse(id!, fields);
    } else {
      const result = await createCourse(trackId, fields);
      if ('error' in result) err = result.error;
    }
    setSaving(false);
    if (err) {
      Alert.alert(t('common.error'), err);
    } else {
      router.back();
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    setSaving(true);
    const err = await deleteCourse(id!);
    setSaving(false);
    if (err) {
      Alert.alert(t('common.error'), err);
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  const GOLD = colors.gold;
  const BG = colors.background;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Ionicons name="arrow-back" size={24} color={GOLD} />
          </Pressable>
          <Text style={{ fontFamily: Fonts.heading, fontSize: 20, color: GOLD, flex: 1 }}>
            {isEdit ? t('education.admin_edit_course') : t('education.admin_new_course')}
          </Text>
          {isEdit && (
            <Pressable onPress={() => setDeleteSheetVisible(true)} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </Pressable>
          )}
        </View>

        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          {/* Title */}
          <View>
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('education.admin_field_title')} *
            </Text>
            <TextInput
              value={title}
              onChangeText={(v) => { setTitle(v); setTitleError(''); }}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: titleError ? colors.error : colors.border,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontFamily: Fonts.body,
                fontSize: 15,
                color: colors.textPrimary,
              }}
              placeholderTextColor={colors.textFaint}
              placeholder={t('education.admin_field_title')}
            />
            {!!titleError && <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: colors.error, marginTop: 4 }}>{titleError}</Text>}
          </View>

          {/* Description */}
          <View>
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('education.admin_field_description')}
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontFamily: Fonts.body,
                fontSize: 15,
                color: colors.textPrimary,
                minHeight: 96,
              }}
              placeholderTextColor={colors.textFaint}
              placeholder={t('education.admin_field_description')}
            />
          </View>

          {/* Difficulty pills */}
          <View>
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('education.admin_field_difficulty')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {DIFFICULTIES.map((d) => {
                const selected = difficulty === d;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setDifficulty(selected ? null : d)}
                    activeOpacity={0.75}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 99,
                      borderWidth: 1.5,
                      borderColor: selected ? GOLD : colors.border,
                      backgroundColor: selected ? colors.borderSubtle : 'transparent',
                    }}
                  >
                    <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: selected ? GOLD : colors.textMuted }}>
                      {t(`education.difficulty_${d}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Thumbnail */}
          <View>
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('education.admin_field_thumbnail')}
            </Text>
            <TouchableOpacity
              onPress={uploadingThumb ? undefined : handlePickThumbnail}
              activeOpacity={0.75}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                opacity: uploadingThumb ? 0.6 : 1,
              }}
            >
              {uploadingThumb ? (
                <ActivityIndicator size="small" color={GOLD} />
              ) : (
                <Ionicons name={thumbnailUrl ? 'image' : 'image-outline'} size={20} color={GOLD} />
              )}
              <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: thumbnailUrl ? colors.textPrimary : colors.textFaint }}>
                {thumbnailUrl ? thumbnailUrl.split('/').pop() ?? t('education.admin_field_thumbnail') : t('education.admin_field_thumbnail')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Order */}
          <View>
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('education.admin_field_order')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setOrderIndex((v) => Math.max(1, v - 1))}
                activeOpacity={0.75}
                style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="remove" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 18, color: colors.textPrimary, minWidth: 32, textAlign: 'center' }}>{orderIndex}</Text>
              <TouchableOpacity
                onPress={() => setOrderIndex((v) => v + 1)}
                activeOpacity={0.75}
                style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="add" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Published toggle */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 }}>
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary }}>
              {t('education.admin_publish_toggle')}
            </Text>
            <Switch
              value={isPublished}
              onValueChange={setIsPublished}
              trackColor={{ false: colors.textFaint, true: colors.borderStrong }}
              thumbColor={isPublished ? GOLD : colors.textSecondary}
            />
          </View>

          {/* Save button */}
          <TouchableOpacity
            onPress={saving ? undefined : handleSave}
            activeOpacity={0.8}
            style={{
              backgroundColor: GOLD,
              borderRadius: 10,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 8,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <ActivityIndicator color={BG} size="small" />
            ) : (
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: BG }}>
                {t('education.admin_save')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ActionSheet
        visible={deleteSheetVisible}
        onClose={() => setDeleteSheetVisible(false)}
        title={t('education.admin_delete_course_warn')}
        actions={[
          {
            label: t('education.admin_delete'),
            icon: 'trash-outline',
            destructive: true,
            onPress: handleDelete,
          },
        ]}
      />
    </KeyboardAvoidingView>
  );
}
