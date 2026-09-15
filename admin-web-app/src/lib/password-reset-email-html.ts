/**
 * Figma `1311:449` Forgot Password email HTML.
 *
 * Same 600px table shell as the order-shipped email (no floating card,
 * no CSS/image drop shadow - Gmail mangles both). All copy is live HTML
 * with system font stacks (Georgia ≈ Sanchez, Trebuchet MS ≈ Noto Sans). Hosted
 * `@font-face` is included for clients that load webfonts (Apple Mail); Gmail
 * falls back to the stack. Logo is the only raster asset.
 */

export type PasswordResetEmailInput = {
  resetUrl: string;
};

export const PASSWORD_RESET_EMAIL_SUBJECT = 'Forgot Password?';

/** Placeholder CTA target for preview/test sends until a recovery link exists. */
export const PASSWORD_RESET_EMAIL_PLACEHOLDER_URL = 'https://cleanupgiveback.org/reset-password';

export const PASSWORD_RESET_EMAIL_COPY = {
  headline: 'Forgot Password?',
  body: "That's okay, it happens. Click on the button below to reset your password. If you did not make this request, ignore this message.",
  cta: 'Reset Password',
} as const;

/** Hosted on the production admin deploy - Resend needs a public image URL. */
export const PASSWORD_RESET_EMAIL_ASSET_BASE = 'https://admin.example.com/email';

const LOGO_MARK_URL = `${PASSWORD_RESET_EMAIL_ASSET_BASE}/logo-mark-green.png`;
const FONT_REGULAR_URL = `${PASSWORD_RESET_EMAIL_ASSET_BASE}/fonts/NotoSans-Regular.ttf`;
const FONT_BOLD_URL = `${PASSWORD_RESET_EMAIL_ASSET_BASE}/fonts/NotoSans-Bold.ttf`;
const FONT_SANCHEZ_URL = `${PASSWORD_RESET_EMAIL_ASSET_BASE}/fonts/Sanchez-Regular.ttf`;

const SUPPORT_EMAIL = 'support@example.org';

/** Georgia/Times stand in for Sanchez where webfonts are stripped. */
const FONT_HEADING = "Georgia, 'Times New Roman', serif";
/** Trebuchet is the closest web-safe humanist to Noto Sans; Arial is the last resort. */
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

export function buildPasswordResetEmailHtml(input: PasswordResetEmailInput): string {
  const resetUrl = input.resetUrl.trim();
  if (!resetUrl) {
    throw new Error('buildPasswordResetEmailHtml requires resetUrl');
  }
  const safeUrl = escapeHtml(resetUrl);
  const headline = escapeHtml(PASSWORD_RESET_EMAIL_COPY.headline);
  const body = escapeHtml(PASSWORD_RESET_EMAIL_COPY.body);
  const cta = escapeHtml(PASSWORD_RESET_EMAIL_COPY.cta);
  const supportEmail = escapeHtml(SUPPORT_EMAIL);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${headline}</title>
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
      src: url('${FONT_SANCHEZ_URL}') format('truetype');
    }
    @font-face {
      font-family: 'Noto Sans';
      font-style: normal;
      font-weight: 400;
      src: url('${FONT_REGULAR_URL}') format('truetype');
    }
    @font-face {
      font-family: 'Noto Sans';
      font-style: normal;
      font-weight: 700;
      src: url('${FONT_BOLD_URL}') format('truetype');
    }
    .pr-body-text {
      font-size: 16px;
      line-height: 1.5;
    }
    @media only screen and (max-width: 600px) {
      .pr-body-text {
        font-size: 18px !important;
        line-height: 1.45 !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;width:100%;height:100%;background-color:#bdcaba;">
<table role="presentation" width="100%" height="100%" cellpadding="0" cellspacing="0" bgcolor="#bdcaba" style="width:100%;min-width:100%;height:100%;min-height:100%;background-color:#bdcaba;">
  <tr>
    <td align="center" valign="top" bgcolor="${CARD_BG}" style="background-color:${CARD_BG};padding:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${CARD_BG}" style="max-width:600px;background-color:${CARD_BG};font-family:${FONT_BODY};">
        <tr>
          <td style="padding:12px 20px 0;">
            <img src="${LOGO_MARK_URL}" width="32" height="42" alt="Clean Up Give Back" style="display:block;border:0;width:32px;height:42px;">
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:16px 24px 0;">
            <h1 style="margin:0;font-family:'Sanchez',${FONT_HEADING};font-size:24px;font-weight:700;color:#009540;text-align:center;line-height:1.3;letter-spacing:${LETTER_SPACING};">${headline}</h1>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:12px 24px 0;">
            <p class="pr-body-text" style="margin:0;font-family:'Noto Sans',${FONT_BODY};font-size:16px;line-height:1.5;color:#1c1b1b;text-align:center;letter-spacing:${LETTER_SPACING};">${body}</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:20px 24px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" align="center">
              <tr>
                <td class="pr-cta-cell" align="center" bgcolor="#009540" style="background-color:#009540;border:2px solid #004d21;border-radius:4px;">
                  <a class="pr-cta-link" href="${safeUrl}" style="display:inline-block;padding:16px 37px;font-family:'Sanchez',${FONT_HEADING};font-size:18px;font-weight:400;color:#ffffff;text-decoration:none;line-height:1.2;letter-spacing:${LETTER_SPACING};">${cta}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 24px 24px;">
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
    <td class="email-footer pr-footer" align="center" valign="top" width="100%" height="100%" bgcolor="#bdcaba" style="background-color:#bdcaba;width:100%;min-width:100%;height:100%;vertical-align:top;padding:28px 24px;">
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
            <span style="display:none;max-height:0;overflow:hidden;"> ${headline}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
