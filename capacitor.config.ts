import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.seoe.inspector',
  appName: 'SEOE Inspector',
  webDir: 'out',
  bundledWebRuntime: false,
  plugins: {
    SunmiPrinter: {
      bindOnLoad: true,
    },
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#10b981',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  server: {
    url: process.env.CAPACITOR_SERVER_URL || '',
    cleartext: true,
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAliasPassword: undefined,
      keystoreAlias: undefined,
      releaseType: 'APK',
    },
  },
};

export default config;
