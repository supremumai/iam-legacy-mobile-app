import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DrawerContent from '../../components/DrawerContent';
import { Colors } from '../../constants/colors';

export default function DrawerLayout() {
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
            backgroundColor: Colors.background,
            width: 300,
          },
        }}
      >
        <Drawer.Screen name="(tabs)" options={{ headerShown: false }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}
