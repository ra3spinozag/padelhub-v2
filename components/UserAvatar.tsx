import { Image } from "expo-image";
import { Text, View } from "react-native";
import { getInitials } from "../context/PartidosContext";

interface Props {
  name: string;
  photoUrl?: string | null;
  size?: number;
  color?: string;
  borderRadius?: number;
  fontSize?: number;
}

export function UserAvatar({
  name,
  photoUrl,
  size = 40,
  color = "#4f46e5",
  borderRadius = 14,
  fontSize,
}: Props) {
  const fs = fontSize ?? Math.round(size * 0.35);
  return (
    <View style={{ width: size, height: size, borderRadius, backgroundColor: color, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <Text style={{ fontSize: fs, fontWeight: "700", color: "#fff" }}>{getInitials(name)}</Text>
      )}
    </View>
  );
}
