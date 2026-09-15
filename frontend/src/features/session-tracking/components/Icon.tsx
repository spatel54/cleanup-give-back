import { BellIcon } from './icons/BellIcon';
import { BuildingIcon } from './icons/BuildingIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { CameraIcon } from './icons/CameraIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { CloseIcon } from './icons/CloseIcon';
import { FlameIcon } from './icons/FlameIcon';
import { HomeIcon } from './icons/HomeIcon';
import { LocationPinIcon } from './icons/LocationPinIcon';
import { PlusCircleFilledIcon, PlusCircleIcon } from './icons/PlusCircleIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import { RouteIcon } from './icons/RouteIcon';
import { SessionsIcon } from './icons/SessionsIcon';
import type { IconProps } from './icons/types';
import { WarningTriangleIcon } from './icons/WarningTriangleIcon';

/**
 * Semantic name → icon component lookup. Screens import from here rather
 * than `react-icons` (web-only, incompatible with React Native) or Lucide —
 * see components/icons/*.tsx for the hand-ported Heroicons-family glyphs.
 */
const registry = {
  home: HomeIcon,
  camera: CameraIcon,
  locationPin: LocationPinIcon,
  questionMarkCircle: QuestionMarkCircleIcon,
  checkCircle: CheckCircleIcon,
  warningTriangle: WarningTriangleIcon,
  chevronUp: ChevronUpIcon,
  chevronLeft: ChevronLeftIcon,
  chevronRight: ChevronRightIcon,
  close: CloseIcon,
  plusCircle: PlusCircleIcon,
  plusCircleFilled: PlusCircleFilledIcon,
  sessions: SessionsIcon,
  // `SessionsIcon`'s glyph is a clock face — reused verbatim for time-context
  // chips (session/event times) on the Home dashboard, distinct semantic use
  // of the same visual.
  clock: SessionsIcon,
  bell: BellIcon,
  calendar: CalendarIcon,
  building: BuildingIcon,
  flame: FlameIcon,
  route: RouteIcon,
} as const;

export type IconName = keyof typeof registry;

type Props = IconProps & { name: IconName };

export function Icon({ name, ...props }: Props) {
  const Glyph = registry[name];
  return <Glyph {...props} />;
}
