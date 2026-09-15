// Key convention: <screen>.<key> — e.g. settings.language, drawer.home, community.feed
// Add namespaces per screen as strings are migrated; never place UI strings at the root level.
import { I18n } from 'i18n-js';
import en from './en.json';
import es from './es.json';

const i18n = new I18n({ en, es });
i18n.enableFallback = true;
i18n.defaultLocale = 'en';
i18n.locale = 'en';

export default i18n;
