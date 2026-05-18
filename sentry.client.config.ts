import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://233e810929a31519aa9badf1e47dccdf@o4511212511232000.ingest.us.sentry.io/4511212521914368",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you don't want to receive error reports
  // for non-critical errors.
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
