'use client';

/**
 * Admin icon set — Lucide glyphs via `react-icons/lu`.
 * Keep named exports stable so call sites stay unchanged.
 */
import type { IconType } from 'react-icons';
import {
  LuHouse,
  LuClipboardList,
  LuUsers,
  LuScale,
  LuMessageSquare,
  LuCalendar,
  LuCalendarDays,
  LuShoppingBag,
  LuCreditCard,
  LuClock,
  LuLogOut,
  LuChevronRight,
  LuChevronLeft,
  LuChevronDown,
  LuStore,
  LuChartColumn,
  LuUser,
  LuEllipsis,
  LuMenu,
  LuX,
  LuCamera,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuSearch,
  LuMapPin,
  LuUpload,
  LuMail,
  LuZoomIn,
  LuZoomOut,
  LuCopy,
} from 'react-icons/lu';

export interface IconProps {
  className?: string;
  color?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

function makeIcon(Icon: IconType) {
  function Wrapped({ className, color = 'currentColor', ...rest }: IconProps) {
    return <Icon className={className} color={color} aria-hidden {...rest} />;
  }
  Wrapped.displayName = (Icon as { displayName?: string; name?: string }).displayName
    ?? (Icon as { name?: string }).name
    ?? 'Icon';
  return Wrapped;
}

export const HomeIcon = makeIcon(LuHouse);
export const SessionsIcon = makeIcon(LuClipboardList);
/** Alias used by sidebar nav */
export const SessionIcon = SessionsIcon;
export const VolunteerIcon = makeIcon(LuUsers);
export const CourtHoursIcon = makeIcon(LuScale);
/** Alias used by sidebar nav */
export const CourtIcon = CourtHoursIcon;
export const FeedbackIcon = makeIcon(LuMessageSquare);
export const EventsIcon = makeIcon(LuCalendar);
/** Alias used by sidebar nav */
export const EventIcon = EventsIcon;
export const OrdersIcon = makeIcon(LuShoppingBag);
/** Alias used by sidebar nav */
export const OrderIcon = OrdersIcon;
export const PaymentsIcon = makeIcon(LuCreditCard);
/** Alias used by sidebar nav */
export const PaymentIcon = PaymentsIcon;
export const AuditLogIcon = makeIcon(LuClock);
/** Alias used by sidebar nav */
export const AuditIcon = AuditLogIcon;
export const SignOutIcon = makeIcon(LuLogOut);
export const ChevronRightIcon = makeIcon(LuChevronRight);
export const ChevronLeftIcon = makeIcon(LuChevronLeft);
export const ChevronDownIcon = makeIcon(LuChevronDown);
export const ShopIcon = makeIcon(LuStore);
export const InsightsIcon = makeIcon(LuChartColumn);
export const AccountIcon = makeIcon(LuUser);
export const CalendarIcon = makeIcon(LuCalendarDays);
export const MoreIcon = makeIcon(LuEllipsis);
export const MenuIcon = makeIcon(LuMenu);
export const CloseIcon = makeIcon(LuX);
export const CameraIcon = makeIcon(LuCamera);
export const PanelCollapseIcon = makeIcon(LuPanelLeftClose);
export const PanelExpandIcon = makeIcon(LuPanelLeftOpen);
export const SearchIcon = makeIcon(LuSearch);
export const MapPinIcon = makeIcon(LuMapPin);
export const UploadIcon = makeIcon(LuUpload);
export const MailIcon = makeIcon(LuMail);
export const ZoomInIcon = makeIcon(LuZoomIn);
export const ZoomOutIcon = makeIcon(LuZoomOut);
export const CopyIcon = makeIcon(LuCopy);
