import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/lotes/HomeScreen";
import LotesScreen from "../screens/lotes/LotesScreen";
import LoteDetailScreen from "../screens/lotes/LoteDetailScreen";
import UserProfileScreen from "../screens/profile/UserProfileScreen";
import CompraScreen from "../screens/lotes/CompraScreen";
import EditLoteScreen from "../screens/lotes/EditLoteScreen";
import ChatScreen from "../screens/chat/ChatScreen";

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Lotes" component={LotesScreen} />
      <Stack.Screen name="LoteDetail" component={LoteDetailScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="Compra" component={CompraScreen} />
      <Stack.Screen name="EditLote" component={EditLoteScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}
