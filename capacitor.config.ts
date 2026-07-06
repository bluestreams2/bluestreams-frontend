import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uk.bluestreams.app',
  appName: 'BlueStreams',
  webDir: 'public',

  server: {
    url: 'https://www.bluestreams.uk',
    cleartext: false
  }
};

export default config;