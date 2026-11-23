import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';

type FocusedField = 'fullName' | 'email' | 'password' | 'confirmPassword' | null;

export default function SignUpScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [focused, setFocused] = useState<FocusedField>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const colors = useColors();
  const styles = createStyles(colors);

  const fieldBorder = (field: FocusedField) =>
    focused === field ? colors.gold : colors.border;

  async function handleSignUp() {
    setError('');

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError(t('auth.all_required'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwords_mismatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.password_short'));
      return;
    }
    if (!acceptedTerms) {
      setError(t('auth.terms_required'));
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          terms_accepted_at: new Date().toISOString(),
        },
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.title}>{t('auth.create_account')}</Text>
          <Text style={styles.subtitle}>{t('auth.join_community')}</Text>

          {success ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                {t('auth.check_email')}
              </Text>
            </View>
          ) : (
            <View style={styles.form}>
              {/* Full Name */}
              <Text style={styles.label}>{t('auth.full_name')}</Text>
              <TextInput
                style={[styles.input, { borderColor: fieldBorder('fullName') }]}
                placeholder={t('auth.full_name')}
                placeholderTextColor={colors.textFaint}
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setFocused('fullName')}
                onBlur={() => setFocused(null)}
                autoCapitalize="words"
                returnKeyType="next"
              />

              {/* Email */}
              <Text style={styles.label}>{t('auth.email')}</Text>
              <TextInput
                style={[styles.input, { borderColor: fieldBorder('email') }]}
                placeholder={t('auth.email_placeholder')}
                placeholderTextColor={colors.textFaint}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />

              {/* Password */}
              <Text style={styles.label}>{t('auth.password')}</Text>
              <TextInput
                style={[styles.input, { borderColor: fieldBorder('password') }]}
                placeholder={t('auth.password')}
                placeholderTextColor={colors.textFaint}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                secureTextEntry
                returnKeyType="next"
              />

              {/* Confirm Password */}
              <Text style={styles.label}>{t('auth.confirm_password')}</Text>
              <TextInput
                style={[styles.input, { borderColor: fieldBorder('confirmPassword') }]}
                placeholder={t('auth.confirm_password')}
                placeholderTextColor={colors.textFaint}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setFocused('confirmPassword')}
                onBlur={() => setFocused(null)}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />

              {/* Terms acceptance — required before the account can be created */}
              <View style={styles.termsRow}>
                <TouchableOpacity
                  onPress={() => setAcceptedTerms((v) => !v)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: acceptedTerms }}
                  style={[
                    styles.checkbox,
                    { borderColor: acceptedTerms ? colors.gold : colors.border, backgroundColor: acceptedTerms ? colors.gold : 'transparent' },
                  ]}
                >
                  {acceptedTerms ? <Ionicons name="checkmark" size={16} color={colors.background} /> : null}
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  {t('auth.terms_prefix')}
                  <Text style={styles.termsLink} onPress={() => router.push('/terms' as any)}>
                    {t('auth.terms_link')}
                  </Text>
                  {t('auth.terms_and')}
                  <Text style={styles.termsLink} onPress={() => router.push('/privacy' as any)}>
                    {t('auth.privacy_link')}
                  </Text>
                </Text>
              </View>

              {/* Error */}
              {!!error && <Text style={styles.errorText}>{error}</Text>}

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitButton, !acceptedTerms && styles.submitButtonDisabled]}
                activeOpacity={0.85}
                onPress={handleSignUp}
                disabled={loading || !acceptedTerms}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={styles.submitButtonText}>{t('auth.create_account')}</Text>
                )}
              </TouchableOpacity>

              {/* Footer link */}
              <TouchableOpacity
                style={styles.footerLink}
                onPress={() => router.replace('/(auth)/sign-in')}
              >
                <Text style={styles.footerText}>
                  {t('auth.have_account')}{' '}
                  <Text style={styles.footerLinkText}>{t('auth.sign_in')}</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backArrow: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: colors.gold,
    marginTop: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    marginBottom: 20,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  termsText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  termsLink: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.gold,
    textDecorationLine: 'underline',
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.error,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    width: '100%',
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.background,
  },
  footerLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textMuted,
  },
  footerLinkText: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.gold,
  },
  successContainer: {
    flex: 1,
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  successText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.gold,
    textAlign: 'center',
    lineHeight: 26,
  },
  });
}
