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
import { useLanguage } from '../../../contexts/LanguageContext';
import { useColors } from '../../../contexts/ThemeContext';
import { Fonts } from '../../../constants/fonts';
import ActionSheet from '../../../components/ActionSheet';
import {
  createModule,
  updateModule,
  deleteModule,
  getNextModuleOrderIndex,
} from '../../../lib/education';
import { supabase } from '../../../lib/supabase';

export default function ModuleFormScreen() {
  const { id, course_id } = useLocalSearchParams<{ id?: string; course_id?: string }>();
  const isEdit = !!id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();

  const [courseId, setCourseId] = useState(course_id ?? '');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [keyTerms, setKeyTerms] = useState<string[]>([]);
  const [termInput, setTermInput] = useState('');
  const [orderIndex, setOrderIndex] = useState(1);
  const [isPublished, setIsPublished] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) {
      if (courseId) getNextModuleOrderIndex(courseId).then(setOrderIndex);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('edu_modules')
        .select('title, summary, key_terms, order_index, is_published, course_id')
        .eq('id', id)
        .single();
      if (data) {
        setTitle(data.title ?? '');
        setSummary(data.summary ?? '');
        setKeyTerms(Array.isArray(data.key_terms) ? data.key_terms : []);
        setOrderIndex(data.order_index ?? 1);
        setIsPublished(data.is_published ?? false);
        setCourseId(data.course_id ?? '');
      }
      setLoading(false);
    })();
  }, [id, isEdit, courseId]);

  const addTerm = () => {
    const term = termInput.trim();
    if (term && !keyTerms.includes(term)) {
      setKeyTerms((prev) => [...prev, term]);
    }
    setTermInput('');
  };

  const removeTerm = (term: string) => {
    setKeyTerms((prev) => prev.filter((t) => t !== term));
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
      summary: summary.trim() || null,
      key_terms: keyTerms.length > 0 ? keyTerms : null,
      order_index: orderIndex,
      is_published: isPublished,
    };
    let savedId: string | null = isEdit ? id! : null;
    let err: string | null = null;
    if (isEdit) {
      err = await updateModule(id!, fields);
    } else {
      const result = await createModule(courseId, fields);
      if ('error' in result) {
        err = result.error;
      } else {
        savedId = result.id;
      }
    }
    setSaving(false);
    if (err) {
      Alert.alert(t('common.error'), err);
    } else if (savedId) {
      // Navigate directly into the module admin panel (video + quiz setup)
      router.replace(`/education/module/${savedId}` as any);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    setSaving(true);
    const err = await deleteModule(id!);
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
            {isEdit ? t('education.admin_edit_module') : t('education.admin_new_module')}
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

          {/* Summary */}
          <View>
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('education.admin_field_summary')}
            </Text>
            <TextInput
              value={summary}
              onChangeText={setSummary}
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
              placeholder={t('education.admin_field_summary')}
            />
          </View>

          {/* Key Terms chip input */}
          <View>
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('education.admin_field_key_terms')}
            </Text>
            {/* Chips */}
            {keyTerms.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {keyTerms.map((term) => (
                  <Pressable
                    key={term}
                    onPress={() => removeTerm(term)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: GOLD, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}
                  >
                    <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: GOLD }}>{term}</Text>
                    <Ionicons name="close" size={12} color={GOLD} />
                  </Pressable>
                ))}
              </View>
            )}
            {/* Input row */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={termInput}
                onChangeText={setTermInput}
                onSubmitEditing={addTerm}
                returnKeyType="done"
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  fontFamily: Fonts.body,
                  fontSize: 14,
                  color: colors.textPrimary,
                }}
                placeholderTextColor={colors.textFaint}
                placeholder={t('education.admin_key_terms_placeholder')}
              />
              <TouchableOpacity
                onPress={addTerm}
                activeOpacity={0.75}
                style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: GOLD, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="add" size={20} color={GOLD} />
              </TouchableOpacity>
            </View>
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

          {/* Save & Set Up Video button */}
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
                {isEdit ? t('education.admin_save') : t('education.admin_save_and_continue')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ActionSheet
        visible={deleteSheetVisible}
        onClose={() => setDeleteSheetVisible(false)}
        title={t('education.admin_delete_module_warn')}
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
