'use strict';

const Mail = use('Mail');
const Logger = use('Logger');
const Env = use('Env');
const __ = use('App/Helpers/string-localize');
const Helpers = use('Helpers');

class EmailAutoLogin {
  // If this getter isn't provided, it will default to 1.
  // Increase this number to increase processing concurrency.
  static get concurrency () {
    return 1
  }

  // This is required. This is a unique key used to identify this job.
  static get key () {
    return 'EmailAutoLogin-job'
  }

  // This is where the work is done.
  async handle (data) {
    console.log('EmailAutoLogin: run');
    try {
      const lang = data.lang;
      data.is_content = false;
      if (data.content) data.is_content = true;
      // Send Email
      await Mail.send('emails.auto-login', data, (message) => {
        message
          .to(data.email)
          .from(Env.get('SENDER_MAIL'), Env.get('SENDER_NAME'))
          .subject(__('Pro Login', lang))
          .embed(Helpers.publicPath('logo.png'), 'logo')
      })
    } catch (e) {
      Logger.transport('file').error('EmailAutoLogin.handle: ', e);
    }
    console.log('EmailAutoLogin: done');
  }
}

module.exports = EmailAutoLogin

