
class LanguageService {
  /** @type {Map<string, Map<string, string>>} */
  translations = new Map();
  /** @type {string} */
  language = 'zh';
  /**
   * Change language
   * @param {string} language Language
   */
  changeLanguage(language) {
    const key = language.substring(0, 2).toLowerCase();
    if(this.translations.has(key))
      this.language = key;
    else
      this.language = 'zh';
  }

  /**
   * Load translations
   * @param {object} data Translation data
   */
  loadTranslations(data) {
    this.translations = new Map();
    for(const lang in data) {
      if(this.translations.has(lang) === false) {
        this.translations.set(lang, new Map());
      }
      for(const key in data[lang]) {
        this.translations.get(lang).set(key, data[lang][key]);
      }
    }
  }

  /**
   * Translate
   * @param {string} key Text
   * @returns {string} Returns translated string
   */
  translate(key) {
    return this.translations.has(this.language) ?
      this.translations.get(this.language).has(key) ?
        this.translations.get(this.language).get(key) : key : key;
  }

}

const languageService = new LanguageService();
export default languageService;
