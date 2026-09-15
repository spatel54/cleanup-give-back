import { Sanchez, Noto_Sans, IBM_Plex_Sans } from 'next/font/google';

export const sanchez = Sanchez({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-sanchez',
  display: 'swap',
});

export const notoSans = Noto_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-noto-sans',
  display: 'swap',
});

export const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});
