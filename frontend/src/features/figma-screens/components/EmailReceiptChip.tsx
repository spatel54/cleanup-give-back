import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EmailReceiptIcon } from './AccountIcons';
import { colors, fontFamilies, radius } from '../tokens';

type EmailReceiptChipProps = {
  label?: string;
};

/** Email confirmation chip shared by Order History and Donation History. */
export function EmailReceiptChip({
  label = 'Confirmation receipt sent to email',
}: EmailReceiptChipProps) {
  return (
    <View style={styles.chip}>
      <EmailReceiptIcon width={16} height={16} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
});
