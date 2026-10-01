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
import { supabase } from '../../../lib/supabase';
import {
  SimDealFact,
  SimZoningQuestion,
  SimSurpriseCard,
} from '../../../lib/simulator';

type LocalFact = Omit<SimDealFact, 'deal_id'> & { _new?: boolean };
type LocalQuestion = Omit<SimZoningQuestion, 'deal_id'> & { _new?: boolean };
type LocalCard = Omit<SimSurpriseCard, 'deal_id'> & { _new?: boolean };

function genTempId() {
  return `tmp_${Math.random().toString(36).slice(2)}`;
}

export default function DealFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLanguage();
  const colors = useColors();

  // Core fields
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [zoning, setZoning] = useState('');
  const [currentOwner, setCurrentOwner] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [floodZone, setFloodZone] = useState('');
  const [utilities, setUtilities] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [orderIndex, setOrderIndex] = useState(0);
  const [isPublished, setIsPublished] = useState(false);

  // Expert fields
  const [expertBuildSqft, setExpertBuildSqft] = useState('');
  const [expertCostPerSqft, setExpertCostPerSqft] = useState('120');
  const [expertClosingPct, setExpertClosingPct] = useState('5');
  const [expertHoldingMonths, setExpertHoldingMonths] = useState('7');
  const [expertSalePrice, setExpertSalePrice] = useState('');
  const [expertDecision, setExpertDecision] = useState('');
  const [expertRationale, setExpertRationale] = useState('');
  const [lesson, setLesson] = useState('');

  // Child lists
  const [facts, setFacts] = useState<LocalFact[]>([]);
  const [questions, setQuestions] = useState<LocalQuestion[]>([]);
  const [cards, setCards] = useState<LocalCard[]>([]);

  // UI state
  const [titleError, setTitleError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const [dealRes, factsRes, questionsRes, cardsRes] = await Promise.all([
        supabase.from('sim_deals').select('*').eq('id', id).single(),
        supabase.from('sim_deal_facts').select('*').eq('deal_id', id).order('order_index'),
        supabase.from('sim_zoning_questions').select('*').eq('deal_id', id).order('order_index'),
        supabase.from('sim_surprise_cards').select('*').eq('deal_id', id),
      ]);

      const d = dealRes.data as any;
      if (d) {
        setTitle(d.title ?? '');
        setAddress(d.address ?? '');
        setPrice(d.price != null ? String(d.price) : '');
        setPurchaseDate(d.purchase_date ?? '');
        setLotSize(d.lot_size_sqft != null ? String(d.lot_size_sqft) : '');
        setZoning(d.zoning ?? '');
        setCurrentOwner(d.current_owner ?? '');
        setJurisdiction(d.jurisdiction ?? '');
        setFloodZone(d.flood_zone ?? '');
        setUtilities(d.utilities ?? '');
        setImageUrl(d.image_url ?? null);
        setOrderIndex(d.order_index ?? 0);
        setIsPublished(d.is_published ?? false);
        setExpertBuildSqft(d.expert_build_sqft != null ? String(d.expert_build_sqft) : '');
        setExpertCostPerSqft(d.expert_cost_per_sqft != null ? String(d.expert_cost_per_sqft) : '120');
        setExpertClosingPct(d.expert_closing_pct != null ? String(d.expert_closing_pct) : '5');
        setExpertHoldingMonths(d.expert_holding_months != null ? String(d.expert_holding_months) : '7');
        setExpertSalePrice(d.expert_sale_price != null ? String(d.expert_sale_price) : '');
        setExpertDecision(d.expert_decision ?? '');
        setExpertRationale(d.expert_rationale ?? '');
        setLesson(d.lesson ?? '');
      }

      setFacts((factsRes.data ?? []) as LocalFact[]);
      setQuestions((questionsRes.data ?? []) as LocalQuestion[]);
      setCards((cardsRes.data ?? []) as LocalCard[]);
      setLoading(false);
    })();
  }, [id, isEdit]);

  const handlePickImage = async () => {
    if (!user?.id) return;
    setUploadingImage(true);
    const result = await pickAndUploadImage(user.id, 'posts', { aspect: [16, 9] });
    setUploadingImage(false);
    if ('url' in result) setImageUrl(result.url);
  };

  const handleSave = async () => {
    let hasError = false;
    if (!title.trim()) { setTitleError(t('simulator.admin_title_required')); hasError = true; }
    if (!address.trim()) { setAddressError(t('simulator.admin_address_required')); hasError = true; }
    if (hasError) return;
    setTitleError('');
    setAddressError('');
    setSaving(true);

    const fields = {
      title: title.trim(),
      address: address.trim(),
      price: parseFloat(price) || 0,
      purchase_date: purchaseDate.trim() || null,
      lot_size_sqft: lotSize ? parseInt(lotSize, 10) : null,
      zoning: zoning.trim() || null,
      current_owner: currentOwner.trim() || null,
      jurisdiction: jurisdiction.trim() || null,
      flood_zone: floodZone.trim() || null,
      utilities: utilities.trim() || null,
      image_url: imageUrl,
      order_index: orderIndex,
      is_published: isPublished,
      expert_build_sqft: expertBuildSqft ? parseInt(expertBuildSqft, 10) : null,
      expert_cost_per_sqft: expertCostPerSqft ? parseFloat(expertCostPerSqft) : null,
      expert_closing_pct: expertClosingPct ? parseFloat(expertClosingPct) : null,
      expert_holding_months: expertHoldingMonths ? parseInt(expertHoldingMonths, 10) : null,
      expert_sale_price: expertSalePrice ? parseFloat(expertSalePrice) : null,
      expert_decision: expertDecision.trim() || null,
      expert_rationale: expertRationale.trim() || null,
      lesson: lesson.trim() || null,
    };

    let dealId: string | null = isEdit ? id! : null;

    if (isEdit) {
      const { error } = await supabase.from('sim_deals').update(fields).eq('id', id!);
      if (error) { setSaving(false); Alert.alert(t('common.error'), error.message); return; }
    } else {
      const { data, error } = await supabase.from('sim_deals').insert(fields).select('id').single();
      if (error || !data) { setSaving(false); Alert.alert(t('common.error'), error?.message ?? t('common.unknown_error')); return; }
      dealId = (data as any).id;
    }

    // Sync facts
    await syncChildList('sim_deal_facts', dealId!, facts, (f, idx) => ({
      deal_id: dealId,
      order_index: idx,
      title: f.title,
      content: f.content,
      icon: f.icon ?? 'search-outline',
    }));

    // Sync questions
    await syncChildList('sim_zoning_questions', dealId!, questions, (q, idx) => ({
      deal_id: dealId,
      order_index: idx,
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c ?? null,
      correct_option: q.correct_option,
      explanation: q.explanation,
    }));

    // Sync cards
    await syncChildList('sim_surprise_cards', dealId!, cards, (c) => ({
      deal_id: dealId,
      title: c.title,
      description: c.description,
      impact_type: c.impact_type ?? null,
      impact_amount: c.impact_amount ?? 0,
      related_fact_title: c.related_fact_title ?? null,
    }));

    setSaving(false);
    router.back();
  };

  async function syncChildList<T extends { id: string; _new?: boolean }>(
    table: string,
    dealId: string,
    items: T[],
    toRow: (item: T, idx: number) => Record<string, unknown>,
  ) {
    const existing = items.filter((i) => !i._new);
    const newItems = items.filter((i) => i._new);

    // Upsert existing
    for (let idx = 0; idx < existing.length; idx++) {
      const row = { id: existing[idx].id, ...toRow(existing[idx], idx) };
      await supabase.from(table).upsert(row);
    }

    // Insert new
    for (let idx = 0; idx < newItems.length; idx++) {
      const row = toRow(newItems[idx], existing.length + idx);
      await supabase.from(table).insert({ ...row, deal_id: dealId });
    }

    // Delete removed (items that were in DB but not in current list)
    // We track by presence: existing IDs that are still in the list are kept
    const keptIds = new Set(existing.map((i) => i.id));
    // Fetch current DB IDs
    const { data } = await supabase.from(table).select('id').eq('deal_id', dealId);
    const dbIds: string[] = (data ?? []).map((r: any) => r.id);
    const toDelete = dbIds.filter((dbId) => !keptIds.has(dbId) && !newItems.some((n) => n.id === dbId));
    if (toDelete.length > 0) {
      await supabase.from(table).delete().in('id', toDelete);
    }
  }

  const handleDelete = async () => {
    if (!isEdit) return;
    setSaving(true);
    const { error } = await supabase.from('sim_deals').delete().eq('id', id!);
    setSaving(false);
    if (error) { Alert.alert(t('common.error'), error.message); return; }
    router.back();
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

  const fieldLabel = (label: string, required?: boolean) => (
    <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {label}{required ? ' *' : ''}
    </Text>
  );

  const textInput = (value: string, onChange: (v: string) => void, placeholder: string, opts?: { multiline?: boolean; keyboardType?: any; error?: string }) => (
    <View style={{ marginBottom: opts?.error ? 0 : 0 }}>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={opts?.multiline}
        numberOfLines={opts?.multiline ? 4 : 1}
        textAlignVertical={opts?.multiline ? 'top' : undefined}
        keyboardType={opts?.keyboardType}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: opts?.error ? colors.error : colors.border,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontFamily: Fonts.body,
          fontSize: 15,
          color: colors.textPrimary,
          minHeight: opts?.multiline ? 88 : undefined,
        }}
        placeholderTextColor={colors.textFaint}
        placeholder={placeholder}
      />
      {!!opts?.error && (
        <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: colors.error, marginTop: 4 }}>{opts.error}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Header */}
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Ionicons name="arrow-back" size={24} color={GOLD} />
          </Pressable>
          <Text style={{ fontFamily: Fonts.heading, fontSize: 20, color: GOLD, flex: 1 }}>
            {isEdit ? t('simulator.admin_form_title_edit') : t('simulator.admin_form_title_new')}
          </Text>
          {isEdit && (
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Pressable
                onPress={() => router.push(`/simulator/${id}` as any)}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="eye-outline" size={18} color={GOLD} />
                  <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: GOLD }}>
                    {t('simulator.admin_preview')}
                  </Text>
                </View>
              </Pressable>
              <Pressable onPress={() => setDeleteSheetVisible(true)} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </Pressable>
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          {/* Title */}
          <View>
            {fieldLabel(t('simulator.admin_field_title'), true)}
            {textInput(title, (v) => { setTitle(v); setTitleError(''); }, t('simulator.admin_field_title'), { error: titleError })}
          </View>

          {/* Address */}
          <View>
            {fieldLabel(t('simulator.admin_field_address'), true)}
            {textInput(address, (v) => { setAddress(v); setAddressError(''); }, t('simulator.admin_field_address'), { error: addressError })}
          </View>

          {/* Price */}
          <View>
            {fieldLabel(t('simulator.admin_field_price'))}
            {textInput(price, setPrice, t('simulator.admin_field_price'), { keyboardType: 'numeric' })}
          </View>

          {/* Purchase Date */}
          <View>
            {fieldLabel(t('simulator.admin_field_purchase_date'))}
            {textInput(purchaseDate, setPurchaseDate, 'e.g. Jan 2024')}
          </View>

          {/* Lot Size */}
          <View>
            {fieldLabel(t('simulator.admin_field_lot_size'))}
            {textInput(lotSize, setLotSize, t('simulator.admin_field_lot_size'), { keyboardType: 'numeric' })}
          </View>

          {/* Zoning */}
          <View>
            {fieldLabel(t('simulator.admin_field_zoning'))}
            {textInput(zoning, setZoning, 'e.g. R-2')}
          </View>

          {/* Current Owner */}
          <View>
            {fieldLabel(t('simulator.admin_field_current_owner'))}
            {textInput(currentOwner, setCurrentOwner, t('simulator.admin_field_current_owner'))}
          </View>

          {/* Jurisdiction */}
          <View>
            {fieldLabel(t('simulator.admin_field_jurisdiction'))}
            {textInput(jurisdiction, setJurisdiction, t('simulator.admin_field_jurisdiction'))}
          </View>

          {/* Flood Zone */}
          <View>
            {fieldLabel(t('simulator.admin_field_flood_zone'))}
            {textInput(floodZone, setFloodZone, 'e.g. Zone X')}
          </View>

          {/* Utilities */}
          <View>
            {fieldLabel(t('simulator.admin_field_utilities'))}
            {textInput(utilities, setUtilities, t('simulator.admin_field_utilities'))}
          </View>

          {/* Image */}
          <View>
            {fieldLabel(t('simulator.admin_field_image'))}
            <TouchableOpacity
              onPress={uploadingImage ? undefined : handlePickImage}
              activeOpacity={0.75}
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: uploadingImage ? 0.6 : 1 }}
            >
              {uploadingImage ? <ActivityIndicator size="small" color={GOLD} /> : <Ionicons name={imageUrl ? 'image' : 'image-outline'} size={20} color={GOLD} />}
              <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: imageUrl ? colors.textPrimary : colors.textFaint }} numberOfLines={1}>
                {imageUrl ? imageUrl.split('/').pop() : t('simulator.admin_field_image')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Order */}
          <View>
            {fieldLabel(t('simulator.admin_field_order'))}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => setOrderIndex((v) => Math.max(0, v - 1))} activeOpacity={0.75} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="remove" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 18, color: colors.textPrimary, minWidth: 32, textAlign: 'center' }}>{orderIndex}</Text>
              <TouchableOpacity onPress={() => setOrderIndex((v) => v + 1)} activeOpacity={0.75} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="add" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Published toggle */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 }}>
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary }}>{t('simulator.admin_publish_toggle')}</Text>
            <Switch value={isPublished} onValueChange={setIsPublished} trackColor={{ false: colors.textFaint, true: colors.borderStrong }} thumbColor={isPublished ? GOLD : colors.textSecondary} />
          </View>

          {/* ── EXPERT SECTION ── */}
          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: GOLD, marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>Expert Analysis</Text>

          <View>
            {fieldLabel(t('simulator.admin_field_expert_build_sqft'))}
            {textInput(expertBuildSqft, setExpertBuildSqft, t('simulator.admin_field_expert_build_sqft'), { keyboardType: 'numeric' })}
          </View>
          <View>
            {fieldLabel(t('simulator.admin_field_expert_cost_per_sqft'))}
            {textInput(expertCostPerSqft, setExpertCostPerSqft, '120', { keyboardType: 'numeric' })}
          </View>
          <View>
            {fieldLabel(t('simulator.admin_field_expert_closing_pct'))}
            {textInput(expertClosingPct, setExpertClosingPct, '5', { keyboardType: 'numeric' })}
          </View>
          <View>
            {fieldLabel(t('simulator.admin_field_expert_holding_months'))}
            {textInput(expertHoldingMonths, setExpertHoldingMonths, '7', { keyboardType: 'numeric' })}
          </View>
          <View>
            {fieldLabel(t('simulator.admin_field_expert_sale_price'))}
            {textInput(expertSalePrice, setExpertSalePrice, t('simulator.admin_field_expert_sale_price'), { keyboardType: 'numeric' })}
          </View>
          <View>
            {fieldLabel(t('simulator.admin_field_expert_decision'))}
            {textInput(expertDecision, setExpertDecision, 'Build / Pass')}
          </View>
          <View>
            {fieldLabel(t('simulator.admin_field_expert_rationale'))}
            {textInput(expertRationale, setExpertRationale, t('simulator.admin_field_expert_rationale'), { multiline: true })}
          </View>
          <View>
            {fieldLabel(t('simulator.admin_field_lesson'))}
            {textInput(lesson, setLesson, t('simulator.admin_field_lesson'), { multiline: true })}
          </View>

          {/* ── FACTS ── */}
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: GOLD }}>{t('simulator.admin_facts_section')}</Text>
              <TouchableOpacity onPress={() => setFacts((prev) => [...prev, { id: genTempId(), order_index: prev.length, title: '', content: '', icon: 'search-outline', _new: true }])} activeOpacity={0.7}>
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: GOLD }}>{t('simulator.admin_add_fact')}</Text>
              </TouchableOpacity>
            </View>
            {facts.map((fact, idx) => (
              <View key={fact.id} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: colors.textMuted }}>Fact {idx + 1}</Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity disabled={idx === 0} onPress={() => setFacts((prev) => { const a = [...prev]; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; return a; })}>
                      <Ionicons name="arrow-up" size={16} color={idx === 0 ? colors.textFaint : colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity disabled={idx === facts.length - 1} onPress={() => setFacts((prev) => { const a = [...prev]; [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]]; return a; })}>
                      <Ionicons name="arrow-down" size={16} color={idx === facts.length - 1 ? colors.textFaint : colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setFacts((prev) => prev.filter((_, i) => i !== idx))}>
                      <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <TextInput value={fact.title} onChangeText={(v) => setFacts((prev) => prev.map((f, i) => i === idx ? { ...f, title: v } : f))} placeholder={t('simulator.admin_fact_title')} placeholderTextColor={colors.textFaint} style={{ color: colors.textPrimary, fontFamily: Fonts.body, fontSize: 14, backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6 }} />
                <TextInput value={fact.content} onChangeText={(v) => setFacts((prev) => prev.map((f, i) => i === idx ? { ...f, content: v } : f))} placeholder={t('simulator.admin_fact_content')} placeholderTextColor={colors.textFaint} multiline numberOfLines={3} textAlignVertical="top" style={{ color: colors.textPrimary, fontFamily: Fonts.body, fontSize: 14, backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6, minHeight: 64 }} />
                <TextInput value={fact.icon ?? ''} onChangeText={(v) => setFacts((prev) => prev.map((f, i) => i === idx ? { ...f, icon: v } : f))} placeholder={t('simulator.admin_fact_icon')} placeholderTextColor={colors.textFaint} style={{ color: colors.textPrimary, fontFamily: Fonts.body, fontSize: 14, backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }} />
              </View>
            ))}
          </View>

          {/* ── ZONING QUESTIONS ── */}
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: GOLD }}>{t('simulator.admin_zoning_section')}</Text>
              <TouchableOpacity onPress={() => setQuestions((prev) => [...prev, { id: genTempId(), order_index: prev.length, question: '', option_a: '', option_b: '', option_c: null, correct_option: 'a', explanation: '', _new: true }])} activeOpacity={0.7}>
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: GOLD }}>{t('simulator.admin_add_question')}</Text>
              </TouchableOpacity>
            </View>
            {questions.map((q, idx) => (
              <View key={q.id} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: colors.textMuted }}>Q{idx + 1}</Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity disabled={idx === 0} onPress={() => setQuestions((prev) => { const a = [...prev]; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; return a; })}>
                      <Ionicons name="arrow-up" size={16} color={idx === 0 ? colors.textFaint : colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity disabled={idx === questions.length - 1} onPress={() => setQuestions((prev) => { const a = [...prev]; [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]]; return a; })}>
                      <Ionicons name="arrow-down" size={16} color={idx === questions.length - 1 ? colors.textFaint : colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setQuestions((prev) => prev.filter((_, i) => i !== idx))}>
                      <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                {(['question', 'option_a', 'option_b', 'option_c', 'correct_option', 'explanation'] as const).map((field) => (
                  <TextInput
                    key={field}
                    value={q[field] ?? ''}
                    onChangeText={(v) => setQuestions((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: v } : item))}
                    placeholder={t(`simulator.admin_${field === 'question' ? 'question_text' : field === 'option_a' ? 'option_a' : field === 'option_b' ? 'option_b' : field === 'option_c' ? 'option_c' : field === 'correct_option' ? 'correct_option' : 'explanation'}`)}
                    placeholderTextColor={colors.textFaint}
                    style={{ color: colors.textPrimary, fontFamily: Fonts.body, fontSize: 14, backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6 }}
                  />
                ))}
              </View>
            ))}
          </View>

          {/* ── SURPRISE CARDS ── */}
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: GOLD }}>{t('simulator.admin_surprise_section')}</Text>
              <TouchableOpacity onPress={() => setCards((prev) => [...prev, { id: genTempId(), title: '', description: '', impact_type: null, impact_amount: 0, related_fact_title: null, _new: true }])} activeOpacity={0.7}>
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: GOLD }}>{t('simulator.admin_add_surprise')}</Text>
              </TouchableOpacity>
            </View>
            {cards.map((card, idx) => (
              <View key={card.id} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: colors.textMuted }}>Card {idx + 1}</Text>
                  <TouchableOpacity onPress={() => setCards((prev) => prev.filter((_, i) => i !== idx))}>
                    <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
                <TextInput value={card.title} onChangeText={(v) => setCards((prev) => prev.map((c, i) => i === idx ? { ...c, title: v } : c))} placeholder={t('simulator.admin_surprise_title')} placeholderTextColor={colors.textFaint} style={{ color: colors.textPrimary, fontFamily: Fonts.body, fontSize: 14, backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6 }} />
                <TextInput value={card.description} onChangeText={(v) => setCards((prev) => prev.map((c, i) => i === idx ? { ...c, description: v } : c))} placeholder={t('simulator.admin_surprise_description')} placeholderTextColor={colors.textFaint} multiline numberOfLines={3} textAlignVertical="top" style={{ color: colors.textPrimary, fontFamily: Fonts.body, fontSize: 14, backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6, minHeight: 64 }} />
                <TextInput value={card.impact_type ?? ''} onChangeText={(v) => setCards((prev) => prev.map((c, i) => i === idx ? { ...c, impact_type: v || null } : c))} placeholder={t('simulator.admin_surprise_impact_type')} placeholderTextColor={colors.textFaint} style={{ color: colors.textPrimary, fontFamily: Fonts.body, fontSize: 14, backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6 }} />
                <TextInput value={card.impact_amount != null ? String(card.impact_amount) : ''} onChangeText={(v) => setCards((prev) => prev.map((c, i) => i === idx ? { ...c, impact_amount: parseFloat(v) || 0 } : c))} placeholder={t('simulator.admin_surprise_impact_amount')} placeholderTextColor={colors.textFaint} keyboardType="numeric" style={{ color: colors.textPrimary, fontFamily: Fonts.body, fontSize: 14, backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6 }} />
                <TextInput value={card.related_fact_title ?? ''} onChangeText={(v) => setCards((prev) => prev.map((c, i) => i === idx ? { ...c, related_fact_title: v || null } : c))} placeholder={t('simulator.admin_surprise_related_fact')} placeholderTextColor={colors.textFaint} style={{ color: colors.textPrimary, fontFamily: Fonts.body, fontSize: 14, backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }} />
              </View>
            ))}
          </View>

          {/* Save */}
          <TouchableOpacity onPress={saving ? undefined : handleSave} activeOpacity={0.8} style={{ backgroundColor: GOLD, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8, opacity: saving ? 0.7 : 1 }}>
            {saving ? <ActivityIndicator color={BG} size="small" /> : <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: BG }}>{t('simulator.admin_save')}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ActionSheet
        visible={deleteSheetVisible}
        onClose={() => setDeleteSheetVisible(false)}
        title={t('simulator.admin_delete_deal_warn')}
        actions={[{ label: t('simulator.admin_delete'), icon: 'trash-outline', destructive: true, onPress: handleDelete }]}
      />
    </KeyboardAvoidingView>
  );
}
