import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['es', 'en'],

  // Used when no locale matches
  defaultLocale: 'es',

  // Use 'never' to keep existing URL structure (no /es/ prefix)
  // The locale is detected from cookie/accept-language
  localePrefix: 'never',

  // Disable automatic locale detection redirect
  // We use a manual LanguageSwitcher component that sets the NEXT_LOCALE cookie
  localeDetection: false,
})
