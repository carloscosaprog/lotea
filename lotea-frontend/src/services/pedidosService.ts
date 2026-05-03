import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../config/api";

export const getPedidos = async () => {
  const token = await AsyncStorage.getItem("token");

  const res = await axios.get(`${API_URL}/pedidos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};
