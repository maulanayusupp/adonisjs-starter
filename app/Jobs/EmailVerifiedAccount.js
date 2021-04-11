'use strict';

const Mail = use('Mail');
const Logger = use('Logger');
const Env = use('Env');
const Helpers = use('Helpers');
const __ = use('App/Helpers/string-localize');

class EmailVerifiedAccount {
  // If this getter isn't provided, it will default to 1.
  // Increase this number to increase processing concurrency.
  static get concurrency () {
    return 1;
  }

  // This is required. This is a unique key used to identify this job.
  static get key () {
    return 'EmailVerifiedAccount-job';
  }

  // This is where the work is done.
  async handle (data) {
    console.log('EmailVerifiedAccount: run');
    try {
      await Mail.send('emails.verified-account', data, (message) => {
        message
          .to(data.user.email)
          .from(Env.get('SENDER_MAIL'), Env.get('SENDER_NAME'))
          .subject(__('Verify Account', data.lang))
          .embed(Helpers.publicPath('logo.png'), 'logo')
      });
    } catch (e) {
      Logger.transport('file').error('EmailVerifiedAccount.handle: ', e);
    }
    console.log('EmailVerifiedAccount: done');
  }
}

module.exports = EmailVerifiedAccount;

