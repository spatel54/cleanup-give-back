import { Image, type ImageSource } from 'expo-image';
import { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { EmptyState } from '@/components/ui/EmptyState';
import { PhotoEnlargeModal } from '@/components/ui/PhotoEnlargeModal';
import { colors, fontFamilies } from '@/features/figma-screens/tokens';

import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { formatPhotoTimeLabel, formatSessionDateLabel } from '../utils/sessionFormat';

const PHOTO_SIZE = 171;
const PHOTO_GAP = 16;

export type SessionPhotosSectionItem = {
  key: string;
  /** Prefer when available (same source as a thumbnail). */
  source?: ImageSource | { uri: string };
  /** Used when `source` is omitted. */
  uri?: string;
  timeLabel: string;
  label: string;
  /** Epoch ms — drives enlarge modal date/time. */
  capturedAt?: number;
};

type Props = {
  photos: SessionPhotosSectionItem[];
  /** Optional wrapper style (e.g. submission confirmation section block). */
  style?: StyleProp<ViewStyle>;
  /** Override heading style when the parent screen uses a different type scale. */
  headingStyle?: StyleProp<TextStyle>;
};

function resolveSource(
  photo: SessionPhotosSectionItem,
): ImageSource | { uri: string } | null {
  if (photo.source) {
    return photo.source;
  }
  if (photo.uri) {
    return { uri: photo.uri };
  }
  return null;
}

/**
 * Horizontal checkpoint photo carousel + full-screen enlarge — shared by
 * post-session Submission Confirmation and Sessions-tab Session Detail.
 */
export function SessionPhotosSection({ photos, style, headingStyle }: Props) {
  const photoScrollRef = useRef<ScrollView>(null);
  const [photoScrollX, setPhotoScrollX] = useState(0);
  const [photoViewportWidth, setPhotoViewportWidth] = useState(0);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const photoStride = PHOTO_SIZE + PHOTO_GAP;
  const maxPhotoScrollX = Math.max(0, photos.length * photoStride - photoViewportWidth);
  const canScrollPhotosLeft = photoScrollX > 4;
  const canScrollPhotosRight = photoScrollX < maxPhotoScrollX - 4;

  const scrollPhotos = (direction: 'left' | 'right') => {
    const nextX =
      direction === 'left'
        ? Math.max(0, photoScrollX - photoStride)
        : Math.min(maxPhotoScrollX, photoScrollX + photoStride);
    photoScrollRef.current?.scrollTo({ x: nextX, animated: true });
    setPhotoScrollX(nextX);
  };

  const onPhotoScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPhotoScrollX(event.nativeEvent.contentOffset.x);
  };

  const selectedPhoto =
    selectedPhotoIndex !== null ? photos[selectedPhotoIndex] ?? null : null;
  const selectedSource = selectedPhoto ? resolveSource(selectedPhoto) : null;

  return (
    <View style={style}>
      <Text style={[s.sectionHeading, headingStyle]} accessibilityRole="header">
        Photos
      </Text>

      {photos.length > 0 ? (
        <View
          style={s.photosSection}
          onLayout={(event) => setPhotoViewportWidth(event.nativeEvent.layout.width)}
        >
          <ScrollView
            ref={photoScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.photosRow}
            onScroll={onPhotoScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={photoStride}
          >
            {photos.map((photo, index) => {
              const source = resolveSource(photo);
              if (!source) {
                return null;
              }

              return (
                <AnimatedPressable
                  key={photo.key}
                  style={s.photoCard}
                  onPress={() => setSelectedPhotoIndex(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`View enlarged ${photo.label.toLowerCase()} photo at ${photo.timeLabel}`}
                >
                  <Image
                    source={source}
                    style={s.photoImage}
                    contentFit="cover"
                    accessibilityIgnoresInvertColors
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  />
                  {photo.timeLabel ? (
                    <View style={s.photoTimePill}>
                      <Text style={s.photoTimeText}>{photo.timeLabel}</Text>
                    </View>
                  ) : null}
                </AnimatedPressable>
              );
            })}
          </ScrollView>

          <View style={s.photoNavRow} pointerEvents="box-none">
            <AnimatedPressable
              style={[s.photoNavBtn, !canScrollPhotosLeft && s.photoNavBtnHidden]}
              onPress={() => scrollPhotos('left')}
              disabled={!canScrollPhotosLeft}
              accessibilityRole="button"
              accessibilityLabel="Scroll photos left"
            >
              <ChevronLeftIcon color={colors.textTertiary} size={24} />
            </AnimatedPressable>
            <AnimatedPressable
              style={[s.photoNavBtn, s.photoNavBtnRight, !canScrollPhotosRight && s.photoNavBtnHidden]}
              onPress={() => scrollPhotos('right')}
              disabled={!canScrollPhotosRight}
              accessibilityRole="button"
              accessibilityLabel="Scroll photos right"
            >
              <ChevronRightIcon color={colors.textTertiary} size={24} />
            </AnimatedPressable>
          </View>
        </View>
      ) : (
        <EmptyState
          title="No checkpoint photos"
          body="No checkpoint photos were submitted for this session."
        />
      )}

      <PhotoEnlargeModal
        visible={selectedPhotoIndex !== null && selectedSource !== null}
        source={selectedSource}
        caption={selectedPhoto?.label}
        dateLabel={
          selectedPhoto?.capturedAt
            ? formatSessionDateLabel(selectedPhoto.capturedAt)
            : undefined
        }
        timeLabel={
          selectedPhoto?.timeLabel ||
          (selectedPhoto?.capturedAt
            ? formatPhotoTimeLabel(selectedPhoto.capturedAt)
            : undefined)
        }
        counterLabel={
          selectedPhotoIndex !== null && photos.length > 0
            ? `${selectedPhotoIndex + 1}/${photos.length}`
            : undefined
        }
        onClose={() => setSelectedPhotoIndex(null)}
        hasPrevious={selectedPhotoIndex !== null && selectedPhotoIndex > 0}
        hasNext={
          selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1
        }
        onPrevious={() =>
          setSelectedPhotoIndex((index) =>
            index !== null && index > 0 ? index - 1 : index,
          )
        }
        onNext={() =>
          setSelectedPhotoIndex((index) =>
            index !== null && index < photos.length - 1 ? index + 1 : index,
          )
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  sectionHeading: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  photosSection: {
    gap: 12,
  },
  photosRow: {
    gap: PHOTO_GAP,
    paddingRight: 16,
  },
  photoCard: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoTimePill: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: colors.borderOutline,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  photoTimeText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 10,
    color: colors.textTertiary,
  },
  photoNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  photoNavBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoNavBtnRight: {
    marginLeft: 'auto',
  },
  photoNavBtnHidden: {
    opacity: 0.35,
  },
});
