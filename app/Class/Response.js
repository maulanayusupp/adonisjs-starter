'use strict'

class Response {
  /**
   * @param {string} data Response body
   * @param {number} status Status code
   */
  constructor (data, status = 200) {
    this.data = data
    this.status = status
  }
}

module.exports = Response
