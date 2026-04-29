import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "../screens/profile/ProfileScreen";
import UserProfileScreen from "../screens/profile/UserProfileScreen";
import MisLotesScreen from "../screens/lotes/MisLotesScreen";
import EditLoteScreen from "../screens/lotes/EditLoteScreen";
import MisPedidosScreen from "../screens/lotes/MisPedidosScreen";
import FavoritosScreen from "../screens/lotes/FavoritosScreen";
import ConversationsScreen from "../screens/chat/ConversationsScreen";
import ChatScreen from "../screens/chat/ChatScreen";

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="MisLotes" component={MisLotesScreen} />
      <Stack.Screen name="EditLote" component={EditLoteScreen} />
      <Stack.Screen name="MisPedidos" component={MisPedidosScreen} />
      <Stack.Screen name="Favoritos" component={FavoritosScreen} />
      <Stack.Screen name="Conversations" component={ConversationsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}
