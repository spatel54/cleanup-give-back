import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, ClipPath, Defs, G, Line, Rect } from 'react-native-svg';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { SessionSetupBackChevronIcon } from '@/components/session-setup/icons/SessionSetupBackChevronIcon';

import { APP_BAR_CART_ICON_SIZE, appBarIconWrap } from '../components/appBarChrome';
import { CartBadge } from '../components/CartBadge';
import { EmptyCartToast, useCartIconPress } from '../components/EmptyCartToast';
import { ProductImagesModal } from '../components/ProductImagesModal';
import { ShopCartIcon, ShopFeaturedCartIcon, ShopStreakIcon } from '../components/ShopIcons';
import { addCartItem } from '../cartStore';
import {
  getProductDetail,
  PRODUCT_DETAIL_ASSETS,
  type ProductDetail,
  type ToteColor,
} from '../mocks/productDetail';
import { layout, colors, fontFamilies, radius, shadows, textStyles } from '../tokens';

const CAROUSEL_HEIGHT = 343;
const DOT_COUNT = 4;
const SWATCH_FILL = 18;
const SPLIT_SVG = 30;
const SPLIT_ANGLE = 22;

function SplitColorFill({ hex, hexSecondary }: { hex: string; hexSecondary: string }) {
  const r = SWATCH_FILL / 2;
  return (
    <View style={[s.swatchFill, s.swatchFillClip]}>
      <Svg
        width={SWATCH_FILL}
        height={SWATCH_FILL}
        pointerEvents="none"
      >
        <Defs>
          <ClipPath id="toteSplitClip">
            <Circle cx={r} cy={r} r={r} />
          </ClipPath>
        </Defs>
        <G clipPath="url(#toteSplitClip)">
          <G transform={`rotate(${SPLIT_ANGLE} ${r} ${r})`}>
            <Rect x={-24} y={-24} width={24 + r} height={78} fill={hex} />
            <Rect x={r} y={-24} width={48} height={78} fill={hexSecondary} />
          </G>
        </G>
      </Svg>
    </View>
  );
}

function SplitDivider() {
  const c = SPLIT_SVG / 2;
  return (
    <View pointerEvents="none" style={s.swatchSplitLineWrap}>
      <Svg width={SPLIT_SVG} height={SPLIT_SVG}>
        <Line
          x1={c}
          y1={1}
          x2={c}
          y2={SPLIT_SVG - 1}
          stroke={colors.textPrimary}
          strokeWidth={1.5}
          strokeLinecap="butt"
          transform={`rotate(${SPLIT_ANGLE} ${c} ${c})`}
        />
      </Svg>
    </View>
  );
}

function ProductTopBar({
  cartCount,
  onBack,
  onCartPress,
}: {
  cartCount: number;
  onBack: () => void;
  onCartPress: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.topBar, shadows.barTop, { paddingTop: insets.top, paddingBottom: layout.topBarPaddingBottom }]}>
      <View style={s.topBarRow}>
        <AnimatedPressable
          style={s.topBarIconBtnLeft}
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <SessionSetupBackChevronIcon color={colors.textPrimary} />
        </AnimatedPressable>

        <View style={s.topBarTitleOverlay} pointerEvents="none">
          <Text style={s.topBarTitle}>Shop</Text>
        </View>

        <AnimatedPressable
          style={s.topBarIconBtnRight}
          onPress={onCartPress}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={`Shopping cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
        >
          <View style={appBarIconWrap}>
            <ShopCartIcon width={APP_BAR_CART_ICON_SIZE} height={APP_BAR_CART_ICON_SIZE} />
            <CartBadge count={cartCount} variant="cart" />
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}

function CarouselDots({ activeIndex, count }: { activeIndex: number; count: number }) {
  return (
    <View style={s.dotsPill} accessibilityElementsHidden>
      <View style={s.dotsRow}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={[s.dot, i === activeIndex ? s.dotActive : s.dotInactive]} />
        ))}
      </View>
    </View>
  );
}

function QuantityStepper({
  quantity,
  onDecrement,
  onIncrement,
}: {
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View style={s.qtyBar}>
      <AnimatedPressable
        scaleTo={0.95}
        style={s.qtyBtn}
        onPress={onDecrement}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        accessibilityState={{ disabled: quantity <= 1 }}
      >
        <View style={s.qtyMinus} />
      </AnimatedPressable>
      <Text style={s.qtyValue} accessibilityLabel={`Quantity: ${quantity}`}>
        {quantity}
      </Text>
      <AnimatedPressable
        scaleTo={0.95}
        style={s.qtyBtn}
        onPress={onIncrement}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
      >
        <View style={s.qtyPlusWrap}>
          <View style={s.qtyPlusH} />
          <View style={s.qtyPlusV} />
        </View>
      </AnimatedPressable>
    </View>
  );
}

function ColorSwatches({
  colors: swatches,
  selected,
  onSelect,
}: {
  colors: NonNullable<ProductDetail['colors']>;
  selected: ToteColor | null;
  onSelect: (id: ToteColor) => void;
}) {
  return (
    <View style={s.colorRow}>
      <View style={s.swatchRow}>
        {swatches.map((swatch) => {
          const active = swatch.id === selected;
          const selectedBorder = swatch.hexSecondary ? colors.textPrimary : swatch.hex;
          const body = (
            <AnimatedPressable
              scaleTo={0.92}
              style={[s.swatchOuter, active && { borderColor: selectedBorder }]}
              onPress={() => onSelect(swatch.id)}
              accessibilityRole="button"
              accessibilityLabel={`${swatch.label} color`}
              accessibilityState={{ selected: active }}
            >
              {swatch.hexSecondary ? (
                <SplitColorFill hex={swatch.hex} hexSecondary={swatch.hexSecondary} />
              ) : (
                <View style={[s.swatchFill, { backgroundColor: swatch.hex }]} />
              )}
            </AnimatedPressable>
          );

          if (!swatch.hexSecondary) {
            return (
              <View key={swatch.id}>
                {body}
              </View>
            );
          }

          return (
            <View key={swatch.id} style={s.swatchSplitWrap}>
              {body}
              <SplitDivider />
            </View>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Product detail screen — Figma `shop_product_view` (+ per-SKU frames).
 * Parameterized via `?id=` (cleanup-kit | trash-grabber | tote-bags | adult-safety-vest | child-safety-vest).
 */
export function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ id?: string }>();
  const product = getProductDetail(typeof params.id === 'string' ? params.id : undefined);
  const { cartCount, onCartPress, toastVisible, toastKey, dismissToast } = useCartIconPress();

  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [toteColor, setToteColor] = useState<ToteColor | null>(() =>
    product.colors?.some((swatch) => swatch.id === 'both') ? 'both' : null,
  );
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryStart, setGalleryStart] = useState(0);
  const carouselRef = useRef<ScrollView>(null);

  const contentWidth = Math.min(windowWidth - 32, 358);
  const carouselWidth = contentWidth;
  // Adult flatlay is portrait; tote flatlay is landscape — size the card to the lead asset aspect so contain fills without letterboxing or cropping.
  const carouselHeight =
    product.id === 'adult-safety-vest'
      ? Math.round(carouselWidth * (1024 / 768))
      : product.id === 'tote-bags'
        ? Math.round(carouselWidth * (722 / 994))
        : CAROUSEL_HEIGHT;

  const images = useMemo(() => {
    if (toteColor != null) {
      const byColor = product.imagesByColor?.[toteColor];
      if (byColor && byColor.length > 0) {
        return byColor;
      }
    }
    return product.images.length > 0 ? product.images : [PRODUCT_DETAIL_ASSETS.kitHero];
  }, [product.images, product.imagesByColor, toteColor]);

  const showThumbnails = (product.thumbnails?.length ?? 0) > 0;
  const dotCount = Math.max(images.length, showThumbnails ? DOT_COUNT : images.length);

  const onCarouselScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const next = Math.round(x / carouselWidth);
      if (next !== imageIndex && next >= 0 && next < images.length) {
        setImageIndex(next);
      }
    },
    [carouselWidth, imageIndex, images.length],
  );

  const selectThumbnail = useCallback(
    (index: number) => {
      setImageIndex(index);
      carouselRef.current?.scrollTo({ x: index * carouselWidth, animated: true });
    },
    [carouselWidth],
  );

  const onSelectToteColor = useCallback((id: ToteColor) => {
    setToteColor(id);
    setImageIndex(0);
  }, []);

  const openGallery = useCallback((index: number) => {
    setImageIndex(index);
    setGalleryStart(index);
    setGalleryOpen(true);
  }, []);

  const closeGallery = useCallback(() => {
    setGalleryOpen(false);
    carouselRef.current?.scrollTo({ x: imageIndex * carouselWidth, animated: false });
  }, [carouselWidth, imageIndex]);

  const handleAddToCart = () => {
    const unitPrice = Number.parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0;
    addCartItem(
      {
        id: product.id,
        name: product.name,
        unitPrice,
        image: images[0],
        description: product.description,
      },
      quantity,
    );
  };

  return (
    <View style={s.root}>
      <ProductTopBar
        cartCount={cartCount}
        onBack={() => router.back()}
        onCartPress={onCartPress}
      />
      <EmptyCartToast key={toastKey} visible={toastVisible} onDismiss={dismissToast} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.contentCol, { width: contentWidth }]}>
          {/* Header */}
          <View style={s.headerBlock}>
            {product.bestSeller ? (
              <View style={s.bestSellerBadge}>
                <ShopStreakIcon width={16} height={16} />
                <Text style={s.bestSellerText}>Best Seller</Text>
              </View>
            ) : null}
            <Text style={s.productName} accessibilityRole="header">
              {product.name}
            </Text>
            <Text style={s.stockText}>{product.inStock ? 'In stock' : 'Out of stock'}</Text>
            <Text style={s.priceText}>{product.price}</Text>
            {product.colors ? (
              <ColorSwatches
                colors={product.colors}
                selected={toteColor}
                onSelect={onSelectToteColor}
              />
            ) : null}
          </View>

          {/* Image carousel */}
          <View style={[s.carouselWrap, { width: carouselWidth }]}>
            <ScrollView
              key={product.imagesByColor ? `tote-${toteColor ?? 'all'}` : product.id}
              ref={carouselRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onCarouselScroll}
              style={{ width: carouselWidth, height: carouselHeight }}
              accessibilityLabel={`${product.name} images`}
            >
              {images.map((src, i) => {
                const fillsCard =
                  src === PRODUCT_DETAIL_ASSETS.toteBagsPhoto ||
                  src === PRODUCT_DETAIL_ASSETS.kitHeroFlatlay ||
                  src === PRODUCT_DETAIL_ASSETS.kitHero ||
                  src === PRODUCT_DETAIL_ASSETS.childVestFlatlay;
                return (
                  <Pressable
                    key={i}
                    onPress={() => openGallery(i)}
                    accessibilityRole="imagebutton"
                    accessibilityLabel={`View ${product.name} image ${i + 1} fullscreen`}
                    style={[s.carouselSlide, { width: carouselWidth, height: carouselHeight }]}
                  >
                    <ExpoImage
                      source={src}
                      style={s.carouselImage}
                      contentFit={fillsCard ? 'cover' : 'contain'}
                      cachePolicy="memory-disk"
                      priority={i === 0 ? 'high' : 'normal'}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
            {images.length > 1 && <CarouselDots activeIndex={imageIndex} count={dotCount} />}
          </View>

          {/* Thumbnails (kit only) */}
          {showThumbnails && product.thumbnails ? (
            <View style={s.thumbRow}>
              {product.thumbnails.map((src, i) => {
                const active = i === imageIndex;
                return (
                  <AnimatedPressable
                    key={i}
                    scaleTo={0.96}
                    style={[s.thumb, active ? s.thumbActive : s.thumbInactive]}
                    onPress={() => selectThumbnail(i)}
                    accessibilityRole="button"
                    accessibilityLabel={`Product image ${i + 1}`}
                    accessibilityState={{ selected: active }}
                  >
                    <ExpoImage source={src} style={s.thumbImage} contentFit="contain" cachePolicy="memory-disk" />
                  </AnimatedPressable>
                );
              })}
            </View>
          ) : null}

          <Text style={s.description}>{product.description}</Text>

          {/* Includes list (kit only) */}
          {product.includes ? (
            <View style={s.includesBlock}>
              {product.includes.map((item) => (
                <View key={item.label} style={s.includeRow}>
                  <View style={s.includeThumb}>
                    <ExpoImage source={item.image} style={s.includeThumbImg} contentFit="contain" cachePolicy="memory-disk" />
                  </View>
                  <Text style={s.includeLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Quantity + Add to cart */}
          <View style={s.cartBlock}>
            <QuantityStepper
              quantity={quantity}
              onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
              onIncrement={() => setQuantity((q) => q + 1)}
            />
            <AnimatedPressable
              scaleTo={0.97}
              style={s.addToCartBtn}
              onPress={handleAddToCart}
              accessibilityRole="button"
              accessibilityLabel={`Add ${quantity} ${product.name} to cart`}
            >
              <Text style={s.addToCartText}>Add to cart</Text>
            </AnimatedPressable>
          </View>
        </View>
      </ScrollView>

      <ProductImagesModal
        visible={galleryOpen}
        images={images}
        initialIndex={galleryStart}
        onIndexChange={setImageIndex}
        onClose={closeGallery}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  topBar: {
    backgroundColor: colors.white,
    zIndex: 2,
  },
  topBarRow: {
    height: layout.topBarTitleRow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topBarIconBtnLeft: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  topBarIconBtnRight: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  topBarTitleOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    ...textStyles.headlineTopBar,
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  contentCol: {
    gap: 20,
  },
  headerBlock: {
    gap: 10,
    alignSelf: 'stretch',
    maxWidth: 264,
  },
  bestSellerBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentLime,
    borderRadius: 23,
    minHeight: 24,
    paddingHorizontal: 12,
    paddingVertical: 4,
    overflow: 'visible',
  },
  bestSellerText: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 12,
    lineHeight: 14,
    color: colors.textNavInactive,
  },
  productName: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 28,
    lineHeight: 34,
    color: colors.textPrimary,
  },
  stockText: {
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 14,
    color: colors.statusApprovedText,
  },
  priceText: {
    ...textStyles.dataStat,
    color: colors.primary,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    overflow: 'visible',
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'visible',
  },
  swatchSplitWrap: {
    width: 24,
    height: 24,
    overflow: 'visible',
    zIndex: 1,
  },
  swatchOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    padding: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchFill: {
    width: SWATCH_FILL,
    height: SWATCH_FILL,
    borderRadius: SWATCH_FILL / 2,
  },
  swatchFillClip: {
    overflow: 'hidden',
  },
  swatchSplitLineWrap: {
    position: 'absolute',
    left: (24 - SPLIT_SVG) / 2,
    top: (24 - SPLIT_SVG) / 2,
    width: SPLIT_SVG,
    height: SPLIT_SVG,
  },
  carouselWrap: {
    alignItems: 'center',
    gap: 12,
  },
  carouselSlide: {
    height: CAROUSEL_HEIGHT,
    backgroundColor: colors.chipBg,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  dotsPill: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: colors.copyright,
  },
  dotInactive: {
    backgroundColor: colors.white,
  },
  thumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 21,
    alignSelf: 'stretch',
  },
  thumb: {
    width: 74,
    height: 74,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  thumbInactive: {
    borderWidth: 1,
    borderColor: colors.borderOutline,
  },
  thumbImage: {
    width: '90%',
    height: '90%',
  },
  description: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
    alignSelf: 'stretch',
  },
  includesBlock: {
    alignSelf: 'stretch',
    gap: 20,
    paddingBottom: 12,
  },
  includeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  includeThumb: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 0.5,
    borderColor: colors.borderOutline,
    overflow: 'hidden',
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  includeThumbImg: {
    width: 28,
    height: 28,
  },
  includeLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  cartBlock: {
    alignSelf: 'stretch',
    gap: 20,
    paddingTop: 8,
  },
  qtyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 50,
    backgroundColor: colors.chipBg,
    padding: 4,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyMinus: {
    width: 10.5,
    height: 1.5,
    backgroundColor: colors.textPrimary,
    borderRadius: 1,
  },
  qtyPlusWrap: {
    width: 10.5,
    height: 10.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyPlusH: {
    position: 'absolute',
    width: 10.5,
    height: 1.5,
    backgroundColor: colors.textPrimary,
    borderRadius: 1,
  },
  qtyPlusV: {
    position: 'absolute',
    width: 1.5,
    height: 10.5,
    backgroundColor: colors.textPrimary,
    borderRadius: 1,
  },
  qtyValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
    minWidth: 16,
    textAlign: 'center',
  },
  addToCartBtn: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addToCartText: {
    ...textStyles.labelButton,
    color: colors.white,
  },
});
