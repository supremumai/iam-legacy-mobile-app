import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useBlocks } from '../contexts/BlocksContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useColors } from '../contexts/ThemeContext';
import { Fonts } from '../constants/fonts';
import { REPORT_REASONS, ReportReason, ReportTargetType, submitReport } from '../lib/moderation';

const SHEET_BG = '#1c1a14';

export interface ReportTarget {
  type: ReportTargetType;
  id: string;
}

export interface BlockTarget {
  userId: string;
  name: string;
}

// ─── Report reason picker ─────────────────────────────────────────────────────

function ReportModal({ target, onClose }: { target: ReportTarget | null; onClose: () => void }) {
  const colors = useColors();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (submitting) return;
    onClose();
    // Reset after the slide-out so the sheet doesn't flash back to the form.
    setTimeout(() => {
      setReason(null);
      setDetails('');
      setSent(false);
      setError(null);
    }, 300);
  };

  const submit = async () => {
    if (!target || !reason || !user?.id || submitting) return;
    setSubmitting(true);
    setError(null);
    const err = await submitReport({
      reporterId: user.id,
      targetType: target.type,
      targetId: target.id,
      reason,
      details,
    });
    setSubmitting(false);
    if (err) {
      setError(t('moderation.report_error'));
      return;
    }
    setSent(true);
  };

  return (
    <Modal visible={!!target} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={close} />
        <View
          style={{
            backgroundColor: SHEET_BG,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderWidth: 1,
            borderBottomWidth: 0,
            borderColor: colors.gold,
            paddingBottom: 32,
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>

          {sent ? (
            <View style={{ alignItems: 'center', paddingHorizontal: 28, paddingTop: 16 }}>
              <Ionicons name="checkmark-circle-outline" size={40} color={colors.gold} />
              <Text style={{ fontFamily: Fonts.heading, fontSize: 18, color: colors.gold, marginTop: 10, textAlign: 'center' }}>
                {t('moderation.thanks_title')}
              </Text>
              <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 22 }}>
                {t('moderation.thanks_body')}
              </Text>
              <TouchableOpacity
                onPress={close}
                activeOpacity={0.75}
                style={{ alignSelf: 'stretch', backgroundColor: colors.gold, borderRadius: 8, paddingVertical: 13, alignItems: 'center', marginTop: 22 }}
              >
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: colors.background }}>OK</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={{ fontFamily: Fonts.heading, fontSize: 18, color: colors.gold, textAlign: 'center', paddingHorizontal: 20 }}>
                {target?.type === 'user' ? t('moderation.report_user_title') : t('moderation.report_title')}
              </Text>
              <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 8, paddingHorizontal: 20 }}>
                {t('moderation.report_subtitle')}
              </Text>

              {REPORT_REASONS.map((r, i) => {
                const selected = reason === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setReason(r)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 24,
                      paddingVertical: 14,
                      opacity: pressed ? 0.7 : 1,
                      borderTopWidth: i === 0 ? 1 : 0,
                      borderTopColor: colors.borderSubtle,
                    })}
                  >
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={selected ? colors.gold : colors.textMuted}
                      style={{ marginRight: 14 }}
                    />
                    <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 16, color: colors.textPrimary }}>
                      {t(`moderation.reason_${r}`)}
                    </Text>
                  </Pressable>
                );
              })}

              <View style={{ paddingHorizontal: 20, paddingTop: 6 }}>
                <TextInput
                  value={details}
                  onChangeText={setDetails}
                  placeholder={t('moderation.details_placeholder')}
                  placeholderTextColor={colors.textFaint}
                  multiline
                  maxLength={500}
                  style={{
                    minHeight: 64,
                    maxHeight: 110,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: colors.textPrimary,
                    fontFamily: Fonts.body,
                    fontSize: 14,
                    textAlignVertical: 'top',
                  }}
                />
                {!!error && (
                  <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.error, marginTop: 8 }}>{error}</Text>
                )}
                <TouchableOpacity
                  onPress={submit}
                  disabled={!reason || submitting}
                  activeOpacity={0.75}
                  style={{
                    backgroundColor: colors.gold,
                    borderRadius: 8,
                    paddingVertical: 13,
                    alignItems: 'center',
                    marginTop: 14,
                    opacity: !reason || submitting ? 0.4 : 1,
                  }}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: colors.background }}>
                      {t('moderation.submit')}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={close} activeOpacity={0.7} style={{ paddingVertical: 13, alignItems: 'center' }}>
                  <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: colors.textSecondary }}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Block confirmation ───────────────────────────────────────────────────────

function BlockModal({ target, onClose }: { target: BlockTarget | null; onClose: () => void }) {
  const colors = useColors();
  const { t } = useLanguage();
  const { block } = useBlocks();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (working) return;
    setError(null);
    onClose();
  };

  const confirm = async () => {
    if (!target || working) return;
    setWorking(true);
    setError(null);
    const ok = await block(target.userId);
    setWorking(false);
    if (ok) onClose();
    else setError(t('moderation.block_error'));
  };

  return (
    <Modal visible={!!target} transparent animationType="fade" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View style={{ backgroundColor: SHEET_BG, borderRadius: 16, padding: 28, width: '100%', borderWidth: 1.5, borderColor: colors.gold + '60' }}>
          <Ionicons name="ban-outline" size={32} color={colors.error} style={{ alignSelf: 'center', marginBottom: 10 }} />
          <Text style={{ fontFamily: Fonts.heading, fontSize: 18, color: colors.gold, marginBottom: 10, textAlign: 'center' }}>
            {t('moderation.block_title', { name: target?.name ?? '' })}
          </Text>
          <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: colors.textSecondary, lineHeight: 22, textAlign: 'center', marginBottom: 20 }}>
            {t('moderation.block_body')}
          </Text>
          {!!error && (
            <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.error, textAlign: 'center', marginBottom: 12 }}>{error}</Text>
          )}
          <TouchableOpacity
            onPress={confirm}
            disabled={working}
            activeOpacity={0.75}
            style={{ backgroundColor: colors.error, borderRadius: 8, paddingVertical: 13, alignItems: 'center', marginBottom: 10, opacity: working ? 0.6 : 1 }}
          >
            {working ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: '#fff' }}>{t('moderation.block_confirm')}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={close}
            disabled={working}
            activeOpacity={0.7}
            style={{ borderRadius: 8, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
          >
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: colors.textSecondary }}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Render `element` once in the component that opens the report/block flows.
 * The modals live in the caller's own tree (not at the app root) so they can
 * present from inside other Modals such as the comments sheet.
 */
export function useModeration() {
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [blockTarget, setBlockTarget] = useState<BlockTarget | null>(null);

  const element = (
    <>
      <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />
      <BlockModal target={blockTarget} onClose={() => setBlockTarget(null)} />
    </>
  );

  return {
    openReport: (target: ReportTarget) => setReportTarget(target),
    openBlock: (target: BlockTarget) => setBlockTarget(target),
    element,
  };
}
