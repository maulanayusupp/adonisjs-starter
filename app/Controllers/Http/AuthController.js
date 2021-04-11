'use strict'
const Encryption = use("Encryption");
const AuthService = use("App/Services/AuthService");
const HelperService = use('App/Services/HelperService');
const __ = use('App/Helpers/string-localize');
const moment = require('moment');

class AuthController {
  /*
		Login
	*/
	async login({ request, response, auth }) {
		const result = await AuthService.login(request, auth);
		return response.status(result.status).send(result.data);
	}

	/*
		Auto Login
	*/
	async autoLogin({ request, response, auth }) {
		const result = await AuthService.autoLogin(request, auth);
		return response.status(result.status).send(result.data);
	}

	/*
    Logout
   */
	async logout({ auth, response }) {
		const user = auth.current.user;
    const token = auth.getAuthHeader();

		await user
			.tokens()
			.where("token", Encryption.decrypt(token))
			.delete();

		user.logged_out_at = moment().format('YYYY-MM-DD HH:mm:ss');
    await user.save();

		return response.send({ message: "Logout success." });
	}

	/**
   * Generate Token auto login
   */
	async tokenAutoLogin({ response, request }) {
		await HelperService.validate(request, {
			email: "required|email"
		});

		const result = await AuthService.tokenAutoLogin(request);
		return response.status(result.status).send(result.data);
	}

	/*
     * Register
	*/
	async register({ response, request, auth }) {
		await HelperService.validate(request, {
			email: "required|email",
			// password: "required|min:6",
			// name: "required",
		});

		const result = await AuthService.userRegister(request, auth);
		return response.status(result.status).send(result.data);
}

	/*
    User verification
   */
	async userVerification({ response, request }) {
		const result = await AuthService.userVerification(request);
		return response.status(result.status).send(result.data);
	}

	/*
    Update User
   */
	async update({ request, response, auth }) {
		const result = await AuthService.update(request, auth);
		return response.status(result.status).send(result.data);
	}

	/*
    Find user by id
   */
	async findById({ response, auth }) {
		const result = await AuthService.getProfile(auth);
		return response.status(result.status).send(result.data);
	}

	/*
    Change Password
   */
	async changePassword({ request, response, auth }) {
		const result = await AuthService.changePassword(auth, request);
		return response.status(result.status).send(result.data);
	}

	/*
    Forgot password
  */
	async forgotPassword({ request, response }) {
		await HelperService.validate(request, {
			email: "required|email"
		});

		const result = await AuthService.forgotPassword(request);
		return response.status(result.status).send(result.data);
	}

	/*
    Forgot password verify
  */
	async forgotPasswordVerify({ request, response }) {
		await HelperService.validate(request, {
			token: "required",
			newPassword: "required|min:6"
		});

		const token = request.input("token");
		const newPassword = request.input("newPassword");

		const result = await AuthService.forgotPasswordVerify(token, newPassword);
		return response.status(result.status).send(result.data);
	}

	/*
    Resend email register
  */
	async resendRegistrationCode({ request, response }) {
		await HelperService.validate(request, {
			key: "required"
		});

		const result = await AuthService.resendRegistrationCode(request);
		return response.status(result.status).send(result.data);
	}

	/*
    Set password
  */
	async setPassword({ request, response, auth }) {
		await HelperService.validate(request, {
			password: "required|min:6",
			confirmPassword: "required|min:6"
		});
		const { password, confirmPassword } = request.all();
		const userId = auth.current.user.id;
		const result = await AuthService.setPassword(
			password,
			confirmPassword,
			userId
		);
		return response.status(result.status).send(result.data);
	}

	/**
	 * reset password
	 */
	async resetPassword({ request, response, params }) {
    await HelperService.validate(request, {
      new_password: 'required|min:8',
      confirm_Password: 'required|min:8',
    });

    const result = await AuthService.resetPassword(request, params);

    return response.status(result.status).send(result.data);
	}

	/**
   * Send code by SMS for login verification
   **/
	async sendSMSCode({ request, response }) {
    const result = await AuthService.sendSMSCode(request);

    return response.status(result.status).send(result.data);
	}

	/**
   * Login with SMS code
   **/
	async loginWithSMSCode({ request, response, auth }) {
    const result = await AuthService.loginWithSMSCode(request, auth);

    return response.status(result.status).send(result.data);
  }
}

module.exports = AuthController
