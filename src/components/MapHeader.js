import { Text, View, StyleSheet, Image, Pressable } from "react-native";
import { colors } from "../../assets/themes/colors";
import { fontHeader } from "../../assets/themes/font";
import { Search } from "../../assets/snapchat/HeaderIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Button } from "@rneui/themed";
export default function MapHeader({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerLeft}>
        <Pressable
          style={[styles.profile, styles.buttons]}
          onPress={() => {
            navigation.navigate("Profile");
          }}
        >
          <Image
            style={styles.profileImage}
            source={require("../../assets/snapchat/defaultprofile.png")}
          />
        </Pressable>
        <Pressable
          style={[styles.search, styles.buttons]}
          onPress={() => {
            navigation.navigate("Search");
          }}
        >
          <Search />
        </Pressable>
      </View>
      <View style={styles.headerRight}>
        <Pressable>
          <View style={[styles.more, styles.buttons]}>
            <Button
              style={styles.image1InButton}
              buttonStyle={{ backgroundColor: "transparent" }}
            >
              <FontAwesome6 name="search" size={24} color="black" />
            </Button>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: "100%",
    height: 50,
    flexDirection: "row",
    paddingHorizontal: 12,
    top: 10,
    left: 10,
    paddingVertical: 0,
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    color: colors.primary,
    fontSize: fontHeader.fontSize,
    fontFamily: fontHeader.fontFamily,
    fontWeight: fontHeader.fontWeight,
  },
  headerLeft: {
    flexDirection: "row",
    gap: 6,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  buttons: {
    borderRadius: 100,
    height: 44,
    width: 44,
    backgroundColor: "#ECECEC",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  image1InButton: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
});
