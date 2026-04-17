import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeStack from "./HomeStack";
import ProfileStack from "./ProfileStack";
import CreateLoteScreen from "../screens/lotes/CreateLoteScreen";
import Navbar from "../components/common/Navbar";
import { colors } from "../styles/colors";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <Navbar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ title: "Home" }} />
      <Tab.Screen name="Vender" component={CreateLoteScreen} options={{ title: "Sell" }} />
      <Tab.Screen name="Perfil" component={ProfileStack} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}
