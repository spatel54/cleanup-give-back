/**
 * Figma `1311:432` Hours-reminder (Nudge) email HTML.
 *
 * Table + inline CSS only. All copy is live HTML with system font stacks
 * (Georgia ≈ Sanchez, Trebuchet MS ≈ Noto Sans). Hosted `@font-face` for
 * clients that load webfonts (Apple Mail). Logo + bell GIF are the only
 * raster assets. Placeholder-first: name and hours use Figma sample copy
 * until a real volunteer value is present. Do not invent missing data.
 */

export type HoursReminderEmailInput = {
  volunteerName?: string | null;
  currentHours?: number | null;
  /** Override hosted asset origin (preview uses a file:// path). */
  assetBase?: string | null;
};

export const HOURS_REMINDER_PLACEHOLDERS = {
  firstName: 'Volunteer',
  currentHours: 'XXX',
} as const;

export const HOURS_REMINDER_SUBJECT = 'Missing you at Clean Up Give Back!';

export const HOURS_REMINDER_CTA_LABEL = 'Open App';

/** Swap when an App Store URL exists. */
export const HOURS_REMINDER_OPEN_APP_URL = 'https://cleanupgiveback.org/';

/** Hosted on the production admin deploy - Resend needs a public image URL. */
export const HOURS_REMINDER_ASSET_BASE = 'https://admin.example.com/email';

export const HOURS_REMINDER_BELL_SIZE = 120;

/** White hours on deep green for contrast on the forest-green header. */
export const HOURS_REMINDER_HOURS_FG = '#ffffff';
export const HOURS_REMINDER_HOURS_BG = '#004d21';

/** Primary green CTA with deep-green stroke - not lime. */
export const HOURS_REMINDER_CTA_BG = '#009540';
export const HOURS_REMINDER_CTA_FG = '#ffffff';
export const HOURS_REMINDER_CTA_BORDER = '#004d21';

const SUPPORT_EMAIL = 'support@example.org';

const FONT_HEADING = "Georgia, 'Times New Roman', serif";
const FONT_BODY = "'Trebuchet MS', Tahoma, Arial, Helvetica, sans-serif";
const LETTER_SPACING = '0.02em';
/** Figma `cream/50` / `color/bg/app` - not plain white. */
const CARD_BG = '#fcf9f8';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function firstNameFromVolunteer(name: string | null | undefined): string | null {
  const token = name?.trim().split(/\s+/)[0];
  return token ? token : null;
}

export function formatCurrentHours(hours: number | null | undefined): string | null {
  if (hours == null || !Number.isFinite(hours)) return null;
  return hours.toFixed(1);
}

export function resolveHoursReminderField(
  realValue: string | null | undefined,
  placeholder: string,
): string {
  const trimmed = realValue?.trim();
  return trimmed ? trimmed : placeholder;
}

export function hoursReminderHeadline(volunteerName?: string | null): string {
  const firstName = resolveHoursReminderField(
    firstNameFromVolunteer(volunteerName),
    HOURS_REMINDER_PLACEHOLDERS.firstName,
  );
  return `Hi ${firstName}, looks like you have been inactive for a while. Let’s start logging some service hours! Open the app to start logging your hours!`;
}

export function hoursReminderHoursLine(currentHours?: number | null): string {
  const hours = resolveHoursReminderField(
    formatCurrentHours(currentHours),
    HOURS_REMINDER_PLACEHOLDERS.currentHours,
  );
  return `Current hours: ${hours}`;
}

export function buildHoursReminderEmailHtml(input: HoursReminderEmailInput = {}): string {
  const headline = hoursReminderHeadline(input.volunteerName);
  const hoursLine = hoursReminderHoursLine(input.currentHours);
  const assetBase = (input.assetBase?.trim() || HOURS_REMINDER_ASSET_BASE).replace(/\/$/, '');
  const logoUrl = `${assetBase}/logo-mark.png`;
  const bellUrl = `${assetBase}/nudge-bell.gif`;
  const headerPixelUrl = `${assetBase}/header-pixel.png`;
  const fontRegularUrl = `${assetBase}/fonts/NotoSans-Regular.ttf`;
  const fontBoldUrl = `${assetBase}/fonts/NotoSans-Bold.ttf`;
  const fontSanchezUrl = `${assetBase}/fonts/Sanchez-Regular.ttf`;
  const openHref = HOURS_REMINDER_OPEN_APP_URL;
  const supportEmail = escapeHtml(SUPPORT_EMAIL);
  const bellSize = HOURS_REMINDER_BELL_SIZE;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(HOURS_REMINDER_SUBJECT)}</title>
  <style type="text/css">
    :root {
      color-scheme: light only;
      supported-color-schemes: light;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background-color: #bdcaba !important;
    }
    .email-footer {
      width: 100% !important;
      min-width: 100% !important;
    }
    body, td, p, h1, a {
      letter-spacing: 0.02em;
    }
    @font-face {
      font-family: 'Sanchez';
      font-style: normal;
      font-weight: 400;
      src: url('${fontSanchezUrl}') format('truetype');
    }
    @font-face {
      font-family: 'Noto Sans';
      font-style: normal;
      font-weight: 400;
      src: url('${fontRegularUrl}') format('truetype');
    }
    @font-face {
      font-family: 'Noto Sans';
      font-style: normal;
      font-weight: 700;
      src: url('${fontBoldUrl}') format('truetype');
    }
    .hr-body-text {
      font-size: 16px;
      line-height: 1.5;
    }
    .hr-hours-text {
      font-size: 16px;
    }
    @media only screen and (max-width: 600px) {
      .hr-body-text {
        font-size: 18px !important;
        line-height: 1.45 !important;
      }
      .hr-hours-text {
        font-size: 18px !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;width:100%;height:100%;background-color:#bdcaba;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
  ${escapeHtml(hoursLine)}
</div>
<table role="presentation" width="100%" height="100%" cellpadding="0" cellspacing="0" bgcolor="#bdcaba" style="width:100%;min-width:100%;height:100%;min-height:100%;background-color:#bdcaba;">
  <tr>
    <td align="center" bgcolor="${CARD_BG}" style="background-color:${CARD_BG};padding:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${CARD_BG}" style="max-width:600px;background-color:${CARD_BG};font-family:${FONT_BODY};">
        <tr>
          <td bgcolor="#009540" background="${headerPixelUrl}" style="background-color:#009540;background-image:url('${headerPixelUrl}');padding:16px 20px 40px;">
            <img src="${logoUrl}" width="32" height="42" alt="Clean Up Give Back" style="display:block;border:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-top:24px;">
                  <img src="${bellUrl}" width="${bellSize}" height="${bellSize}" alt="" style="display:block;width:${bellSize}px;height:${bellSize}px;border:0;margin:0 auto;">
                </td>
              </tr>
              <tr>
                <td align="center" bgcolor="#009540" background="${headerPixelUrl}" style="padding-top:28px;background-color:#009540;background-image:url('${headerPixelUrl}');">
                  <p class="hr-body-text" style="margin:0;font-family:'Sanchez',${FONT_HEADING};font-size:16px;font-weight:400;line-height:1.5;color:#ffffff;text-align:center;letter-spacing:${LETTER_SPACING};">${escapeHtml(headline)}</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:28px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" align="center" width="100%">
                    <tr>
                      <td align="center" bgcolor="${HOURS_REMINDER_HOURS_BG}" style="background-color:${HOURS_REMINDER_HOURS_BG};padding:10px 16px;">
                        <p class="hr-hours-text" style="margin:0;font-family:'Noto Sans',${FONT_BODY};font-size:16px;font-weight:700;color:${HOURS_REMINDER_HOURS_FG};text-align:center;letter-spacing:${LETTER_SPACING};">${escapeHtml(hoursLine)}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:32px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                    <tr>
                      <td class="hr-cta-cell" align="center" bgcolor="${HOURS_REMINDER_CTA_BG}" style="background-color:${HOURS_REMINDER_CTA_BG};border:2px solid ${HOURS_REMINDER_CTA_BORDER};border-radius:4px;">
                        <a class="hr-cta-link" href="${escapeHtml(openHref)}" style="display:inline-block;padding:16px 37px;font-family:'Sanchez',${FONT_HEADING};font-size:18px;font-weight:400;color:${HOURS_REMINDER_CTA_FG};text-decoration:none;line-height:1.2;letter-spacing:${LETTER_SPACING};">${escapeHtml(HOURS_REMINDER_CTA_LABEL)}</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:32px 24px 28px;">
            <p style="margin:0;font-family:'Noto Sans',${FONT_BODY};font-size:14px;line-height:1.5;color:#6e7a6c;text-align:center;max-width:402px;letter-spacing:${LETTER_SPACING};">
              Please do not reply to this email. For assistance, email
              <a href="mailto:${supportEmail}" style="color:#009540;text-decoration:none;border-bottom:1px solid #009540;letter-spacing:${LETTER_SPACING};">${supportEmail}</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td class="email-footer hr-footer" align="center" valign="top" width="100%" height="100%" bgcolor="#bdcaba" style="background-color:#bdcaba;width:100%;min-width:100%;height:100%;vertical-align:top;padding:28px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr>
          <td align="center" style="font-family:'Noto Sans',${FONT_BODY};font-size:14px;line-height:1.4;letter-spacing:${LETTER_SPACING};">
            <a href="mailto:${supportEmail}" style="color:#1c1b1b;text-decoration:none;border-bottom:1px solid #1c1b1b;letter-spacing:${LETTER_SPACING};">Contact Us</a>
            &nbsp;&nbsp;&nbsp;
            <a href="mailto:${supportEmail}?subject=Privacy%20Policy" style="color:#1c1b1b;text-decoration:none;border-bottom:1px solid #1c1b1b;letter-spacing:${LETTER_SPACING};">Privacy Policy</a>
            &nbsp;&nbsp;&nbsp;
            <a href="mailto:${supportEmail}?subject=Unsubscribe" style="color:#1c1b1b;text-decoration:none;border-bottom:1px solid #1c1b1b;letter-spacing:${LETTER_SPACING};">Unsubscribe</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:25px;font-family:'Noto Sans',${FONT_BODY};font-size:14px;line-height:1.4;color:#1c1b1b;letter-spacing:${LETTER_SPACING};">
            Clean Up - Give Back is a 501(c)(3) nonprofit organization
            <span style="display:none;max-height:0;overflow:hidden;"> ${escapeHtml(hoursLine)}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
