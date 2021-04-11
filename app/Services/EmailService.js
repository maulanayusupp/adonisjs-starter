'use strict';

const kue = use('Kue');
const Logger = use('Logger');

class EmailService {
  /**
   * Queue send email verified account
   * This function using for send email verified account from queue
   * @param String url
   * @param Object user
   * @param String password
   **/
  async verifiedAccount(url, token, user, lang) {
    try {
      const data = {
        user: user,
        url: url,
        token: token,
        lang: lang
      } // Data to be passed to job handle
      const priority = 'high'; // Priority of job, can be low, normal, medium, high or critical
      const attempts = 1; // Number of times to attempt job if it fails
      const remove = true; // Should jobs be automatically removed on completion
      kue.dispatch('EmailVerifiedAccount-job', data, priority, attempts, remove);
    } catch (e) {
      Logger.transport('file').info('EmailService.verifiedAccount: ', e);
    }
  }

  /**
   * Forgot Password
   * This function using for send email forgot password from queue
   * @param String url
   * @param String token
   * @param String email
   **/
  async forgotPassword(url, token, email, lang) {
    try {
      const data = {
        email: email,
        url: url,
        token: token,
        lang: lang
      } // Data to be passed to job handle
      const priority = 'high'; // Priority of job, can be low, normal, medium, high or critical
      const attempts = 1; // Number of times to attempt job if it fails
      const remove = true; // Should jobs be automatically removed on completion
      kue.dispatch('EmailForgotPassword-job', data, priority, attempts, remove);
    } catch (e) {
      Logger.transport('file').info('EmailService.forgotPassword: ', e);
    }
  }

  /**
   * Queue send notification success payment
   * This function using for send notification success payment
   **/
  async successPayment(data) {
    try {
      const priority = 'high' // Priority of job, can be low, normal, medium, high or critical
      const attempts = 1 // Number of times to attempt job if it fails
      const remove = true // Should jobs be automatically removed on completion
      kue.dispatch('EmailSuccessPayment-job', data, priority, attempts, remove)
    } catch (e) {
      Logger.transport('file').info('EmailService.successPayment: ', e)
    }
  }

  /**
   * Auto Login
   * This function using for send email auto login from queue
   **/
  async autoLogin(data) {
    try {
      const priority = 'high'; // Priority of job, can be low, normal, medium, high or critical
      const attempts = 1; // Number of times to attempt job if it fails
      const remove = true; // Should jobs be automatically removed on completion
      kue.dispatch('EmailAutoLogin-job', data, priority, attempts, remove);
    } catch (e) {
      Logger.transport('file').info('EmailService.autoLogin: ', e);
    }
  }
}

module.exports = new EmailService()
