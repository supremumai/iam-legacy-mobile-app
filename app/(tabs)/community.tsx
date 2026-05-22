import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CommunityScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-8">
        <Text className="text-2xl font-bold text-[#1A1A1A]">Community</Text>
        <Text className="text-sm text-[#6B7280] mt-1">Connect with your people</Text>
      </View>
    </SafeAreaView>
  );
}
