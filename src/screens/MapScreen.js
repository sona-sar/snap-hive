import React, { useState, useEffect, useRef, startTransition } from "react";
import "react-native-gesture-handler";
import MapView, { Marker } from "react-native-maps";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import DateTimePicker from "@react-native-community/datetimepicker";
import dealsImage from "../../assets/images/dealsImage.png";
// require('dotenv').config();

const googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API;

import {
  StyleSheet,
  View,
  Dimensions,
  ScrollView,
  TextInput,
  Image,
  Text,
  TouchableOpacity,
  Pressable,
  FlatList,
  Animated,
} from "react-native";
import { Button, Icon } from "@rneui/themed";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import Ionicons from "react-native-vector-icons/Ionicons";
import { supabase } from "../utils/hooks/supabase";
import { makeKey, formatTime } from "../helpers/helper";

export default function MapScreen({ navigation }) {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const PinModalRef = useRef(null);
  const [curDeal, setCurDeal] = useState({});
  const bottomSheetRef = useRef(null);
  const snapPoints = ["74%", "90%"];
  function handlePresentModal() {
    bottomSheetRef.current?.present();
  }
  const [currentPin, setCurrentPin] = useState({
    title: "",
    location: {},
    address: "",
    description: "",
    deals: {
      dealInfo: "",
      allDay: false,
    },
    type: "",
    time: 0,
  });
  const [pins, setPins] = useState([]);
  const infoDataAddDeal = [
    {
      title: "Time",
      subtitle: "From what time is this deal available?",
      onPress: TimeInfo,
      disabled: false,
    },
    {
      title: "Repeat",
      subtitle: "If applicable, enter the days this deal reoccurs.",
      onPress: RepeatInfo,
      disabled: false,
    },
  ];

  const infoDataMakePin = [
    {
      title: "Time",
      subtitle: "From what time is this deal available?",
      onPress: TimeInfo,
      disabled: false,
    },
    {
      title: "Resource Type",
      subtitle: "Select all filters that apply to this resource.",
      onPress: TypeInfo,
      disabled: false,
    },
  ];

  const resourceTypes = [
    {
      type: "Grocery Store",
      pic: require("../../assets/mapfeature/BeeInBasket.png"),
      color: "#2EAD78",
    },
    {
      type: "Community Garden",
      pic: require("../../assets/mapfeature/BeeOnEggplant.png"),
      color: "#FFC000",
    },
    {
      type: "Snap EBT",
      pic: require("../../assets/mapfeature/BeeBalling.png"),
      color: "#B4649D",
    },
    {
      type: "Restaurant",
      pic: require("../../assets/mapfeature/BeeWillEatYou.png"),
      color: "#FFBAC6",
    },
    {
      type: "Food Pantry",
      pic: require("../../assets/mapfeature/BeeInBagel.png"),
      color: "#0894FA",
    },
    {
      type: "other",
      pic: require("../../assets/mapfeature/BeeSmells.png"),
      color: "#EDEEEF",
    },
  ];
  const weekName = ["M", "T", "W", "Th", "F", "S", "Su"];
  const [isPinConditionMet, setIsPinConditionMet] = useState(false);
  const [dayofWeek, setDayOfWeek] = useState([0, 0, 0, 0, 0, 0, 0]);
  const initialDate = new Date();
  initialDate.setHours(0, 0, 0, 0);
  const [badge, setBadge] = useState(false);
  const [sendButton, setSendButton] = useState(false);
  const [showPins, setShowPins] = useState(false);
  const PinInfoSheet = useRef(null);
  const DealInfoSheet = useRef(null);
  const ReadMore = useRef(null);
  const TimeInfoSheet = useRef(null);

  const [selectedResourceType, setSelectedResourceType] = useState("");
  const RepeatInfoSheet = useRef(null);
  const TypeInfoSheet = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [checkAllDay, setCheckAllDay] = useState(true);
  const [dealInformation, setDealInformation] = useState("");
  const [description, setDescription] = useState("");
  const [pinDescription, setPinDescription] = useState("");
  const [organization, setOrganization] = useState("");
  const [lastAddedPinIndex, setLastAddedPinIndex] = useState(null);
  const [clickedUsers, setClickedUsers] = useState({}); // State to track clicked users
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialDate);
  const [mode, setMode] = useState("time");
  const [show, setShow] = useState(false);
  const [pinDeals, setPinDeals] = useState([]);
  const scaleAnimate = useRef(new Animated.Value(50)).current;
  const [currentAddress, setCurrentAddress] = useState("");
  const [curDistMiles, setCurDistMiles] = useState("");
  const [curDistMins, setCurDistMins] = useState("");
  const [markets, setMarkets] = useState([
    {
      id: 1,
      title: "Trader Joes",
      description: "Retail",
      image: "https://logonoid.com/images/trader-joes-logo.png",
    },
    {
      id: 2,
      title: "Seeds of Hope",
      description: "Community Garden",
      image:
        "https://www.seedsofhopela.org/uploads/1/1/8/5/118565408/published/sohlogo_4.png?1528757672",
    },
    {
      id: 3,
      title: "Vons",
      description: "Grocery",
      image: "https://download.logo.wine/logo/Vons/Vons-Logo.wine.png",
    },
    {
      id: 4,
      title: "Davids Truck",
      description: "Grocery",
      image: "https://logodix.com/logo/37412.jpg",
    },
  ]);
  const onChange = (event, selectedDate, identifier) => {
    const currentDate =
      selectedDate || (identifier === "start" ? startDate : endDate);
    setShow({ ...show, [identifier]: false });

    if (identifier === "start") {
      setStartDate(currentDate);
    } else {
      setEndDate(currentDate);
    }
  };

  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };

  const showDatepicker = () => {
    showMode("date");
  };

  const showTimepicker = () => {
    showMode("time");
  };

  async function fetchAddress(lat, long) {
    const latlong = `${lat},${long}`;
    const requestOptions = {
      method: "GET",
    };

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlong}&key=${googleApiKey}`,
        requestOptions
      );
      const result = await response.json();

      if (result.results && result.results.length > 0) {
        return result.results[0].formatted_address;
      } else {
        throw new Error("No results found");
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      return "Error fetching address"; // Or handle error as needed
    }
  }

  async function fetchDistance(originLat, originLong, destLat, destLong) {
    //dest and origin are lat long
    let origin = `${originLat},${originLong}`;
    let destination = `${destLat},${destLong}`;
    const requestOptions = {
      method: "GET",
    };
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${origin}&destinations=${destination}&key=${googleApiKey}`,
        requestOptions
      );
      const result = await response.json();

      if (
        result.rows &&
        result.rows.length > 0 &&
        result.rows[0].elements.length > 0
      ) {
        return [
          result.rows[0].elements[0].distance.text,
          result.rows[0].elements[0].duration.text,
        ];
      } else {
        throw new Error("No results found");
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      return "Error fetching address"; // Or handle error as needed
    }
  }

  const insertData = async (currentPin) => {
    try {
      let currentTimestamp = new Date().toISOString();
      let lat = currentPin?.location.latitude;
      let long = currentPin?.location.longitude;
      let newPin = {
        title: organization,
        description: pinDescription,
        location: currentPin?.location,
        address: "string",
        deals: [],
        type: selectedResourceType,
        time: currentTimestamp,
      };
      const { data, error } = await supabase
        .from("pins") //
        .insert(newPin)
        .select(); // Insert the event data
      if (error) {
        console.error("Error:", error);
      } else {
        // console.log("[SUCCESS] > Data inserted: ", data);
        setPins([...pins, data[0]]);
        setLastAddedPinIndex(pins.length);
        setCurrentPin(data[0]);
        setSelectedResourceType("");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  const fetchData = async () => {
    try {
      const { data, error } = await supabase.from("pins").select("*");
      if (error) {
        console.error("Error fetching data:", error);
      } else {
        setPins(data);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };
  const handlePress = (type) => {
    setSelectedResourceType(type);
  };
  useEffect(() => {
    fetchData();
    setMarkets(pins?.slice(0, 4));
  }, []);

  const handleUserClick = () => {
    setCheckAllDay(!checkAllDay);
    if (checkAllDay !== false) {
      setStartDate(initialDate);
      setEndDate(initialDate);
    }
    setClickedUsers((prevState) => {
      const newState = { ...prevState, [0]: !prevState[0] };
      return newState;
    });
  };

  const renderItem = ({ item, index }) => {
    const isSelected = item?.type === selectedResourceType;
    return (
      <View>
        <TouchableOpacity
          style={{
            height: 100,
            width: 100,
            borderRadius: 50,
            backgroundColor: `${isSelected ? "#0FADFF" : item.color}`,
            justifyContent: "center",
            alignItems: "center",
            margin: 10,
          }}
          onPress={() => handlePress(item.type)}
        >
          <Image style={{ height: 60, width: 60 }} source={item.pic}></Image>
          {/* Add any content or functionality for the Pressable here */}
        </TouchableOpacity>
        <Text style={{ justifyContent: "space-between", textAlign: "center" }}>
          {item.type}
        </Text>
      </View>
    );
  };

  function createPinInfo() {
    PinInfoSheet.current?.present();
    setSendButton(false);
  }

  function TimeInfo() {
    TimeInfoSheet.current?.present();
  }
  function RepeatInfo() {
    RepeatInfoSheet.current?.present();
  }
  function TypeInfo() {
    TypeInfoSheet.current?.present();
  }
  function DealInfo() {
    DealInfoSheet.current?.present();
  }
  function ReadMoreInfo(deal) {
    setCurDeal(deal);
    ReadMore.current?.present();
  }
  function CloseDealInfo() {
    DealInfoSheet.current?.close();
  }
  function CloseTime() {
    TimeInfoSheet.current?.close();
  }
  function CloseRepeat() {
    RepeatInfoSheet.current?.close();
  }
  function CloseType() {
    TypeInfoSheet.current?.close();
  }

  const resetDealsStates = () => {
    setClickedUsers({});
    setStartDate(initialDate);
    setEndDate(initialDate);
    setDayOfWeek([0, 0, 0, 0, 0, 0, 0]);
    setDealInformation("");
  };

  async function addDeal(pin, deal) {
    if (pin?.id) {
      const { error } = await supabase
        .from("pins")
        .update({ deals: [...pin?.deals, deal] })
        .eq("id", pin?.id)
        .then(() => {
          // console.log("Deal Added");
        })
        .then(async () => {
          await readDeals(pin).then(() => {
            CloseDealInfo();
            resetDealsStates();
          });
        })
        .catch((error) => {
          console.error("Something went wrong while adding a deal: ", error);
        });
    }
  }

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

  function getPinWithId(id) {
    let temp = null;
    pins.map((pin) => {
      if (pin.id == id) {
        temp = pin;
      }
    });
    return temp;
  }

  async function handlePinModalRef(id) {
    // console.log(id);
    console.log("CLICKING");

    if (id) {
      let tempPin = getPinWithId(id);
      setCurrentPin(tempPin);

      try {
        const address = await fetchAddress(
          tempPin.location.latitude,
          tempPin.location.longitude
        );
        const distanceInfo = await fetchDistance(
          currentRegion.latitude,
          currentRegion.longitude,
          tempPin.location.latitude,
          tempPin.location.longitude
        );
        const distMiles = distanceInfo[0];
        const distMinutes = distanceInfo[1];
        setCurDistMiles(distMiles);
        setCurDistMins(distMinutes);
        setCurrentAddress(address);
      } catch (error) {
        console.error("Error fetching address:", error);
      }

      await readDeals(tempPin);
      PinModalRef?.current?.present();
    }
  }

  function animateElement() {
    Animated.timing(scaleAnimate, {
      toValue: 100,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  }
  const animationStyle = {
    width: scaleAnimate,
    height: scaleAnimate,
  };

  function sendToDatabase() {
    insertData(currentPin);
    setPinDescription("");
    setOrganization("");
    setDayOfWeek([0, 0, 0, 0, 0, 0, 0]);
    setSendButton(true);
    setCheckAllDay(false);
    PinInfoSheet.current?.close();
  }

  function selectRepeatDays(day) {
    let dayindex = weekName.indexOf(day);
    const newdayselect = dayofWeek.map((d, i) => {
      if (i == dayindex) {
        return !d;
      } else {
        return d;
      }
    });
    setDayOfWeek(newdayselect);
  }

  function expandModal() {
    PinInfoSheet.current?.snapToIndex(1);
  }

  function selectRepeatDays(day) {
    let dayindex = weekName.indexOf(day);
    const newdayselect = dayofWeek.map((d, i) => {
      if (i == dayindex) {
        return !d;
      } else {
        return d;
      }
    });
    setDayOfWeek(newdayselect);
  }

  const showLocations = () => {
    if (showPins) {
      return pins.map((item, index) => {
        return (
          <Marker
            style={styles.pinsVisible}
            key={index}
            coordinate={item.location}
            title={item.title}
            onPress={() => {
              handlePinModalRef(item.id);
            }}
            // address = {item.address}
            description={item.description}
            tracksViewChanges={false}
          >
            <Image
              style={{ height: 50, width: 40 }}
              source={
                item?.type === "Community Garden"
                  ? require("../../assets/mapfeature/BeePinGreen.png")
                  : require("../../assets/mapfeature/BeePin.png")
              }
            />
          </Marker>
        );
      });
    }
    return null;
  };

  const handleMapPress = (e) => {
    if (showPins) {
      const newPin = {
        title: "Default Name",
        location: e.nativeEvent.coordinate,
        description: "Default Description",
        type: "food",
        time: 24,
      };
      let lat = newPin.location.latitude;
      let long = newPin.location.longitude;

      setCurrentPin({
        location: newPin.location,
        address: "string",
        title: newPin.title,
        description: newPin.description,
        time: newPin.time,
        type: newPin.type,
      });
      createPinInfo();
    }
  };

  function deletePin() {
    if (lastAddedPinIndex !== null && sendButton == false) {
      setIsPinConditionMet(false);
      setStartDate(initialDate);
      setEndDate(initialDate);
      setPinDescription("");
      setOrganization("");
      setDayOfWeek([0, 0, 0, 0, 0, 0, 0]);
      setCheckAllDay(false);
      PinInfoSheet.current?.close();
      setPins(pins.filter((_, index) => index !== lastAddedPinIndex));
      setLastAddedPinIndex(null); // Reset the tracker
    }
  }

  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [currentRegion, setCurrentRegion] = useState({
    latitude: 34.0211573,
    longitude: -118.4503864,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setCurrentRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    })();
  }, []);

  function splitAfterNCharacters(str, n) {
    const regex = new RegExp(`.{1,${n}}`, "g");
    return str.match(regex);
  }

  useEffect(() => {
    const startTime = String(startDate).split(" ")[4];
    const endTime = String(endDate).split(" ")[4];
    if (
      dealInformation !== "" &&
      (startTime !== "00:00:00" ||
        endTime !== "00:00:00" ||
        clickedUsers[0] === true)
    ) {
      setIsPinConditionMet(true);
    } else {
      setIsPinConditionMet(false);
    }
  }, [description, dealInformation, startDate, endDate, checkAllDay]);

  let text = "Waiting...";
  text = JSON.stringify(location);

  return (
    <BottomSheetModalProvider>
      <View style={[styles.container, { marginBottom: tabBarHeight }]}>
        <MapView
          style={styles.map}
          region={currentRegion}
          mapType="standard"
          showsUserLocation={false}
          showsMyLocationButton={true}
          onLongPress={handleMapPress}
        >
          {location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
            >
              <Image
                source={require("../../assets/mapfeature/BeeBitmoji.png")}
                style={{ width: 100, height: 110 }}
              />
            </Marker>
          )}
          {showLocations()}
        </MapView>

        <BottomSheetModal
          ref={PinInfoSheet}
          index={0}
          snapPoints={["61%", "90%"]}
          onDismiss={deletePin}
        >
          <View>
            <View flexDirection={"row"} alignItems={"center"}>
              <Text style={styles.headerPinSheet}>Hive Pin</Text>
              <TouchableOpacity
                style={styles.exitCreatePin}
                onPress={deletePin}
              >
                <Icon name="close" size="20"></Icon>
              </TouchableOpacity>
            </View>
            <Text style={styles.subheadingPinSheet}>
              Enter additional details about your resource pin below.
            </Text>
            <View flexDirection={"row"}>
              <Text style={styles.information}>Organization Name</Text>
              <Text style={{ color: "red" }}>*</Text>
            </View>

            <TextInput
              style={styles.input}
              onChangeText={(organization) => setOrganization(organization)}
              value={organization}
            />
            <View flexDirection={"row"}>
              <Text style={styles.information}>Description</Text>
            </View>
            <TextInput
              style={styles.input}
              onChangeText={(pinDescription) =>
                setPinDescription(pinDescription)
              }
              value={pinDescription}
            />
            {infoDataMakePin.map((item, index) => (
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
              onPress={sendToDatabase}
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

        <BottomSheetModal
          ref={DealInfoSheet}
          index={0}
          snapPoints={["72%"]}
          onDismiss={deletePin}
        >
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
              <TouchableOpacity
                style={styles.exitCreatePin}
                onPress={deletePin}
              >
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
                  image: require("../../assets/images/dealsImage.png"),
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

        <BottomSheetModal ref={TimeInfoSheet} index={0} snapPoints={["45%"]}>
          <View
            style={{ position: "relative" }}
            flexDirection={"row"}
            alignItems={"center"}
            justifyContent={"center"}
          >
            <Text style={styles.InfoHeader} marginBottom={15}>
              {" "}
              Time{" "}
            </Text>
            <TouchableOpacity
              style={{
                width: "100",
                height: "100",
                borderRadius: "50",
                padding: 5,
                backgroundColor: "#EDEEEF",
                position: "absolute",
                right: 15,
                top: 10,
              }}
              onPress={CloseTime}
            >
              <Icon name="close" size="20"></Icon>
            </TouchableOpacity>
          </View>

          <View style={styles.moreInfoContainer}>
            <View
              flexDirection={"row"}
              alignItems={"center"}
              justifyContent={"space-between"}
            >
              <View flexDirection={"column"}>
                <Text style={styles.moreInfoTitle}>Start</Text>
                <Text style={styles.moreInfoSub}>
                  What time does this deal begin?
                </Text>
              </View>
              <DateTimePicker
                testID="dateTimePicker"
                value={startDate}
                mode={mode}
                is24Hour={true}
                textColor="red"
                onChange={(event, date) => onChange(event, date, "start")}
              />
            </View>
          </View>
          <View color={"none"} padding={15}>
            <View
              flexDirection={"row"}
              alignItems={"center"}
              justifyContent={"space-between"}
            >
              <View flexDirection={"column"}>
                <Text style={styles.moreInfoTitle}>End</Text>
                <Text style={styles.moreInfoSub}>
                  What time does this deal end?
                </Text>
              </View>
              <DateTimePicker
                testID="dateTimePicker"
                value={endDate}
                mode={mode}
                is24Hour={true}
                onChange={(event, date) => onChange(event, date, "end")}
              />
            </View>
          </View>
          <Button
            buttonStyle={{
              backgroundColor: "#0FADFF",
              borderRadius: 30,
              width: 370,
            }}
            style={styles.postPin}
            onPress={CloseTime}
          >
            <Text style={styles.sendButton}>Save</Text>
          </Button>
        </BottomSheetModal>
        <BottomSheetModal ref={RepeatInfoSheet} index={0} snapPoints={["45%"]}>
          <View
            style={{ position: "relative" }}
            flexDirection={"row"}
            alignItems={"center"}
            justifyContent={"center"}
          >
            <Text style={styles.InfoHeader} marginBottom={15}>
              {" "}
              Repeat{" "}
            </Text>
            <TouchableOpacity
              style={{
                width: "100",
                height: "100",
                borderRadius: "50",
                padding: 5,
                backgroundColor: "#EDEEEF",
                position: "absolute",
                right: 15,
                top: 10,
              }}
              onPress={CloseTime}
            >
              <Icon name="close" size="20"></Icon>
            </TouchableOpacity>
          </View>
          <View style={styles.moreInfoContainer}>
            <View flexDirection={"column"}>
              <Text style={styles.moreInfoTitle}>Repeat on</Text>
              <Text style={styles.moreInfoSub}>
                Select the day this deal repeats on.
              </Text>
            </View>
          </View>
          <View
            flexDirection={"row"}
            height={50}
            width={"100%"}
            justifyContent={"space-between"}
            padding={10}
            marginTop={20}
          >
            {weekName.map((week) => {
              return (
                <Pressable
                  key={makeKey}
                  onPress={() => {
                    selectRepeatDays(week);
                  }}
                  height={40}
                  width={40}
                  backgroundColor={
                    dayofWeek[weekName.indexOf(week)] ? "#0FADFF" : "#EDEEEF"
                  }
                  borderRadius={20}
                >
                  <Text
                    style={{
                      color: dayofWeek[weekName.indexOf(week)]
                        ? "white"
                        : "#0FADFF",
                      fontWeight: "600",
                      textAlign: "center",
                      paddingVertical: 12,
                    }}
                  >
                    {week}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Button
            buttonStyle={{
              backgroundColor: "#0FADFF",
              borderRadius: 30,
              width: 370,
            }}
            style={styles.postPin}
            onPress={CloseRepeat}
          >
            <Text style={styles.sendButton}>Save</Text>
          </Button>
        </BottomSheetModal>
        <BottomSheetModal ref={TypeInfoSheet} index={0} snapPoints={["64%"]}>
          <View>
            <View
              style={{ position: "relative" }}
              flexDirection={"row"}
              alignItems={"center"}
              justifyContent={"center"}
            >
              <Text style={styles.InfoHeader}>Type</Text>
              <TouchableOpacity
                style={{
                  width: "100",
                  height: "100",
                  borderRadius: "50",
                  padding: 5,
                  backgroundColor: "#EDEEEF",
                  position: "absolute",
                  right: 15,
                  top: 10,
                }}
                onPress={CloseTime}
              >
                <Icon name="close" size="20"></Icon>
              </TouchableOpacity>
            </View>
            <Text style={{ textAlign: "center", color: "#646567", size: 10 }}>
              Select the type of resource
            </Text>
            <FlatList
              data={resourceTypes}
              renderItem={renderItem}
              keyExtractor={(item) => item.type}
              numColumns={3}
              scrollEnabled={false}
              contentContainerStyle={styles.gridContainer}
            />
            <Button
              buttonStyle={{
                backgroundColor: "#0FADFF",
                borderRadius: 30,
                width: 370,
              }}
              style={styles.postPin}
              onPress={CloseType}
            >
              <Text style={styles.sendButton}>Save</Text>
            </Button>
          </View>
        </BottomSheetModal>
        <BottomSheetModal ref={PinModalRef} index={0} snapPoints={snapPoints}>
          <View
            style={{
              marginTop: 5,
              marginLeft: 20,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <View style={styles.imageContainer}>
              <Image
                style={styles.mainStories}
                src="https://wallpapercave.com/wp/JTpVKUS.jpg"
              ></Image>
            </View>
            <View
              style={{
                display: "flex",
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "600", marginBottom: 5 }}
              >
                {currentPin?.title}
              </Text>
              <Text style={{ color: "#646567", fontSize: 11, marginBottom: 5 }}>
                870 Echo Park Ave, Los Angeles, CA 90026{" "}
              </Text>
              <View style={{ display: "flex", flexDirection: "row", gap: 0 }}>
                <Text
                  style={{
                    marginBottom: 4,
                    color: "#1A9964",
                    fontWeight: 400,
                    fontSize: 11,
                  }}
                >
                  23 Active Deals
                </Text>
                <Text style={{ fontSize: 11, color: "#646567" }}>
                  {" "}
                  • 6.9 miles •{" "}
                </Text>
                <Text style={{ fontSize: 11, color: "#EF5002" }}>
                  Reoccurring
                </Text>
              </View>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 4,
                  alignItems: "center",
                }}
              >
                <AntDesign name="star" size={16} color="#0894FA" />
                <AntDesign name="star" size={16} color="#0894FA" />
                <AntDesign name="star" size={16} color="#0894FA" />
                <AntDesign name="star" size={16} color="#0894FA" />
                <AntDesign name="staro" size={16} color="#0894FA" />
                <Text style={{ fontSize: 12, color: "#646567" }}>
                  2034 Shares
                </Text>
              </View>
            </View>
          </View>
        </BottomSheetModal>
        <BottomSheetModal ref={PinModalRef} index={0} snapPoints={snapPoints}>
          <View
            style={{
              marginTop: 5,
              marginLeft: 20,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 15,
            }}
          >
            <View style={styles.imageContainer}>
              <Image
                style={styles.mainStories}
                src="https://wallpapercave.com/wp/JTpVKUS.jpg"
              ></Image>
            </View>
            <View
              style={{
                display: "flex",
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "600", marginBottom: 5 }}
              >
                {currentPin?.title}
              </Text>
              <Text style={{ color: "#646567", fontSize: 11, marginBottom: 5 }}>
                {currentAddress}
              </Text>
              <View style={{ display: "flex", flexDirection: "row", gap: 0 }}>
                <Text
                  style={{
                    marginBottom: 4,
                    color: "#1A9964",
                    fontWeight: 400,
                    fontSize: 11,
                  }}
                >
                  {pinDeals.length} Active Deals
                </Text>
                <Text style={{ fontSize: 11, color: "#646567" }}>
                  {" "}
                  • {curDistMiles} •{" "}
                </Text>
                <Text style={{ fontSize: 11, color: "#EF5002" }}>
                  Reoccurring
                </Text>
              </View>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 4,
                  alignItems: "center",
                }}
              >
                <AntDesign name="star" size={16} color="#0894FA" />
                <AntDesign name="star" size={16} color="#0894FA" />
                <AntDesign name="star" size={16} color="#0894FA" />
                <AntDesign name="star" size={16} color="#0894FA" />
                <AntDesign name="staro" size={16} color="#0894FA" />
                <Text style={{ fontSize: 12, color: "#646567" }}>
                  2034 Shares
                </Text>
              </View>
            </View>
          </View>
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScrollView}
            >
              <View style={styles.categoryContainer}>
                <Button
                  buttonStyle={styles.someButtonStyles}
                  title="Bookmarks"
                  titleStyle={{
                    fontWeight: "500",
                    color: "black",
                    fontSize: 12,
                    margin: 3,
                  }}
                >
                  🎉 Big Groups
                </Button>
                <Button
                  titleStyle={{
                    fontWeight: "500",
                    color: "black",
                    fontSize: 12,
                    margin: 3,
                  }}
                  buttonStyle={styles.someButtonStyles}
                >
                  🍾 Special Occasions
                </Button>
                <Button
                  titleStyle={{
                    fontWeight: "500",
                    color: "black",
                    fontSize: 12,
                    margin: 3,
                  }}
                  buttonStyle={styles.someButtonStyles}
                >
                  🏠 Family Friends
                </Button>
                <Button
                  titleStyle={{
                    fontWeight: "500",
                    color: "black",
                    fontSize: 12,
                    margin: 3,
                  }}
                  buttonStyle={styles.someButtonStyles}
                >
                  🍽 Restaurants
                </Button>
              </View>
            </ScrollView>

            <View style={styles.shareContainer}>
              <View style={{ flex: 1 }}>
                <Button
                  onPress={DealInfo}
                  buttonStyle={styles.actionButtons}
                  titleStyle={{
                    fontWeight: "500",
                    color: "black",
                    fontSize: 12,
                  }}
                >
                  <FontAwesome6 name="add" size={18} color="black" /> Add New
                </Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  buttonStyle={styles.actionButtons}
                  titleStyle={{
                    fontWeight: "400",
                    color: "black",
                    fontSize: 12,
                  }}
                >
                  <FontAwesome6 name="map" size={18} color="black" />{" "}
                  {curDistMins}{" "}
                </Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  buttonStyle={styles.actionButtonsBlue}
                  titleStyle={{
                    fontWeight: "400",
                    color: "black",
                    fontSize: 12,
                  }}
                >
                  <FontAwesome6 name="share" size={18} color="white" />
                </Button>
              </View>
            </View>
          </View>
          {pinDeals?.length > 0 ? (
            <ScrollView>
              <View
                style={{
                  paddingTop: 6,
                  paddingBottom: 6,
                  borderRadius: 10,
                  marginLeft: 20,
                  marginTop: 20,
                  marginRight: 20,
                  backgroundColor: "white",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                }}
              >
                <View style={styles.dealsContainer}>
                  {pinDeals?.map((deal, index) => (
                    <Pressable
                      key={index}
                      onPress={() => {
                        ReadMoreInfo(deal);
                      }}
                      style={styles.dealContainer}
                    >
                      <Image style={styles.dealsImage} source={deal.image} />
                      <View style={styles.dealTextContainer}>
                        <Text style={{ fontWeight: "400", fontSize: 16 }}>
                          {deal.title}
                        </Text>
                      </View>
                      <Button
                        style={styles.buttonsInside}
                        buttonStyle={{
                          backgroundColor: "transparent",
                          borderRadius: 30,
                        }}
                      >
                        <Icon name="chevron-right" color="black" />
                      </Button>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View
                style={{
                  marginTop: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Merriweather-Regular",
                    fontSize: 13,
                    color: "#9B9B9B",
                  }}
                >
                  View More
                </Text>
              </View>
            </ScrollView>
          ) : null}

          <BottomSheetModal ref={ReadMore} index={0} snapPoints={["55%"]}>
            <View style={styles.pinInformationContainers}>
              <Text
                style={{
                  color: "#C1C1C1",
                  fontWeight: "bold",
                  fontSize: 16,
                  marginBottom: 10,
                }}
              >
                {curDeal.title}
              </Text>
              <Text>{currentPin?.title}</Text>
            </View>
            <View style={styles.pinInformationContainers}>
              <View style={styles.infoTimeSection}>
                <Text
                  style={{
                    color: "#C1C1C1",
                    fontWeight: "bold",
                    fontSize: 14,
                    marginBottom: 10,
                  }}
                >
                  Time
                </Text>
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#EDEEEF",
                      paddingTop: 5,
                      paddingBottom: 5,
                      paddingRight: 15,
                      paddingLeft: 15,
                      borderRadius: 5,
                    }}
                  >
                    <Text style={{ color: "#0CADEF", fontSize: 12 }}>
                      {formatTime(curDeal?.time?.startDate)}
                    </Text>
                  </View>
                  <Text style={{ color: "#0CADEF", fontWeight: "bold" }}>
                    -
                  </Text>
                  <View
                    style={{
                      backgroundColor: "#EDEEEF",
                      paddingTop: 5,
                      paddingBottom: 5,
                      paddingRight: 15,
                      paddingLeft: 15,
                      borderRadius: 5,
                    }}
                  >
                    <Text style={{ color: "#0CADEF", fontSize: 12 }}>
                      {formatTime(curDeal?.time?.endDate)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ marginTop: 20 }}>
                <Text
                  style={{
                    color: "#C1C1C1",
                    fontWeight: "bold",
                    fontSize: 14,
                    marginBottom: 10,
                  }}
                >
                  Repeat
                </Text>
                <View
                  flexDirection={"row"}
                  width={"100%"}
                  justifyContent={"space-between"}
                >
                  {curDeal.repeat &&
                    weekName.map((week) => {
                      return (
                        <Pressable
                          key={makeKey}
                          style={{
                            height: 35,
                            width: 35,
                            borderRadius: 100,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                          backgroundColor={
                            curDeal?.repeat[weekName.indexOf(week)]
                              ? "#0FADFF"
                              : "#EDEEEF"
                          }
                        >
                          <Text
                            style={{
                              color: curDeal?.repeat[weekName.indexOf(week)]
                                ? "white"
                                : "#0FADFF",
                              fontWeight: "500",
                            }}
                          >
                            {week}
                          </Text>
                        </Pressable>
                      );
                    })}
                </View>
              </View>
            </View>
          </BottomSheetModal>
        </BottomSheetModal>
        <View style={[styles.mapFooter, expanded ? styles.expanded : null]}>
          <View style={styles.locationContainer}>
            <TouchableOpacity
              style={[styles.userLocation, styles.shadow]}
              onPress={() => {
                const { latitude, longitude } = location.coords;
                setCurrentRegion({ ...currentRegion, latitude, longitude });
              }}
            >
              <Ionicons name="navigate" size={15} color="black" />
            </TouchableOpacity>
          </View>
          <View style={[styles.bitmojiContainer]}>
            <BottomSheetModal
              backgroundStyle={{ backgroundColor: "white" }}
              ref={bottomSheetRef}
              index={0}
              snapPoints={snapPoints}
            >
              <View style={styles.modalContainer}>
                <View style={styles.closeButton} type="solid" buttonStyle={{}}>
                  <TouchableOpacity
                    style={styles.exitCreatePin}
                    onPress={deletePin}
                  >
                    <Icon name="close" size="20"></Icon>
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    marginTop: -25,
                    marginLeft: 20,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View style={styles.imageContainer}>
                    <Image
                      style={styles.mainStories}
                      src="https://wallpapercave.com/wp/JTpVKUS.jpg"
                    ></Image>
                  </View>
                  <View
                    style={{
                      display: "flex",
                    }}
                  >
                    <Text
                      style={{ fontSize: 18, fontWeight: 600, marginBottom: 5 }}
                    >
                      Hive
                    </Text>
                    <Text
                      style={{
                        marginBottom: 4,
                        color: "#1A9964",
                        fontWeight: 400,
                        fontSize: 12,
                      }}
                    >
                      45 Deals Nearby
                    </Text>
                    <View
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 4,
                        alignItems: "center",
                      }}
                    >
                      <AntDesign name="star" size={16} color="#0894FA" />
                      <AntDesign name="star" size={16} color="#0894FA" />
                      <AntDesign name="star" size={16} color="#0894FA" />
                      <AntDesign name="star" size={16} color="#0894FA" />
                      <AntDesign name="staro" size={16} color="#0894FA" />
                      <Text style={{ fontSize: 12, color: "#646567" }}>
                        2034 Shares
                      </Text>
                    </View>
                  </View>
                </View>
                <View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScrollView}
                  >
                    <View style={styles.categoryContainer}>
                      <Button
                        buttonStyle={styles.someButtonStyles}
                        title="Bookmarks"
                        titleStyle={{
                          fontWeight: 500,
                          color: "black",
                          fontSize: 12,
                          margin: 3,
                        }}
                      >
                        🎉 Big Groups
                      </Button>
                      <Button
                        titleStyle={{
                          fontWeight: 500,
                          color: "black",
                          fontSize: 12,
                          margin: 3,
                        }}
                        buttonStyle={styles.someButtonStyles}
                      >
                        🍾 Special Occasions
                      </Button>
                      <Button
                        titleStyle={{
                          fontWeight: 500,
                          color: "black",
                          fontSize: 12,
                          margin: 3,
                        }}
                        buttonStyle={styles.someButtonStyles}
                      >
                        🏠 Family Friends
                      </Button>
                      <Button
                        titleStyle={{
                          fontWeight: 500,
                          color: "black",
                          fontSize: 12,
                          margin: 3,
                        }}
                        buttonStyle={styles.someButtonStyles}
                      >
                        🍽 Restaurants
                      </Button>
                    </View>
                  </ScrollView>
                </View>
                <View style={styles.shareContainer}>
                  <View style={{ flex: 1 }}>
                    <Button
                      buttonStyle={styles.actionButtons}
                      titleStyle={{
                        fontWeight: 500,
                        color: "black",
                        fontSize: 12,
                      }}
                    >
                      <FontAwesome6 name="add" size={18} color="black" /> blt
                      blt
                    </Button>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      buttonStyle={styles.actionButtons}
                      titleStyle={{
                        fontWeight: 400,
                        color: "black",
                        fontSize: 12,
                      }}
                    >
                      <FontAwesome6 name="map" size={18} color="black" /> 17 Min
                    </Button>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      buttonStyle={styles.actionButtons}
                      titleStyle={{
                        fontWeight: 400,
                        color: "black",
                        fontSize: 12,
                      }}
                    >
                      <FontAwesome6 name="heart" size={18} color="black" /> 71
                    </Button>
                  </View>
                </View>
                {markets.length > 0 ? (
                  <ScrollView>
                    <View
                      style={{
                        paddingTop: 6,
                        paddingBottom: 6,
                        borderRadius: 10,
                        marginLeft: 20,
                        marginTop: 20,
                        marginRight: 20,
                        backgroundColor: "white",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.1,
                        shadowRadius: 3,
                      }}
                    >
                      <View style={styles.dealsContainer}>
                        {markets.map((deal) => (
                          <Pressable
                            key={deal.id}
                            onPress={DealInfo}
                            style={styles.dealContainer}
                          >
                            <Image
                              style={styles.dealsImage}
                              source={dealsImage}
                            />
                            <View style={styles.dealTextContainer}>
                              <Text style={{ fontWeight: 400, fontSize: 16 }}>
                                {deal.title}
                              </Text>
                              <Text
                                style={{
                                  marginTop: 4,
                                  fontSize: 13,
                                  color: "#646567",
                                }}
                              >
                                {deal.description}
                              </Text>
                            </View>
                            <Button
                              style={styles.buttonsInside}
                              buttonStyle={{
                                backgroundColor: "transparent",
                                borderRadius: 30,
                              }}
                            >
                              <Icon name="chevron-right" color="black" />
                            </Button>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View
                      style={{
                        marginTop: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Merriweather-Regular",
                          fontSize: 13,
                          color: "#9B9B9B",
                        }}
                      >
                        View More
                      </Text>
                    </View>
                  </ScrollView>
                ) : null}
              </View>
            </BottomSheetModal>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.buttonScrollview}
            >
              <View style={styles.buttonContainer}>
                <Button
                  style={styles.buttonsInside}
                  titleStyle={{
                    fontWeight: 500,
                    color: "black",
                    fontSize: 13,
                    margin: 3,
                  }}
                  buttonStyle={{
                    backgroundColor: "#EDEEEF",
                    borderRadius: 30,
                  }}
                >
                  <Icon name="search" color="black" />
                </Button>
                <Button
                  onPress={() => {
                    setShowPins(true);
                    setExpanded(true);
                    handlePresentModal();
                  }}
                  style={styles.buttonsInside}
                  titleStyle={{
                    fontWeight: "500",
                    color: "black",
                    fontSize: 13,
                    margin: 3,
                  }}
                  buttonStyle={{
                    backgroundColor: "#FFC000",
                    borderRadius: 30,
                  }}
                >
                  <View>
                    <Image
                      style={{ width: 20, height: 20, zIndex: 10000 }}
                      source={require("../../assets/mapfeature/SingleBee.png")}
                    />
                  </View>
                  Hive
                </Button>
                <Button
                  onPress={() =>
                    fetchDistance(
                      currentRegion.latitude,
                      currentRegion.longitude,
                      37.33182,
                      -122.03118
                    )
                  }
                  style={styles.buttonsInside}
                  title="Places"
                  titleStyle={{
                    fontWeight: "500",
                    color: "black",
                    fontSize: 13,
                    margin: 3,
                  }}
                  buttonStyle={{
                    backgroundColor: "#EDEEEF",
                    borderRadius: 30,
                  }}
                />
                <Button
                  style={styles.buttonsInside}
                  title="Popular With Friends"
                  titleStyle={{
                    fontWeight: "500",
                    color: "black",
                    fontSize: 13,
                    margin: 3,
                  }}
                  buttonStyle={{
                    backgroundColor: "#EDEEEF",
                    borderRadius: 30,
                  }}
                />
                <Button
                  style={styles.buttonsInside}
                  title="Favorites"
                  titleStyle={{
                    fontWeight: "500",
                    color: "black",
                    fontSize: 13,
                    margin: 3,
                  }}
                  buttonStyle={{
                    backgroundColor: "#EDEEEF",
                    borderRadius: 30,
                  }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mapFooter: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 20,
    bottom: 0,
  },
  map: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  locationContainer: {
    backgroundColor: "transparent",
    width: "100%",
    paddingBottom: 8,
    alignItems: "center",
  },
  userLocation: {
    backgroundColor: "white",
    borderRadius: 100,
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  shadow: {
    shadowColor: "rgba(0, 0, 0)",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowRadius: 3,
    shadowOpacity: 0.5,
    elevation: 4,
  },
  bitmojiContainer: {
    width: "100%",
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: -1,
  },
  places: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "row",
    padding: 10,
    paddingTop: 15,
    paddingBottom: 15,
    gap: 10,
  },
  buttonScrollview: {
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    backgroundColor: "white",
    width: "100%",
    margin: 0,
    borderBottomWidth: 0.2,
    borderBottomColor: "#D9D9D9",
  },
  headerPinSheet: {
    fontSize: 17,
    fontWeight: "600",
    paddingBottom: 5,
    marginLeft: 10,
    marginRight: 45,
    paddingTop: 5,
    paddingRight: 225,
  },
  subheadingPinSheet: {
    fontSize: 11,
    color: "#6e6e6e",
    paddingLeft: 10,
    paddingBottom: 25,
  },
  information: {
    fontSize: 13,
    paddingLeft: 10,
    color: "#a3a3a3",
  },
  input: {
    height: 25,
    marginLeft: 10,
    marginRight: 10,
    marginTop: 5,
    marginBottom: 20,
    borderLeftColor: "#0FADFF",
    borderLeftWidth: 5,
    padding: 5,
    backgroundColor: "#EDEEEF",
    borderRadius: 4,
  },
  exitCreatePin: {
    width: "100",
    height: "100",
    borderRadius: "50",
    padding: 5,
    backgroundColor: "#EDEEEF",
  },
  moreInfoContainer: {
    color: "none",
    borderBottomWidth: 1,
    borderBottomColor: "#EDEEEF",
    padding: 15,
  },
  moreInfoTitle: {
    fontSize: 15,
    fontWeight: 500,
    paddingBottom: 4,
  },
  moreInfoSub: {
    fontSize: 11,
    color: "#646567",
  },
  postPin: {
    paddingTop: 30,
    borderRadius: 40,
    alignItems: "center",
  },
  modalContainer: {
    display: "flex",
    height: "100%",
  },
  closeButton: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    marginRight: 20,
  },
  dealsContainer: {
    elevation: 5,
    gap: 1,
    display: "flex",
    flexDirection: "column",
    // gap:10,
    backgroundColor: "#E2E3E5",
    // borderRadius:10,
  },
  dealContainer: {
    display: "flex",
    flexDirection: "row",
    paddingLeft: 10,
    backgroundColor: "white",
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
    alignItems: "center",
  },
  imageContainer: {
    width: 75,
    height: 75,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#0FADFF",
    justifyContent: "center",
    alignItems: "center",
  },
  dealStories: {
    width: 45,
    objectFit: "contain",
    height: 45,
    borderRadius: 100,
    borderColor: "white",
    backgroundColor: "white",
  },
  dealsImage: {
    width: 40,
    objectFit: "contain",
    height: 40,
    borderColor: "white",
    backgroundColor: "white",
  },
  mainStories: {
    width: 65,
    height: 65,
    borderRadius: 100,
    borderColor: "white",
    backgroundColor: "white",
  },
  dealTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  categoryContainer: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
  },
  categoryScrollView: {
    marginTop: 20,
    marginLeft: 20,
  },
  sendButton: {
    color: "white",
    fontWeight: "500",
  },
  shareContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexDirection: "row",
    marginLeft: 20,
    marginRight: 20,
    marginTop: 20,
  },
  InfoHeader: {
    textAlign: "center",
    fontWeight: "400",
    fontSize: 17,
    paddingTop: 10,
    paddingBottom: 10,
  },
  weekCircle: {
    color: "white",
    fontWeight: "500",
    textAlign: "center",
    paddingVertical: 12,
  },
  pinInformationContainers: {
    backgroundColor: "white",
    marginRight: 20,
    marginLeft: 20,
    marginTop: 20,
    borderRadius: 15,
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 20,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  someButtonStyles: {
    borderWidth: 1,
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 8,
    paddingRight: 8,
    borderColor: "#E2E3E5",
    backgroundColor: "white",
    borderRadius: 30,
  },
  actionButtons: {
    paddingTop: 8,
    paddingBottom: 8,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#EDEEEF",
    borderRadius: 30,
  },
  actionButtonsBlue: {
    paddingTop: 8,
    paddingBottom: 8,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#0CADFF",
    borderRadius: 30,
  },
  bottomDealContainer: {
    display: "flex",
    flexDirection: "row",
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
    paddingLeft: 10,
    backgroundColor: "white",
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
    alignItems: "center",
  },
  topDealContainer: {
    display: "flex",
    flexDirection: "row",
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    paddingLeft: 10,
    backgroundColor: "white",
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
    alignItems: "center",
  },
  pressable: {
    height: 100,
    width: 100,
    borderRadius: 50,
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
  },
  gridContainer: {
    justifyContent: "space-between",
    padding: 10,
  },
});
