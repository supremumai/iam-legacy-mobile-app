import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../constants/fonts';
import { useColors } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function TermsScreen() {
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
          {t('legal.terms_title')}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: colors.textMuted, marginBottom: 24 }}>
          {t('legal.last_updated')}
        </Text>

        <Section title="1. Acceptance of Terms" colors={colors}>
          {`By downloading, installing, or using I Am Legacy, you agree to be bound by these Terms of Use. If you do not agree, do not use the app.`}
        </Section>

        <Section title="2. Eligibility" colors={colors}>
          {`You must be at least 13 years old to use I Am Legacy. By using the app, you confirm that you meet this age requirement.`}
        </Section>

        <Section title="3. Your Account" colors={colors}>
          {`You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately at support@iamlegacy.app if you suspect unauthorized access.`}
        </Section>

        <Section title="4. Community Standards" colors={colors}>
          {`When using I Am Legacy, you agree not to:\n• Post content that is abusive, harassing, or discriminatory\n• Impersonate other people or organizations\n• Share spam, fraudulent, or misleading content\n• Violate any applicable laws or regulations\n• Interfere with the proper operation of the platform`}
        </Section>

        <Section title="5. Content Ownership" colors={colors}>
          {`You retain ownership of content you post. By posting, you grant I Am Legacy a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content within the platform for the purpose of operating and improving the service.`}
        </Section>

        <Section title="6. Prohibited Activities" colors={colors}>
          {`You may not use I Am Legacy to:\n• Solicit or collect personal information from other users without their consent\n• Engage in unauthorized commercial activities\n• Reverse engineer or attempt to extract the source code of the app\n• Use automated tools or bots to access the service`}
        </Section>

        <Section title="7. Termination" colors={colors}>
          {`We reserve the right to suspend or terminate your account at our discretion if you violate these Terms. You may delete your account at any time through the app settings.`}
        </Section>

        <Section title="8. Disclaimers" colors={colors}>
          {`I Am Legacy is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted or error-free. We are not responsible for user-generated content.`}
        </Section>

        <Section title="9. Limitation of Liability" colors={colors}>
          {`To the maximum extent permitted by law, I Am Legacy shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the app.`}
        </Section>

        <Section title="10. Changes to Terms" colors={colors}>
          {`We may update these Terms from time to time. Continued use of the app after changes are posted constitutes your acceptance of the updated Terms.`}
        </Section>

        <Section title="11. Contact" colors={colors}>
          {`For questions about these Terms, contact us at:\n\nsupport@iamlegacy.app`}
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
