'use strict';

const UserService = use('App/Services/UserService');
const HelperService = use('App/Services/HelperService');

class UserController {
  /*
		Get all user
	 */
  async index({ request, response, auth }) {
    const result = await UserService.getAll(request, auth);
    return response.status(result.status).send(result.data);
  }

  /*
		Detail User
	 */
  async show({ params, response, auth }) {
    const result = await UserService.getById(params.id, auth);
    return response.status(result.status).send(result.data);
  }

  /*
		Banned User
	 */
  async bannedUser({ params, response, auth }) {
    const result = await UserService.bannedUser(params.id, auth);
    return response.status(result.status).send(result.data);
  }

  /*
		Create User
	 */
  async store({ auth, request, response }) {
    await HelperService.validate(request, {
      email: 'required|email',
      password: 'required|min:8',
    });

    const params = request.all();

    const result = await UserService.create(auth, params);
    return response.status(result.status).send(result.data);
  }

  /*
		Update User
	 */
  async update({ request, response, params, auth }) {
    const result = await UserService.update(request, params.id, auth);
    return response.status(result.status).send(result.data);
  }

  /*
		Create bulk User
	 */
  async createBulk({ request, response, auth }) {
    const result = await UserService.createBulk(request, auth);
    return response.status(result.status).send(result.data);
  }

  /*
		Update bulk user
	 */
  async updateBulk({ request, response, auth }) {
    const result = await UserService.updateBulk(request, auth);
    return response.status(result.status).send(result.data);
  }

	/*
		Delete
	 */
	async destroy ({response, params, auth}) {
		const id = params.id;
		const result = await UserService.delete(id, auth);
		return response.status(result.status).send(result.data);
	}

	/*
		Bulk delete
	 */
	async deleteBulk ({request, response, auth}) {
		const result = await UserService.deleteBulk(request, auth);
		return response.status(result.status).send(result.data);
  }

  /*
		Export Excel
	 */
  async exportExcel({ request, response, auth }) {
    const result = await UserService.exportToExcel(request, response);
    if(result){
      result.download('user-export-'+ new Date().getTime());
    }else {
      return response.status(422).send({message: 'Cant export to excel, please contact support'});
    }
  }

  /*
		Export Docx
	 */
  async exportDocx({ request, response, auth }) {
    const result = await UserService.exportToDocx(request);

    if(result){
      const filename = 'user-export-' + new Date().getTime() + '.docx';
      response.header('Content-Disposition', 'attachment; filename='+filename);
      return response.send(Buffer.from(result, 'base64'));
    }else {
      return response.status(422).send({message: 'Cant export to docx, please contact support'});
    }
  }

  /*
		Force update password
	 */
  async forceUpdatePassword({ request, response, params, auth }) {
    const result = await UserService.forceUpdatePassword(request, params.user_id, auth);
    return response.status(result.status).send(result.data);
  }
}

module.exports = UserController
