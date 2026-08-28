import { LanguageCode } from '../../types/i18n';
import { en, TranslationKeys } from './en';
import { es } from './es';
import { de } from './de';
import { fr } from './fr';
import { it } from './it';
import { hr } from './hr';

export const translations: Record<LanguageCode, TranslationKeys> = {
  en,
  es,
  de,
  fr,
  it,
  hr,
};

export { en, TranslationKeys };
