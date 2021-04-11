'use strict';

const Helpers = use('Helpers');
const Response = use('App/Class/Response');
const Env = use('Env');
const Logger = use('Logger');
const __ = use('App/Helpers/string-localize');
const Drive = use('Drive');
const { slugify, replaceAll } = require('underscore.string');

class FileService {
  /**
   * Upload
   * @param File file
   **/
  async upload(body, auth) {
    const language = auth.current.user.language;

    const fileUpload = body.file('file', {
      size: '1024mb'
    });

    const type = fileUpload.type;
    const fileType = `${type}s`;
    const dir = Helpers.publicPath('uploads/' + fileType + '/');
    const extension = '.' + fileUpload.extname;
    const timeNow = `${new Date().getTime()}`;
    const slugName = `${slugify(replaceAll(fileUpload.clientName, extension, ''))}`;
    let filename = `${timeNow}_${slugName}${extension}`;
    const fullPath = dir+filename;

    try {
      await Drive.move(fileUpload.tmpPath, fullPath);

      const url = Env.get('ASSET_URL') + '/files/' + fileType + '/' + filename;

      return new Response({
        message: __('File has been uploads', language),
        data: url
      });

    } catch (e) {
      Logger.transport('file').error('FileService.upload: ', e);
      return new Response({
        message: __('Cant upload file, please contact support', language)
      }, 422);
    }
  }
}

module.exports = new FileService()
