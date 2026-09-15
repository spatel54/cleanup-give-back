import { Image, type ImageStyle } from 'expo-image';
import type { DimensionValue, StyleProp } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/constants/tokens';

type AssetIconProps = {
  width: number;
  height: number;
  style?: StyleProp<ImageStyle>;
};

function AssetIcon({
  source,
  width,
  height,
  style,
}: AssetIconProps & { source: number }) {
  return (
    <Image
      source={source}
      style={[{ width: width as DimensionValue, height: height as DimensionValue }, style]}
      contentFit="contain"
      pointerEvents="none"
      accessibilityIgnoresInvertColors
    />
  );
}

/** Records section — `folder.svg` */
export function RecordsFolderIcon({ width = 17, height = 14, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/folder.svg')}
      width={width ?? 17}
      height={height ?? 14}
      style={style}
    />
  );
}

/** Download Service Record — `export.svg` */
export function ExportRecordIcon({ width = 14, height = 14, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/export.svg')}
      width={width ?? 14}
      height={height ?? 14}
      style={style}
    />
  );
}

/** Approval History — `approval.svg` */
export function ApprovalHistoryIcon({ width = 15, height = 15, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/approval.svg')}
      width={width ?? 15}
      height={height ?? 15}
      style={style}
    />
  );
}

/** Request Data — `data.svg` */
export function RequestDataIcon({ width = 15, height = 17, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/data.svg')}
      width={width ?? 15}
      height={height ?? 17}
      style={style}
    />
  );
}

/** Letters row under Records — document with folded corner */
export function LettersRowIcon({
  width = 24,
  height = 24,
  color = colors.textPrimary,
}: {
  width?: number;
  height?: number;
  color?: string;
}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8V20.993C21.0009 21.1243 20.976 21.2545 20.9266 21.3762C20.8772 21.4979 20.8043 21.6087 20.7121 21.7022C20.6199 21.7957 20.5101 21.8701 20.3892 21.9212C20.2682 21.9723 20.1383 21.9991 20.007 22H3.993C3.72981 22 3.47739 21.8955 3.2912 21.7095C3.105 21.5235 3.00027 21.2712 3 21.008V2.992C3 2.455 3.449 2 4.002 2H14.997L21 8ZM19 9H14V4H5V20H19V9ZM8 7H11V9H8V7ZM8 11H16V13H8V11ZM8 15H16V17H8V15Z"
        fill={color}
      />
    </Svg>
  );
}

/** FAQ section header — question mark */
export function FaqIcon({
  width = 24,
  height = 24,
  color = colors.textPrimary,
}: {
  width?: number;
  height?: number;
  color?: string;
}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4C9.243 4 7 6.243 7 9H9C9 7.346 10.346 6 12 6C13.654 6 15 7.346 15 9C15 10.069 14.546 10.465 13.519 11.255C13.137 11.549 12.706 11.881 12.293 12.293C10.981 13.604 10.995 14.897 11 15V17H13V14.991C13 14.967 13.023 14.39 13.707 13.707C14.027 13.387 14.389 13.109 14.738 12.84C15.798 12.024 17 11.1 17 9C17 6.243 14.757 4 12 4ZM11 18H13V20H11V18Z"
        fill={color}
      />
    </Svg>
  );
}

/** Shop section — `shop.svg` */
export function ShopBagIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/shop.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

/** Order History — `order-history.svg` */
export function OrderHistoryIcon({ width = 15, height = 17, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/order-history.svg')}
      width={width ?? 15}
      height={height ?? 17}
      style={style}
    />
  );
}

/** Donation History — `donation.svg` */
export function DonationHistoryIcon({ width = 18, height = 18, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/donation.svg')}
      width={width ?? 18}
      height={height ?? 18}
      style={style}
    />
  );
}

/** Donation History card — hand + heart (`donate-history-icon.svg`) */
export function DonateCardIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/donate-history-icon.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

/** Preferences section — `preferences.svg` */
export function PreferencesIcon({ width = 15, height = 15, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/preferences.svg')}
      width={width ?? 15}
      height={height ?? 15}
      style={style}
    />
  );
}

/** Notifications row — `notification.svg` */
export function NotificationsRowIcon({ width = 14, height = 17, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/notification.svg')}
      width={width ?? 14}
      height={height ?? 17}
      style={style}
    />
  );
}

/** Privacy row — `privacy.svg` */
export function PrivacyRowIcon({ width = 14, height = 17, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/privacy.svg')}
      width={width ?? 14}
      height={height ?? 17}
      style={style}
    />
  );
}

/** Permissions section — `permissions.svg` */
export function PermissionsLockIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/permissions.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

/** Camera Access — `photos.svg` */
export function CameraAccessIcon({ width = 18, height = 18, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/photos.svg')}
      width={width ?? 18}
      height={height ?? 18}
      style={style}
    />
  );
}

/** Location Access — `location.svg` */
export function LocationAccessIcon({ width = 18, height = 18, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/location.svg')}
      width={width ?? 18}
      height={height ?? 18}
      style={style}
    />
  );
}

/** Row chevron — `chevron-right.svg` */
export function AccountChevronIcon({ width = 16, height = 16, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/chevron-right.svg')}
      width={width ?? 16}
      height={height ?? 16}
      style={style}
    />
  );
}

/** Log Out — `react-icons/io5/IoLogOut.svg` */
export function LogOutIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/react-icons/io5/IoLogOut.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

/** Delete Account — `react-icons/md/MdDelete.svg` */
export function DeleteAccountIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/react-icons/md/MdDelete.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

/** Copyright — `copyright.svg` */
export function CopyrightIcon({ width = 16, height = 16, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/copyright.svg')}
      width={width ?? 16}
      height={height ?? 16}
      style={style}
    />
  );
}

/** Warning triangle — `react-icons/bs/BsExclamationTriangleFill.svg` */
export function WarningTriangleIcon({ width = 16, height = 16, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/react-icons/bs/BsExclamationTriangleFill.svg')}
      width={width ?? 16}
      height={height ?? 16}
      style={style}
    />
  );
}

/** Selected radio — `react-icons/cg/CgRadioChecked.svg` */
export function RadioCheckedIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/react-icons/cg/CgRadioChecked.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

/** Unselected radio — `radio-empty.svg` */
export function RadioEmptyIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/radio-empty.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

/** Request sent success — `data-request-sent-check.svg` */
export function DataRequestSentCheckIcon({ width = 79, height = 79, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/data-request-sent-check.svg')}
      width={width ?? 79}
      height={height ?? 79}
      style={style}
    />
  );
}

/** Export record success — `export-record-success-check.svg` */
export function ExportRecordSuccessCheckIcon({
  width = 79,
  height = 79,
  style,
}: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/export-record-success-check.svg')}
      width={width ?? 79}
      height={height ?? 79}
      style={style}
    />
  );
}

/** Email receipt chip — `react-icons/md/MdEmail.svg` */
export function EmailReceiptIcon({ width = 16, height = 16, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/react-icons/md/MdEmail.svg')}
      width={width ?? 16}
      height={height ?? 16}
      style={style}
    />
  );
}

/** Give Feedback — `give-feedback.svg` */
export function GiveFeedbackIcon({ width = 18, height = 18, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/give-feedback.svg')}
      width={width ?? 18}
      height={height ?? 18}
      style={style}
    />
  );
}

/** Profile hero — large leaf (Figma `569:917`, 57.6×57.6, rotated −75°) */
export function ProfileLeafLargeIcon({ width = 58, height = 58, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/leaf-large.svg')}
      width={width ?? 58}
      height={height ?? 58}
      style={style}
    />
  );
}

/** Profile hero — small leaf (Figma `569:918`, 40.32×40.32, rotated −50°) */
export function ProfileLeafSmallIcon({ width = 40, height = 40, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/leaf-small.svg')}
      width={width ?? 40}
      height={height ?? 40}
      style={style}
    />
  );
}

/** Account → Updates — sparkle / what’s-new */ 
export function UpdatesIcon({ width = 16, height = 16, color = colors.copyright }: { width?: number; height?: number; color?: string }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5L13.35 8.15L19 9.5L13.35 10.85L12 16.5L10.65 10.85L5 9.5L10.65 8.15L12 2.5Z"
        fill={color}
      />
      <Path
        d="M18.5 14.5L19.15 17.1L21.75 17.75L19.15 18.4L18.5 21L17.85 18.4L15.25 17.75L17.85 17.1L18.5 14.5Z"
        fill={color}
      />
      <Path
        d="M6.25 15.25L6.7 17.05L8.5 17.5L6.7 17.95L6.25 19.75L5.8 17.95L4 17.5L5.8 17.05L6.25 15.25Z"
        fill={color}
      />
    </Svg>
  );
}

/** Membership / company-code section header — ID-badge icon */
export function MembershipIcon({ width = 18, height = 18, color = colors.textPrimary }: { width?: number; height?: number; color?: string }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 4C11.7348 4 11.4804 4.10536 11.2929 4.29289C11.1054 4.48043 11 4.73478 11 5V6C11 6.26522 11.1054 6.51957 11.2929 6.70711C11.4804 6.89464 11.7348 7 12 7C12.2652 7 12.5196 6.89464 12.7071 6.70711C12.8946 6.51957 13 6.26522 13 6V5C13 4.73478 12.8946 4.48043 12.7071 4.29289C12.5196 4.10536 12.2652 4 12 4ZM9.87868 2.87868C10.4413 2.31607 11.2044 2 12 2C12.7956 2 13.5587 2.31607 14.1213 2.87868C14.6839 3.44129 15 4.20435 15 5H19C19.7957 5 20.5587 5.31607 21.1213 5.87868C21.6839 6.44129 22 7.20435 22 8V17C22 17.7957 21.6839 18.5587 21.1213 19.1213C20.5587 19.6839 19.7957 20 19 20H5C4.20435 20 3.44129 19.6839 2.87868 19.1213C2.31607 18.5587 2 17.7956 2 17V8C2 7.20435 2.31607 6.44129 2.87868 5.87868C3.44129 5.31607 4.20435 5 5 5H9C9 4.20435 9.31607 3.44129 9.87868 2.87868ZM9.17157 7H5C4.73478 7 4.48043 7.10536 4.29289 7.29289C4.10536 7.48043 4 7.73478 4 8V17C4 17.2652 4.10536 17.5196 4.29289 17.7071C4.48043 17.8946 4.73478 18 5 18H19C19.2652 18 19.5196 17.8946 19.7071 17.7071C19.8946 17.5196 20 17.2652 20 17V8C20 7.73478 19.8946 7.48043 19.7071 7.29289C19.5196 7.10536 19.2652 7 19 7H14.8284C14.6807 7.4179 14.4407 7.80192 14.1213 8.12132C13.5587 8.68393 12.7956 9 12 9C11.2044 9 10.4413 8.68393 9.87868 8.12132C9.55928 7.80192 9.31933 7.4179 9.17157 7ZM6.87868 9.87868C7.44129 9.31607 8.20435 9 9 9C9.79565 9 10.5587 9.31607 11.1213 9.87868C11.6839 10.4413 12 11.2043 12 12C12 12.6529 11.7872 13.2838 11.4 13.8C12.0244 14.2692 12.5069 14.9167 12.7725 15.6659C12.9571 16.1864 12.6847 16.758 12.1641 16.9425C11.6436 17.1271 11.072 16.8547 10.8875 16.3341C10.6113 15.555 9.86866 15 9 15C8.9999 15 8.99981 15 8.99971 15C8.5859 14.9999 8.18222 15.1281 7.84428 15.3669C7.50634 15.6057 7.25076 15.9434 7.11273 16.3336C6.92851 16.8542 6.3571 17.1269 5.83644 16.9427C5.31579 16.7585 5.04305 16.1871 5.22727 15.6664C5.49081 14.9216 5.96866 14.2723 6.59956 13.7994C6.21264 13.2833 6 12.6526 6 12C6 11.2044 6.31607 10.4413 6.87868 9.87868ZM9 13C8.73478 13 8.48043 12.8946 8.29289 12.7071C8.10536 12.5196 8 12.2652 8 12C8 11.7348 8.10536 11.4804 8.29289 11.2929C8.48043 11.1054 8.73478 11 9 11C9.26522 11 9.51957 11.1054 9.70711 11.2929C9.89464 11.4804 10 11.7348 10 12C10 12.2652 9.89464 12.5196 9.70711 12.7071C9.51964 12.8946 9.2654 12.9999 9.00029 13M14 11C14 10.4477 14.4477 10 15 10H18C18.5523 10 19 10.4477 19 11C19 11.5523 18.5523 12 18 12H15C14.4477 12 14 11.5523 14 11ZM14 15C14 14.4477 14.4477 14 15 14H17C17.5523 14 18 14.4477 18 15C18 15.5523 17.5523 16 17 16H15C14.4477 16 14 15.5523 14 15Z"
        fill={color}
      />
    </Svg>
  );
}
