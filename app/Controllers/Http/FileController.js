'use strict';

const FileService = use('App/Services/FileService');
const Helpers = use('Helpers');

class FileController {
  /*
   * Upload
   */
  async upload({ request, response, auth }) {
    const result = await FileService.upload(request, auth);

    return response.status(result.status).send(result.data);
  }

  /*
   * Get
   */
  async get({ params, response }) {
    const type = params.type;
    const filename = params.filename;
    const file = Helpers.publicPath(`uploads/${type}/${filename}`);
    response.download(file);
  }
}

module.exports = FileController;
