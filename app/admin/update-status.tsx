import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import { useColors } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Fonts } from '../../constants/fonts';

type CheckResult =
  | { isAvailable: true; manifest: any }
  | { isAvailable: false }
  | null;

function InfoRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
        gap: 10,
      }}
    >
      <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: colors.textMuted, width: 130 }}>
        {label}
      </Text>
      <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.textPrimary, flex: 1 }} selectable>
        {value}
      </Text>
    </View>
  );
}

export default function UpdateStatusScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();
  const { t } = useLanguage();

  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [logs, setLogs] = useState<Updates.UpdatesLogEntry[] | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    setCheckError(null);
    setCheckResult(null);
    try {
      const result = await Updates.checkForUpdateAsync();
      setCheckResult(result);
    } catch (e: any) {
      setCheckError(e?.message ?? String(e));
    } finally {
      setChecking(false);
    }
  };

  const handleLoadLogs = async () => {
    setLoadingLogs(true);
    setLogsError(null);
    try {
      const entries = await Updates.readLogEntriesAsync(50);
      setLogs(entries);
    } catch (e: any) {
      setLogsError(e?.message ?? String(e));
    } finally {
      setLoadingLogs(false);
    }
  };

  const formatDate = (ms: number) => new Date(ms).toISOString();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Fonts.heading, fontSize: 22, color: colors.gold }}>
          {t('settings.update_status_title')}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
      >
        {/* Current update info */}
        <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 10, color: colors.gold, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
          {t('settings.update_status_current')}
        </Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
          <InfoRow label={t('settings.update_status_update_id')} value={Updates.updateId ?? t('settings.update_status_none')} colors={colors} />
          <InfoRow label={t('settings.update_status_created_at')} value={Updates.createdAt ? Updates.createdAt.toISOString() : t('settings.update_status_none')} colors={colors} />
          <InfoRow label={t('settings.update_status_channel')} value={Updates.channel ?? t('settings.update_status_none')} colors={colors} />
          <InfoRow label={t('settings.update_status_runtime_version')} value={Updates.runtimeVersion ?? t('settings.update_status_none')} colors={colors} />
          <InfoRow label={t('settings.update_status_embedded')} value={Updates.isEmbeddedLaunch ? t('common.yes') : t('common.no')} colors={colors} />
        </View>

        {/* Check for update */}
        <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 10, color: colors.gold, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
          {t('settings.update_status_check')}
        </Text>
        <View style={{ marginBottom: 24 }}>
          <TouchableOpacity
            onPress={handleCheck}
            disabled={checking}
            activeOpacity={0.75}
            style={{
              backgroundColor: colors.gold,
              borderRadius: 8,
              paddingVertical: 11,
              alignItems: 'center',
              opacity: checking ? 0.6 : 1,
              marginBottom: 12,
            }}
          >
            {checking ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: colors.background }}>
                {t('settings.update_status_check_button')}
              </Text>
            )}
          </TouchableOpacity>

          {checkError ? (
            <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.error }}>{checkError}</Text>
          ) : checkResult ? (
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border }}>
              <InfoRow
                label={t('settings.update_status_available')}
                value={checkResult.isAvailable ? t('common.yes') : t('common.no')}
                colors={colors}
              />
              {checkResult.isAvailable && checkResult.manifest ? (
                <InfoRow
                  label={t('settings.update_status_manifest')}
                  value={JSON.stringify(checkResult.manifest, null, 2)}
                  colors={colors}
                />
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Logs */}
        <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 10, color: colors.gold, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
          {t('settings.update_status_logs')}
        </Text>
        <TouchableOpacity
          onPress={handleLoadLogs}
          disabled={loadingLogs}
          activeOpacity={0.75}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            paddingVertical: 11,
            alignItems: 'center',
            opacity: loadingLogs ? 0.6 : 1,
            marginBottom: 12,
          }}
        >
          {loadingLogs ? (
            <ActivityIndicator color={colors.gold} />
          ) : (
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.gold }}>
              {t('settings.update_status_load_logs')}
            </Text>
          )}
        </TouchableOpacity>

        {logsError ? (
          <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.error, marginBottom: 12 }}>{logsError}</Text>
        ) : logs ? (
          logs.length === 0 ? (
            <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.textFaint, marginBottom: 12 }}>
              {t('settings.update_status_logs_empty')}
            </Text>
          ) : (
            logs.map((entry, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>
                  {formatDate(entry.timestamp)} · {entry.level}
                </Text>
                <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: colors.textPrimary }} selectable>
                  {entry.message}
                </Text>
                {entry.code ? (
                  <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: colors.textFaint, marginTop: 2 }}>
                    code: {entry.code}
                  </Text>
                ) : null}
              </View>
            ))
          )
        ) : null}
      </ScrollView>
    </View>
  );
}
