import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Button, Icon } from "@rneui/themed";

export const PinInfoSheet = React.forwardRef(
  (
    {
      currentPin,
      organization,
      setOrganization,
      pinDescription,
      setPinDescription,
      infoDataMakePin,
      sendToDatabase,
    },
    ref
  ) => {
    return (
      <BottomSheetModal ref={ref} index={0} snapPoints={["61%", "90%"]}>
        {/* ... (copy the PinInfoSheet content from the original file) */}
      </BottomSheetModal>
    );
  }
);
