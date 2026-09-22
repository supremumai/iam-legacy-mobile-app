import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DrawerContent from '../../components/DrawerContent';
import { useColors } from '../../contexts/ThemeContext';

export default function DrawerLayout() {
  const colors = useColors();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <DrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          swipeEdgeWidth: 20,
          drawerType: 'front',
          swipeEnabled: true,
          drawerStyle: {
            backgroundColor: colors.background,
            width: 300,
          },
        }}
      >
        <Drawer.Screen name="(tabs)" options={{ headerShown: false }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}
