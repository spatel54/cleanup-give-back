import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';

export type StatusType =
  | 'approved'
  | 'under-review'
  | 'not-approved'
  | 'photo-due'
  | 'restart-required'
  | 'gps-active';

const STATUS_CONFIG: Record<
  StatusType,
  { label: string; backgroundColor: string; color: string }
> = {
  approved: {
    label: 'Approved',
    backgroundColor: Colors.approvedContainer,
    color: Colors.approved,
  },
  'under-review': {
    label: 'Pending',
    backgroundColor: Colors.pendingContainer,
    color: Colors.pending,
  },
  'not-approved': {
    label: 'Declined',
    backgroundColor: Colors.declinedContainer,
    color: Colors.declined,
  },
  'photo-due': {
    label: 'Photo Due',
    backgroundColor: Colors.pendingContainer,
    color: Colors.pending,
  },
  'restart-required': {
    label: 'Restart Required',
    backgroundColor: Colors.declinedContainer,
    color: Colors.declined,
  },
  'gps-active': {
    label: 'GPS Active',
    backgroundColor: Colors.approvedContainer,
    color: Colors.approved,
  },
};

interface StatusTagProps {
  status: StatusType;
}

export function StatusTag({ status }: StatusTagProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Animated.View entering={FadeIn.duration(150)}>
      <View
        style={[styles.tag, { backgroundColor: config.backgroundColor }]}
        accessibilityRole="text"
        accessibilityLabel={`${config.label} status`}
      >
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  label: {
    fontFamily: 'NotoSans',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
