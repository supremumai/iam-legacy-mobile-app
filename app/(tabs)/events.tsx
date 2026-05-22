import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EventsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-8">
        <Text className="text-2xl font-bold text-[#1A1A1A]">Events</Text>
        <Text className="text-sm text-[#6B7280] mt-1">What's happening near you</Text>
      </View>
    </SafeAreaView>
  );
}
