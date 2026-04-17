import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { colors } from "../../styles/colors";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

interface Props {
  onChange: (files: any[]) => void;
}

export default function ImageUploader({ onChange }: Props) {
  const [images, setImages] = useState<any[]>([]);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const selected = result.assets;
      const updatedImages = [...images, ...selected];

      setImages(updatedImages);
      onChange(updatedImages);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onChange(updatedImages);
  };

  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.uploadBox} onPress={pickImages}>
        <View style={styles.uploadIcon}>
          <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.uploadTitle}>Subir imagenes</Text>
        <Text style={styles.uploadSubtitle}>Agrega fotos del lote, hasta 10</Text>
      </Pressable>

      <FlatList
        data={images}
        horizontal
        keyExtractor={(_, i) => i.toString()}
        style={styles.previewList}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.previewContent}
        renderItem={({ item, index }) => (
          <View style={styles.previewContainer}>
            <Image source={{ uri: item.uri }} style={styles.image} />

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close" size={14} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    borderRadius: radii.lg,
    borderStyle: "dashed",
  },
  uploadIcon: {
    width: 68,
    height: 68,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  uploadTitle: {
    ...typography.heading,
    color: colors.text,
  },
  uploadSubtitle: {
    ...typography.caption,
    color: colors.subtext,
    marginTop: 4,
  },
  previewList: {
    marginHorizontal: -2,
  },
  previewContent: {
    gap: spacing.sm,
  },
  previewContainer: {
    position: "relative",
  },
  image: {
    width: 104,
    height: 104,
    borderRadius: radii.md,
    backgroundColor: "#E5E7EB",
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.danger,
    width: 24,
    height: 24,
    borderRadius: radii.full,
    justifyContent: "center",
    alignItems: "center",
  },
});
