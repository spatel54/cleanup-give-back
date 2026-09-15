import React from 'react';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

import { ORG } from './orgConstants.js';

export type ServiceLetterPhoto = {
  label: string;
  timeLabel: string;
  dataUri: string;
};

export type ServiceLetterSessionEvidence = {
  title: string;
  startLabel: string;
  endLabel: string;
  hoursLabel: string;
  milesLabel: string;
  mapImageDataUri: string | null;
  photos: ServiceLetterPhoto[];
  /** Set when `adjustedHours` differs from the raw logged duration — shown on the
   * session's evidence page so a court packet doesn't silently substitute hours. */
  adjustmentNote: string | null;
};

export type CourtCoverSheetProps = {
  caseReference: string | null;
  dueDateLabel: string | null;
  requiredHoursLabel: string;
  completedHoursLabel: string;
};

export type ServiceLetterPdfProps = {
  volunteerName: string;
  letterDate: string;
  rangeStart: string;
  rangeEnd: string;
  totalHoursLabel: string;
  logoDataUri: string;
  sessions: ServiceLetterSessionEvidence[];
  courtCoverSheet?: CourtCoverSheetProps;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 54,
    fontFamily: 'Times-Roman',
    fontSize: 12,
    lineHeight: 1.45,
    color: '#1a1a1a',
  },
  logo: {
    width: 56,
    height: 72,
    marginBottom: 12,
    objectFit: 'contain',
  },
  orgLine: {
    fontSize: 10,
    marginBottom: 4,
  },
  taxId: {
    fontSize: 10,
    marginBottom: 28,
  },
  bodyGap: {
    marginBottom: 14,
  },
  paragraph: {
    marginBottom: 12,
    textAlign: 'left',
  },
  signatureLine: {
    marginTop: 16,
    marginBottom: 4,
    fontSize: 12,
  },
  signBlock: {
    fontSize: 11,
    lineHeight: 1.35,
  },
  evidenceTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 14,
    marginBottom: 8,
  },
  evidenceMeta: {
    fontSize: 11,
    marginBottom: 6,
  },
  map: {
    width: '100%',
    height: 200,
    objectFit: 'contain',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e2e1',
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  photoCard: {
    width: '47%',
    marginBottom: 10,
  },
  photo: {
    width: '100%',
    height: 140,
    objectFit: 'cover',
    borderWidth: 1,
    borderColor: '#e5e2e1',
  },
  photoCaption: {
    fontSize: 9,
    marginTop: 4,
  },
  coverTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 18,
    marginBottom: 20,
  },
  coverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e2e1',
  },
  coverLabel: {
    fontSize: 11,
    color: '#6e7a6c',
  },
  coverValue: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
  },
  adjustmentNote: {
    fontSize: 10,
    color: '#835400',
    marginTop: 4,
    marginBottom: 6,
  },
});

function LetterPage({
  volunteerName,
  letterDate,
  rangeStart,
  rangeEnd,
  totalHoursLabel,
  logoDataUri,
}: Omit<ServiceLetterPdfProps, 'sessions'>) {
  return (
    <Page size="LETTER" style={styles.page}>
      <Image src={logoDataUri} style={styles.logo} />
      <Text style={styles.orgLine}>{ORG.addressLine}</Text>
      <Text style={styles.taxId}>{ORG.taxId}</Text>

      <Text style={styles.bodyGap}>Date {letterDate}</Text>
      <Text style={styles.bodyGap}>Dear {volunteerName},</Text>
      <Text style={styles.bodyGap}>
        Service hours earned from {rangeStart} to {rangeEnd} total {totalHoursLabel} community
        service hours.
      </Text>

      <Text style={styles.paragraph}>
        Thank you for supporting Clean Up – Give Back’s mission of environmental stewardship. Your
        assistance helps keep our communities and environment cleaner and healthier for the residents
        and animal life in the area. Your dedication to sustainability makes a meaningful difference.
      </Text>
      <Text style={styles.paragraph}>We are grateful you chose to help our non-profit.</Text>

      <Text style={styles.bodyGap}>Sincerely,</Text>
      <Text style={styles.signatureLine}>Authorized signature</Text>
      <View style={styles.signBlock}>
        <Text>{ORG.signatoryTitle}</Text>
        <Text>{ORG.signatoryOrg}</Text>
        <Text>{ORG.tagline}</Text>
        <Text>{ORG.email}</Text>
      </View>
    </Page>
  );
}

function CourtCoverSheet({
  volunteerName,
  rangeStart,
  rangeEnd,
  coverSheet,
}: {
  volunteerName: string;
  rangeStart: string;
  rangeEnd: string;
  coverSheet: CourtCoverSheetProps;
}) {
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.coverTitle}>Court Service Packet</Text>
      <View style={styles.coverRow}>
        <Text style={styles.coverLabel}>Volunteer</Text>
        <Text style={styles.coverValue}>{volunteerName}</Text>
      </View>
      <View style={styles.coverRow}>
        <Text style={styles.coverLabel}>Case reference</Text>
        <Text style={styles.coverValue}>{coverSheet.caseReference ?? '—'}</Text>
      </View>
      <View style={styles.coverRow}>
        <Text style={styles.coverLabel}>Due date</Text>
        <Text style={styles.coverValue}>{coverSheet.dueDateLabel ?? '—'}</Text>
      </View>
      <View style={styles.coverRow}>
        <Text style={styles.coverLabel}>Session date range</Text>
        <Text style={styles.coverValue}>
          {rangeStart} – {rangeEnd}
        </Text>
      </View>
      <View style={styles.coverRow}>
        <Text style={styles.coverLabel}>Required hours</Text>
        <Text style={styles.coverValue}>{coverSheet.requiredHoursLabel}</Text>
      </View>
      <View style={styles.coverRow}>
        <Text style={styles.coverLabel}>Completed hours since last letter (approved only)</Text>
        <Text style={styles.coverValue}>{coverSheet.completedHoursLabel}</Text>
      </View>
      <Text style={styles.evidenceMeta}>
        {'\n'}Only approved sessions count toward the completed-hours total above. Completed
        hours reset to zero each time a service letter is generated. The pages that follow
        document each approved session included in this packet.
      </Text>
    </Page>
  );
}

function EvidencePage({ session }: { session: ServiceLetterSessionEvidence }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.evidenceTitle}>{session.title}</Text>
      <Text style={styles.evidenceMeta}>Start: {session.startLabel}</Text>
      <Text style={styles.evidenceMeta}>End: {session.endLabel}</Text>
      <Text style={styles.evidenceMeta}>
        Duration: {session.hoursLabel} hours · Distance: {session.milesLabel} miles
      </Text>
      {session.adjustmentNote && <Text style={styles.adjustmentNote}>{session.adjustmentNote}</Text>}

      {session.mapImageDataUri ? (
        <Image src={session.mapImageDataUri} style={styles.map} />
      ) : (
        <Text style={styles.evidenceMeta}>Route map unavailable for this session.</Text>
      )}

      {session.photos.length > 0 ? (
        <View style={styles.photoRow}>
          {session.photos.map((photo, index) => (
            <View key={`${photo.label}-${index}`} style={styles.photoCard}>
              <Image src={photo.dataUri} style={styles.photo} />
              <Text style={styles.photoCaption}>
                {photo.label}
                {photo.timeLabel ? ` · ${photo.timeLabel}` : ''}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.evidenceMeta}>No checkpoint photos recorded.</Text>
      )}
    </Page>
  );
}

export function ServiceLetterDocument(props: ServiceLetterPdfProps) {
  return (
    <Document>
      {props.courtCoverSheet && (
        <CourtCoverSheet
          volunteerName={props.volunteerName}
          rangeStart={props.rangeStart}
          rangeEnd={props.rangeEnd}
          coverSheet={props.courtCoverSheet}
        />
      )}
      <LetterPage {...props} />
      {props.sessions.map((session, index) => (
        <EvidencePage session={session} key={`evidence-${index}`} />
      ))}
    </Document>
  );
}
