'use strict'

class SocialLogin {
  /**
   * @param {string} email
   * @param {string} name
   * @param {string} photo
   */
  constructor (email, name, photo) {
    this.email = email
    this.name = name
    this.photo = photo
  }
}

module.exports = SocialLogin
