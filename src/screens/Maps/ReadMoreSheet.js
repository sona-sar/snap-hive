import React from "react";
import { View, Text, Pressable } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { formatTime } from "../../helpers/helper";

export const ReadMoreSheet = React.forwardRef(
  ({ curDeal, currentPin, weekName }, ref) => {
    return (
      <BottomSheetModal ref={ref} index={0} snapPoints={["55%"]}>
        {/* ... (copy the ReadMore BottomSheetModal content from the original file) */}
      </BottomSheetModal>
    );
  }
);
