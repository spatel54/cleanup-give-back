import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';

import { incomingVolunteerNotificationFromPayload } from '@/features/notifications/incomingVolunteerNotification';
import { resolveVolunteerNotificationHref } from '@/features/notifications/notificationDestinations';
import { ingestIncomingVolunteerNotification } from '@/features/notifications/volunteerNotificationsStore';
import {
  configureCheckpointNotificationPresentation,
} from '@/features/session-tracking/checkpointNotifications';
import { getLiveSessionState } from '@/features/session-tracking/liveSessionStore';
import { alertPhotoCheckpointDue } from '@/utils/photoCheckpointAlert';

function notificationData(
  notification: Notifications.Notification,
): Record<string, unknown> {
  const data = notification.request.content.data;
  if (data && typeof data === 'object') {
    return data as Record<string, unknown>;
  }
  return {};
}

function isPhotoCheckpointNotification(
  notification: Notifications.Notification,
): boolean {
  return notificationData(notification).type === 'photo-checkpoint';
}

function readString(data: Record<string, unknown>, key: string): string | undefined {
  const value = data[key];
  return typeof value === 'string' && value ? value : undefined;
}

function ingestFromExpoNotification(notification: Notifications.Notification): void {
  if (isPhotoCheckpointNotification(notification)) {
    return;
  }
  const data = notificationData(notification);
  const incoming = incomingVolunteerNotificationFromPayload({
    notificationId: readString(data, 'notificationId'),
    type: readString(data, 'type'),
    title: notification.request.content.title,
    body:
      typeof notification.request.content.body === 'string'
        ? notification.request.content.body
        : undefined,
    sessionId: readString(data, 'sessionId'),
    orderId: readString(data, 'orderId'),
    createdAt: readString(data, 'createdAt') ?? notification.date,
  });
  if (!incoming) {
    return;
  }
  void ingestIncomingVolunteerNotification({
    notificationId: incoming.id.startsWith('incoming-') ? null : incoming.id,
    type: incoming.type,
    title: incoming.title,
    body: incoming.body,
    sessionId: incoming.sessionId,
    orderId: incoming.orderId,
    createdAt: incoming.createdAt,
  });
}

/** Wires local notification presentation and tap-through routing for checkpoints. */
export function CheckpointNotificationBootstrap() {
  const router = useRouter();

  useEffect(() => {
    configureCheckpointNotificationPresentation();

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        ingestFromExpoNotification(notification);

        if (!isPhotoCheckpointNotification(notification)) {
          return;
        }

        const { isActive, photosEnabled } = getLiveSessionState();
        if (!isActive || !photosEnabled) {
          return;
        }

        // Foreground OS banners often skip sound; play the in-app alert clip.
        void alertPhotoCheckpointDue();
      },
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const notification = response.notification;
        ingestFromExpoNotification(notification);
        if (isPhotoCheckpointNotification(notification)) {
          const { isActive, photosEnabled } = getLiveSessionState();
          if (!isActive || !photosEnabled) {
            return;
          }

          // Tapping a system notification means the app wasn't in the foreground
          // on the tracker — stack it underneath the modal so "Back to tracker"
          // lands there instead of wherever the app happened to resume.
          router.push('/live-session');
          router.push('/photo-checkpoint');
          return;
        }

        const data = notificationData(notification);
        const incoming = incomingVolunteerNotificationFromPayload({
          notificationId: readString(data, 'notificationId'),
          type: readString(data, 'type'),
          title: notification.request.content.title,
          body:
            typeof notification.request.content.body === 'string'
              ? notification.request.content.body
              : undefined,
          sessionId: readString(data, 'sessionId'),
          orderId: readString(data, 'orderId'),
          createdAt: readString(data, 'createdAt') ?? notification.date,
        });
        if (incoming) {
          if (incoming.type === 'hours_reminder') {
            return;
          }
          void resolveVolunteerNotificationHref(incoming).then((href) => {
            router.push(href as Href);
          });
        }
      },
    );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [router]);

  return null;
}
