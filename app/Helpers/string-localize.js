'use strict'

const Antl = use('Antl')

module.exports = (message, language = null) => {
  try {
    let lang = 'en';
    if (language) lang = language;

    return Antl
      .forLocale(lang)
      .formatMessage('no.' + message)
  } catch(error) {
    return message
  }
}