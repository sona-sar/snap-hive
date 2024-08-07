import React, { forwardRef } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

const TypeInfoModal = forwardRef(({ snapPoints }, ref) => (
  <BottomSheetModal
    ref={ref}
    index={0}
    snapPoints={snapPoints}
  >
    <Text style={{    textAlign: 'center',
    fontWeight: '400',
    fontSize: 17,
    paddingTop: 10,
    paddingBottom: 10,}}>Type</Text>
    {/* <Pressable style={styles.pressable}>
    </Pressable> */}
  </BottomSheetModal>
));

export default TypeInfoModal;