import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export const PROFILE_PHOTO_OUTPUT_SIZE = 512;

export type ProfilePhotoCropTransform = {
  imageWidth: number;
  imageHeight: number;
  cropSize: number;
  displayBaseWidth: number;
  displayBaseHeight: number;
  scale: number;
  translateX: number;
  translateY: number;
};

export type ProfilePhotoCropPreset = 'fill' | 'crop';

export function getDisplayBaseSize(
  imageWidth: number,
  imageHeight: number,
  cropSize: number,
): { displayBaseWidth: number; displayBaseHeight: number } {
  return {
    displayBaseWidth: cropSize,
    displayBaseHeight: cropSize * (imageHeight / imageWidth),
  };
}

export function getPresetScale(
  preset: ProfilePhotoCropPreset,
  cropSize: number,
  displayBaseWidth: number,
  displayBaseHeight: number,
): number {
  const fitScale = Math.min(cropSize / displayBaseWidth, cropSize / displayBaseHeight);
  const fillScale = Math.max(cropSize / displayBaseWidth, cropSize / displayBaseHeight);

  if (preset === 'fill') {
    return fillScale;
  }
  return fillScale * 1.08;
}

export function getScaleLimits(
  cropSize: number,
  displayBaseWidth: number,
  displayBaseHeight: number,
): { minScale: number; maxScale: number } {
  const fitScale = Math.min(cropSize / displayBaseWidth, cropSize / displayBaseHeight);
  const fillScale = Math.max(cropSize / displayBaseWidth, cropSize / displayBaseHeight);

  return {
    minScale: fitScale * 0.65,
    maxScale: Math.max(fillScale * 4, fitScale * 4),
  };
}

export function getCenteredTranslation(
  cropSize: number,
  displayBaseWidth: number,
  displayBaseHeight: number,
  scale: number,
): { translateX: number; translateY: number } {
  return {
    translateX: (cropSize - displayBaseWidth * scale) / 2,
    translateY: (cropSize - displayBaseHeight * scale) / 2,
  };
}

export function clampProfilePhotoTranslation(
  translateX: number,
  translateY: number,
  scale: number,
  cropSize: number,
  displayBaseWidth: number,
  displayBaseHeight: number,
): { translateX: number; translateY: number } {
  const scaledWidth = displayBaseWidth * scale;
  const scaledHeight = displayBaseHeight * scale;

  let nextX = translateX;
  let nextY = translateY;

  if (scaledWidth >= cropSize) {
    nextX = Math.min(0, Math.max(cropSize - scaledWidth, nextX));
  } else {
    nextX = (cropSize - scaledWidth) / 2;
  }

  if (scaledHeight >= cropSize) {
    nextY = Math.min(0, Math.max(cropSize - scaledHeight, nextY));
  } else {
    nextY = (cropSize - scaledHeight) / 2;
  }

  return { translateX: nextX, translateY: nextY };
}

export function computeProfilePhotoCropRect(transform: ProfilePhotoCropTransform): {
  originX: number;
  originY: number;
  width: number;
  height: number;
} {
  const {
    imageWidth,
    imageHeight,
    cropSize,
    displayBaseWidth,
    displayBaseHeight,
    scale,
    translateX,
    translateY,
  } = transform;

  const pixelsPerPoint = (displayBaseWidth * scale) / imageWidth;
  const cropPixels = cropSize / pixelsPerPoint;

  const rawOriginX = -translateX / pixelsPerPoint;
  const rawOriginY = -translateY / pixelsPerPoint;

  const originX = Math.max(0, Math.min(imageWidth - cropPixels, rawOriginX));
  const originY = Math.max(0, Math.min(imageHeight - cropPixels, rawOriginY));
  const side = Math.min(cropPixels, imageWidth - originX, imageHeight - originY);

  return {
    originX: Math.round(originX),
    originY: Math.round(originY),
    width: Math.round(side),
    height: Math.round(side),
  };
}

/** Renders the current crop viewport to a square JPEG for profile upload. */
export async function exportCroppedProfilePhoto(
  uri: string,
  transform: ProfilePhotoCropTransform,
): Promise<string> {
  const crop = computeProfilePhotoCropRect(transform);

  const result = await manipulateAsync(
    uri,
    [
      {
        crop: {
          originX: crop.originX,
          originY: crop.originY,
          width: crop.width,
          height: crop.height,
        },
      },
      {
        resize: {
          width: PROFILE_PHOTO_OUTPUT_SIZE,
          height: PROFILE_PHOTO_OUTPUT_SIZE,
        },
      },
    ],
    { compress: 0.85, format: SaveFormat.JPEG },
  );

  return result.uri;
}
