import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Button, Icon } from "@rneui/themed";
import Ionicons from "react-native-vector-icons/Ionicons";
const resetDealsStates = () => {
  setClickedUsers({});
  setStartDate(initialDate);
  setEndDate(initialDate);
  setDayOfWeek([0, 0, 0, 0, 0, 0, 0]);
  setDealInformation("");
};
async function readDeals(pin) {
  try {
    const { data, error } = await supabase
      .from("pins")
      .select("*")
      .eq("id", pin?.id);
    if (error) {
      console.error("Error fetching data:", error);
    } else {
      setPinDeals(data[0]?.deals);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

export const DealInfoSheet = React.forwardRef(
  (
    {
      dealInformation,
      setDealInformation,
      clickedUsers,
      handleUserClick,
      infoDataAddDeal,
      isPinConditionMet,
      currentPin,
      addDeal,
      startDate,
      endDate,
      dayofWeek,
    },
    ref
  ) => {
    return (
      <BottomSheetModal ref={ref} index={0} snapPoints={["72%"]}>
        <View>
          <View
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginRight: 20,
            }}
            flexDirection={"row"}
            alignItems={"center"}
          >
            <Text style={styles.headerPinSheet}>Hive Deal</Text>
            <TouchableOpacity style={styles.exitCreatePin} onPress={deletePin}>
              <Icon name="close" size="20"></Icon>
            </TouchableOpacity>
          </View>
          <Text style={styles.subheadingPinSheet}>
            Enter deals to this pin.
          </Text>
          <View flexDirection={"row"}>
            <Text style={styles.information}>Deal Information</Text>
            <Text style={{ color: "red" }}>*</Text>
          </View>

          <TextInput
            style={styles.input}
            onChangeText={(dealInformation) =>
              setDealInformation(dealInformation)
            }
            value={dealInformation}
          />

          <TouchableOpacity onPress={handleUserClick}>
            <View paddingTop={30} style={styles.moreInfoContainer}>
              <View
                flexDirection={"row"}
                alignItems={"center"}
                justifyContent={"space-between"}
              >
                <View flexDirection={"column"}>
                  <Text style={styles.moreInfoTitle}>All Day</Text>
                  <Text style={styles.moreInfoSub}>
                    This deal runs for 24 hours.
                  </Text>
                </View>
                <Ionicons
                  name={
                    clickedUsers[0] ? "checkmark-circle" : "ellipse-outline"
                  }
                  size={24}
                  color={clickedUsers[0] ? "#3CB2E2" : "lightgrey"}
                />
              </View>
            </View>
          </TouchableOpacity>
          {infoDataAddDeal.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.moreInfoContainer}
              onPress={item.onPress}
              disabled={item.disabled}
            >
              <View
                flexDirection={"row"}
                alignItems={"center"}
                justifyContent={"space-between"}
              >
                <View flexDirection={"column"}>
                  <Text style={styles.moreInfoTitle}>{item.title}</Text>
                  <Text style={styles.moreInfoSub}>{item.subtitle}</Text>
                </View>
                <Icon name="arrow-forward-ios" size={15} />
              </View>
            </TouchableOpacity>
          ))}
          <Button
            disabled={!isPinConditionMet}
            onPress={async () => {
              await addDeal(currentPin, {
                title: dealInformation,
                allDay: clickedUsers[0],
                time: { startDate, endDate },
                repeat: dayofWeek,
                image: require("../../../assets/images/dealsImage.png"),
              });
            }}
            buttonStyle={{
              backgroundColor: "#0FADFF",
              borderRadius: 30,
              width: 370,
            }}
            style={styles.postPin}
          >
            <Text style={styles.sendButton}>Send</Text>
            <Icon color={"white"} name="send" size={"15"} />
          </Button>
        </View>
      </BottomSheetModal>
    );
  }
);
