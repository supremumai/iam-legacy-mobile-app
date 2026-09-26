import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../constants/fonts';
import { useColors } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t } = useLanguage();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: Fonts.bodySemiBold,
            fontSize: 17,
            color: colors.textPrimary,
            marginLeft: 8,
          }}
        >
          {t('legal.privacy_title')}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: colors.textMuted, marginBottom: 24 }}>
          {t('legal.last_updated')}
        </Text>

        <Section title="1. Information We Collect" colors={colors}>
          {`We collect information you provide directly, including your name, username, email address, and profile details when you create or update your account.\n\nWe also collect content you post, events you create, and interactions you have within the community.\n\nWe automatically collect certain technical data such as device type, operating system, and usage analytics to improve the app.`}
        </Section>

        <Section title="2. How We Use Your Information" colors={colors}>
          {`We use your information to:\n• Operate and improve the I Am Legacy app\n• Personalize your experience\n• Send you notifications you have opted into\n• Provide community features and event management\n• Respond to your support requests`}
        </Section>

        <Section title="3. Sharing of Information" colors={colors}>
          {`We do not sell your personal information. We may share your information with:\n• Service providers who help us operate the platform (e.g., cloud storage, analytics)\n• Other community members, for profile and post information that is visible within the app\n• Legal authorities when required by law`}
        </Section>

        <Section title="4. Data Retention" colors={colors}>
          {`We retain your data for as long as your account is active. When you delete your account, we remove your personal information from our active systems within 30 days, subject to legal obligations.`}
        </Section>

        <Section title="5. Your Rights" colors={colors}>
          {`You have the right to access, correct, or delete your personal information. You can update most information directly in the app under Edit Profile. To request account deletion or data export, contact us at support@iamlegacy.app.`}
        </Section>

        <Section title="6. Security" colors={colors}>
          {`We use industry-standard security measures to protect your information, including encrypted connections (TLS) and secure cloud infrastructure. However, no system is 100% secure and we cannot guarantee absolute security.`}
        </Section>

        <Section title="7. Children's Privacy" colors={colors}>
          {`I Am Legacy is not directed to children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will delete it promptly.`}
        </Section>

        <Section title="8. Changes to This Policy" colors={colors}>
          {`We may update this Privacy Policy from time to time. We will notify you of significant changes through the app or by email. Continued use of the app after changes constitutes your acceptance of the updated policy.`}
        </Section>

        <Section title="9. Contact Us" colors={colors}>
          {`If you have questions about this Privacy Policy, please contact us at:\n\nsupport@iamlegacy.app`}
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontFamily: Fonts.bodySemiBold,
          fontSize: 15,
          color: colors.textPrimary,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: Fonts.body,
          fontSize: 14,
          color: colors.textSecondary,
          lineHeight: 22,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
