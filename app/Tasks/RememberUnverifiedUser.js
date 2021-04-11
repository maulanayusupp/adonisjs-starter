'use strict';

const Task = use('Task');
const User = use('App/Models/User');
const Token = use('App/Models/Token');
const EmailService = use('App/Services/EmailService');
const randomstring = use('randomstring');
const Env = use('Env');

class RememberUnverifiedUser extends Task {
  static get schedule () {
    return '1 */12 * * *'
  }

  async handle () {
    this.info('Task RememberUnverifiedUser handle');
    let users = await User.query().where('is_verified', 0).fetch();
    users = users.toJSON();

    for (let i = 0; i < users.length; i++){
      const user = users[i];
      const lang = user.language;
      let tokens = await Token.query().where('user_id', user.id).where('type', 'verify_account_email').first();
      if (!tokens) {
        // create new token
        tokens = new Token();
        tokens.token = randomstring.generate(20); // generate random token
        tokens.type = 'verify_account_email';
        tokens.user_id = user.id;
        await tokens.save();
      }

      // send email to user
      await EmailService.verifiedAccount(Env.get('FRONTEND_URL'), tokens.token, user, lang);
    }
  }
}

module.exports = RememberUnverifiedUser
