import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { getUserDonations } from '@/lib/donations';

import { DonateCardIcon } from '../components/AccountIcons';
import { EmailReceiptChip } from '../components/EmailReceiptChip';
import {
  mapDonationToHistoryItem,
  type DonationHistoryItem,
} from '../mocks/donationHistory';
import { colors, fontFamilies, radius, textStyles } from '../tokens';


function DonationCard({ donation }: { donation: DonationHistoryItem }) {
  const timestampLabel = donation.timeLabel
    ? `${donation.dateLabel} · ${donation.timeLabel}`
    : donation.dateLabel;

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text
          style={s.timestamp}
          accessibilityLabel={`Donated ${timestampLabel}`}
        >
          {timestampLabel}
        </Text>
        <View style={s.statusTag}>
          <Text style={s.statusLabel}>{donation.statusLabel}</Text>
        </View>
      </View>

      <View style={s.divider} />

      <View style={s.amountRow}>
        <View style={s.donationLabelRow}>
          <Text style={s.donationLabel}>Donation</Text>
          <DonateCardIcon width={24} height={24} />
        </View>
        <Text style={s.amount}>{donation.amountLabel}</Text>
      </View>

      <Text style={s.paymentLabel}>{donation.paymentMethodLabel}</Text>

      {donation.showEmailChip ? (
        <EmailReceiptChip label="Confirmation sent to email" />
      ) : null}
    </View>
  );
}

/**
 * Donation History (Figma `donation_history`, node `854:205` / PRD §6.29).
 */
export function DonationHistoryScreen({
  donations: donationsProp,
}: {
  donations?: DonationHistoryItem[];
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [liveDonations, setLiveDonations] = useState<DonationHistoryItem[] | null>(
    donationsProp ?? null,
  );

  useEffect(() => {
    if (donationsProp) {
      setLiveDonations(donationsProp);
      return;
    }
    let cancelled = false;
    void getUserDonations()
      .then((result) => {
        if (cancelled) return;
        if (!result.success || result.donations.length === 0) {
          setLiveDonations([]);
          return;
        }
        setLiveDonations(result.donations.map(mapDonationToHistoryItem));
      })
      .catch(() => {
        if (cancelled) return;
        setLiveDonations([]);
      });
    return () => {
      cancelled = true;
    };
  }, [donationsProp]);

  const donations = liveDonations ?? [];
  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + 32;

  return (
    <View style={s.root}>
      <SessionSetupTopAppBar title="Donation History" onBack={() => router.back()} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {liveDonations === null ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={colors.primary} />
            <Text style={s.loadingLabel}>Loading donation history…</Text>
          </View>
        ) : (
          <>
            <Text style={s.intro}>Review your past contributions to Clean Up Give Back.</Text>

            {donations.length === 0 ? (
              <EmptyState
                title="No donations yet"
                body="Contribute from the shop to support cleanup efforts."
                ctaLabel="Contribute"
                ctaAccessibilityLabel="Go to donate"
                onCtaPress={() => router.push('/donate' as Href)}
              />
            ) : (
              <View style={s.list}>
                {donations.map((donation) => (
                  <DonationCard key={donation.id} donation={donation} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 24,
  },
  intro: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textNavInactive,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textNavInactive,
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    padding: 24,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  timestamp: {
    flex: 1,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textTertiary,
  },
  statusTag: {
    height: 28,
    backgroundColor: colors.statusApprovedBg,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
      ...textStyles.labelStatus,
      color: colors.statusApprovedText,
    },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderOutline,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  donationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  donationLabel: {
    ...textStyles.headlineTopBar,
    color: colors.textPrimary,
  },
  amount: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 28,
    color: colors.primary,
  },
  paymentLabel: {
    ...textStyles.bodySmall,
    color: colors.textTertiary,
  },
});
