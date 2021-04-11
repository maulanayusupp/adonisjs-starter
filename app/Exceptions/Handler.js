'use strict'

const BaseExceptionHandler = use('BaseExceptionHandler')
const Logger = use('Logger')
const Env = use('Env')

/**
 * This class handles all exceptions thrown during
 * the HTTP request lifecycle.
 *
 * @class ExceptionHandler
 */
class ExceptionHandler extends BaseExceptionHandler {
  /* istanbul ignore next */
  /**
   * Handle exception thrown during the HTTP lifecycle
   *
   * @method handle
   *
   * @param  {Object} error
   * @param  {Object} options.request
   * @param  {Object} options.response
   *
   * @return {void}
   */
  async handle (error, { response }) {

    switch (error.name) {
      case 'InvalidApiToken': return response.status(error.status).send({ message: 'Invalid API token.' })
      case 'ModelNotFoundException': return response.status(error.status).send({ message: 'Data not found.' })
      case 'HttpException': return response.status(error.status).send({ message: error.message })
      case 'TooManyRequests': return response.status(error.status).send({ message: error.message })
      case 'UserNotFoundException': return response.status(error.status).send({ message: 'Email not found, please register first!' })
      case 'PasswordMisMatchException': return response.status(error.status).send({ message: 'Wrong password!' })
    }

    switch (error.code) {
      case 'SQLITE_CONSTRAINT': return response.status(error.status).send({ message: 'Internal server error.' })
      case 'SQLITE_ERROR': return response.status(error.status).send({ message: 'Internal server error.' })
    }

    switch (error.statusCode) {
      case 400: return response.status(error.status).send({ message: 'Bad request.' })
    }

    if (Env.get('NODE_ENV') === 'development') {
      return response.status(error.status).send({ errorMessage: error.message, errorName: error.name, errorCode: error.code })
    } else if (Env.get('NODE_ENV') === 'production') {
      return response.status(error.status).send({ message: 'Something error happens, we will fix soon.' })
    }

    return super.handle(...arguments)
  }

  /**
   * Report exception for logging or debugging.
   *
   * @method report
   *
   * @param  {Object} error
   * @param  {Object} options.request
   *
   * @return {void}
   */
  async report (error) {
    Logger.transport('file').error('Handler.report: ', error)
  }
}

module.exports = ExceptionHandler
