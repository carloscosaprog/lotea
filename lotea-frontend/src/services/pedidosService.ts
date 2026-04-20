import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.0.65:3000";

export const getPedidos = async () => {
  const token = await AsyncStorage.getItem("token");

  const res = await axios.get(`${BASE_URL}/pedidos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};
