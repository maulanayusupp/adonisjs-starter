'use strict'
const {
  validateAll
} = use('Validator')
const ValidationException = use('App/Exceptions/ValidationException')

class HelperService {
  /**
   * Validation
   * @param Request request
   * @param string rules
  **/
  async validate(request, rules) {
    const validation = await validateAll(request.all(), rules)
    if (validation.fails()) throw new ValidationException(validation.messages())
  }

  // Currency format
  currencyFormat(number) {
    let tempNum = String(number).split("").reverse()
    let Currency = ''
    for (let i = 0; i < tempNum.length; i++) {
      if ((i + 1) % 3 == 0 && i != tempNum.length - 1) {
        tempNum[i] = `.${ tempNum[i]}`
      }
    }
    Currency = `${tempNum.reverse().join("")}`
    return Currency
  }

  // Set boolean
  setBoolean(params) {
    let bool = false;
    if (params === 'true' || params == 1) {
      bool = true;
    }

    return bool;
  }
}

module.exports = new HelperService()
