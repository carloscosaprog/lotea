import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import MapView, {
  Circle,
  Marker,
  type MapPressEvent,
  type Region,
} from "react-native-maps";
import { useNavigation } from "@react-navigation/native";

import {
  getUserLocation,
  updateUserLocation,
} from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { colors } from "../../styles/colors";
import { layoutStyles } from "../../styles/theme";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

const DEFAULT_REGION: Region = {
  latitude: 40.4168,
  longitude: -3.7038,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const APPROXIMATION_RADIUS_METERS = 900;

type SelectedLocation = {
  latitud: number;
  longitud: number;
};

const roundApproximateCoordinate = (value: number) =>
  Math.round(value * 1000) / 1000;

const toRegion = (latitud: number, longitud: number): Region => ({
  latitude: latitud,
  longitude: longitud,
  latitudeDelta: 0.035,
  longitudeDelta: 0.035,
});

export default function EditLocationScreen() {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView | null>(null);
  const { login } = useAuth();

  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);
  const [searchText, setSearchText] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [direccion, setDireccion] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [mapInteractive, setMapInteractive] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);

  const markerCoordinate = useMemo(
    () =>
      selectedLocation
        ? {
            latitude: selectedLocation.latitud,
            longitude: selectedLocation.longitud,
          }
        : null,
    [selectedLocation],
  );

  const displayLocation = [direccion, ciudad].filter(Boolean).join(", ");

  useEffect(() => {
    const loadLocation = async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        setHasLocationPermission(permission.granted);
        setPermissionDenied(permission.status === "denied");

        const location = await getUserLocation();

        if (
          typeof location.latitud === "number" &&
          typeof location.longitud === "number"
        ) {
          const nextRegion = toRegion(location.latitud, location.longitud);

          setRegion(nextRegion);
          setSelectedLocation({
            latitud: location.latitud,
            longitud: location.longitud,
          });
        }

        setCiudad(location.ciudad ?? "");
        setDireccion(location.direccion ?? "");
        setSearchText(
          [location.direccion, location.ciudad].filter(Boolean).join(", "),
        );
      } finally {
        setLoading(false);
      }
    };

    loadLocation();
  }, []);

  const applyCoordinates = async (
    latitud: number,
    longitud: number,
    searchLabel?: string,
    shouldAnimate = true,
  ) => {
    const nextLocation = {
      latitud: roundApproximateCoordinate(latitud),
      longitud: roundApproximateCoordinate(longitud),
    };
    const nextRegion = toRegion(nextLocation.latitud, nextLocation.longitud);

    setSelectedLocation(nextLocation);
    setRegion(nextRegion);

    if (searchLabel) {
      setSearchText(searchLabel);
    }

    if (shouldAnimate) {
      mapRef.current?.animateToRegion(nextRegion, 350);
    }

    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude: latitud,
        longitude: longitud,
      });

      if (address) {
        const nextCity =
          address.city || address.subregion || address.region || "";
        const nextArea =
          address.district ||
          address.name ||
          address.subregion ||
          address.region ||
          nextCity;

        setCiudad(nextCity);
        setDireccion(nextArea);

        if (!searchLabel) {
          setSearchText([nextArea, nextCity].filter(Boolean).join(", "));
        }
      }
    } catch (error) {
      console.log("No se pudo resolver la zona aproximada", error);
    }
  };

  const handleSearchLocation = async () => {
    const query = searchText.trim();

    if (query.length < 3) {
      Alert.alert("Busca una ubicacion", "Escribe una ciudad, barrio o zona.");
      return;
    }

    try {
      setSearching(true);
      Keyboard.dismiss();

      const results = await Location.geocodeAsync(query);
      const firstResult = results[0];

      if (!firstResult) {
        Alert.alert("Sin resultados", "Prueba con una ubicacion mas concreta.");
        return;
      }

      await applyCoordinates(firstResult.latitude, firstResult.longitude, query);
    } catch (error) {
      console.log("Error buscando ubicacion", error);
      Alert.alert("Error", "No se pudo buscar esa ubicacion");
    } finally {
      setSearching(false);
    }
  };

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    applyCoordinates(latitude, longitude, undefined, false);
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      setPermissionDenied(false);

      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setPermissionDenied(true);
        setHasLocationPermission(false);
        Alert.alert(
          "Permiso necesario",
          "Activa la ubicacion para usar tu posicion actual.",
        );
        return;
      }

      setHasLocationPermission(true);

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      await applyCoordinates(current.coords.latitude, current.coords.longitude);
    } catch (error) {
      console.log("Error obteniendo GPS", error);
      Alert.alert("Error", "No se pudo obtener tu ubicacion actual");
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedLocation) {
      Alert.alert(
        "Elige una ubicacion",
        "Busca una zona, usa tu GPS o marca un punto aproximado en el mapa.",
      );
      return;
    }

    try {
      setSaving(true);

      const updatedUser = await updateUserLocation({
        latitud: selectedLocation.latitud,
        longitud: selectedLocation.longitud,
        ciudad: ciudad.trim() || undefined,
        direccion: direccion.trim() || ciudad.trim() || undefined,
      });

      await login(updatedUser);
      navigation.goBack();
    } catch (error) {
      console.log("Error guardando ubicacion", error);
      Alert.alert("Error", "No se pudo guardar la ubicacion");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.feedbackTitle}>Cargando ubicacion...</Text>
      </View>
    );
  }

  return (
    <View style={layoutStyles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Mi ubicacion</Text>
          <View style={{ width: 22 }} />
        </View>

        <Card contentStyle={styles.searchCard}>
          <Text style={styles.searchTitle}>Donde quieres vender?</Text>
          <Text style={styles.searchSubtitle}>
            Busca tu ciudad, barrio o zona. En los lotes se mostrara una
            ubicacion aproximada.
          </Text>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.subtext} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearchLocation}
              returnKeyType="search"
              placeholder="Ej. Madrid, Gracia, Valencia..."
              placeholderTextColor={colors.subtext}
              style={styles.searchInput}
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSearchText("")}
              >
                <Ionicons name="close-circle" size={18} color={colors.subtext} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.86}
              style={styles.secondaryAction}
              onPress={handleUseCurrentLocation}
              disabled={locating}
            >
              {locating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name="navigate-outline"
                  size={18}
                  color={colors.primary}
                />
              )}
              <Text style={styles.secondaryActionText}>Usar GPS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.86}
              style={styles.primaryAction}
              onPress={handleSearchLocation}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="search" size={18} color={colors.white} />
              )}
              <Text style={styles.primaryActionText}>Buscar</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={[styles.mapWrap, mapExpanded && styles.mapWrapExpanded]}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={mapInteractive ? handleMapPress : undefined}
            scrollEnabled={mapInteractive}
            zoomEnabled={mapInteractive}
            pitchEnabled={false}
            rotateEnabled={false}
            showsUserLocation={hasLocationPermission}
            showsMyLocationButton={false}
          >
            {markerCoordinate && (
              <>
                <Circle
                  center={markerCoordinate}
                  radius={APPROXIMATION_RADIUS_METERS}
                  fillColor="rgba(59,130,246,0.16)"
                  strokeColor="rgba(59,130,246,0.55)"
                  strokeWidth={2}
                />
                <Marker
                  coordinate={markerCoordinate}
                  draggable={mapInteractive}
                  onDragEnd={(event) => {
                    const { latitude, longitude } =
                      event.nativeEvent.coordinate;
                    applyCoordinates(latitude, longitude, undefined, false);
                  }}
                />
              </>
            )}
          </MapView>

          {!mapInteractive && (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.mapLockOverlay}
              onPress={() => setMapInteractive(true)}
            >
              <View style={styles.mapLockBadge}>
                <Ionicons
                  name="hand-left-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.mapLockText}>Ajustar en el mapa</Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.mapActions}>
            <TouchableOpacity
              activeOpacity={0.86}
              style={styles.mapActionButton}
              onPress={() => setMapExpanded((current) => !current)}
            >
              <Ionicons
                name={mapExpanded ? "contract-outline" : "expand-outline"}
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>

            {mapInteractive && (
              <TouchableOpacity
                activeOpacity={0.86}
                style={styles.doneMapButton}
                onPress={() => setMapInteractive(false)}
              >
                <Text style={styles.doneMapText}>Listo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Card contentStyle={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={styles.previewIcon}>
              <Ionicons
                name="location-outline"
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={styles.previewCopy}>
              <Text style={styles.previewTitle}>
                {displayLocation || "Ubicacion sin seleccionar"}
              </Text>
              <Text style={styles.previewText}>
                Los compradores veran una zona aproximada, no tu direccion
                exacta.
              </Text>
            </View>
          </View>

          {selectedLocation && (
            <View style={styles.approxBadge}>
              <Ionicons
                name="shield-checkmark-outline"
                size={15}
                color={colors.accent}
              />
              <Text style={styles.approxBadgeText}>
                Guardado aproximado: {selectedLocation.latitud.toFixed(3)},{" "}
                {selectedLocation.longitud.toFixed(3)}
              </Text>
            </View>
          )}

          {permissionDenied && (
            <Text style={styles.permissionText}>
              Puedes buscar por texto o seleccionar la zona manualmente aunque
              no actives el GPS.
            </Text>
          )}
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={saving ? "Guardando..." : "Guardar ubicacion"}
          disabled={saving}
          onPress={handleSave}
          style={styles.saveButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 140,
    gap: spacing.lg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarTitle: {
    ...typography.heading,
    color: colors.text,
  },
  searchCard: {
    gap: spacing.md,
  },
  searchTitle: {
    ...typography.heading,
    color: colors.text,
  },
  searchSubtitle: {
    ...typography.body,
    color: colors.subtext,
  },
  searchBox: {
    minHeight: 54,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body.fontSize,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  primaryAction: {
    flex: 1,
    minHeight: 50,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  primaryActionText: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  secondaryAction: {
    flex: 1,
    minHeight: 50,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  secondaryActionText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  mapWrap: {
    height: 340,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#E5E7EB",
  },
  mapWrapExpanded: {
    height: 520,
  },
  map: {
    flex: 1,
  },
  mapLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17,24,39,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  mapLockBadge: {
    minHeight: 46,
    borderRadius: radii.full,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  mapLockText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  mapActions: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    gap: spacing.xs,
  },
  mapActionButton: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  doneMapButton: {
    minHeight: 42,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  doneMapText: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  previewCard: {
    gap: spacing.md,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  previewIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  previewCopy: {
    flex: 1,
    gap: 2,
  },
  previewTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  previewText: {
    ...typography.caption,
    color: colors.subtext,
  },
  approxBadge: {
    alignSelf: "flex-start",
    borderRadius: radii.full,
    backgroundColor: colors.accentSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  approxBadgeText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: "700",
  },
  permissionText: {
    ...typography.caption,
    color: colors.warning,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: "rgba(249,250,251,0.98)",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    minHeight: 58,
    borderRadius: radii.lg,
  },
  feedbackTitle: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.sm,
  },
});
