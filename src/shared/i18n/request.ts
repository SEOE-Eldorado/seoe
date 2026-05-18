import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export default getRequestConfig(async () => {
  // Read locale from cookie (set by LanguageSwitcher component)
  // Without middleware, we need to manually read the cookie
  let locale = 'es' // default
  
  try {
    const cookieStore = await cookies()
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
    if (cookieLocale && ['es', 'en'].includes(cookieLocale)) {
      locale = cookieLocale
    }
  } catch {
    // cookies() might fail in some contexts, fall back to default
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
