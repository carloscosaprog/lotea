import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/lotes/HomeScreen";
import LotesScreen from "../screens/lotes/LotesScreen";
import LoteDetailScreen from "../screens/lotes/LoteDetailScreen";
import UserProfileScreen from "../screens/profile/UserProfileScreen";

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Lotes" component={LotesScreen} />
      <Stack.Screen name="LoteDetail" component={LoteDetailScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    </Stack.Navigator>
  );
}
