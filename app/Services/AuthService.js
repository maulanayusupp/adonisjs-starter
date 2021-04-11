'use strict'
const Response = use('App/Class/Response');
const EmailService = use('App/Services/EmailService');
const User = use('App/Models/User');
const Profile = use('App/Models/Profile');
const Token = use('App/Models/Token');

const Logger = use('Logger');
const Env = use('Env');
const Hash = use('Hash');
const randomstring = use('randomstring');
const Database = use('Database');
const moment = require('moment');
const __ = use('App/Helpers/string-localize');
const isUndefined = require("is-undefined");
const Nexmo = require('nexmo');
const nexmo = new Nexmo({
  apiKey: Env.get('NEXMO_KEY'),
  apiSecret: Env.get('NEXMO_SECRET'),
});
const BitlyClient = require('bitly').BitlyClient;
const bitly = new BitlyClient(Env.get('BITLY_SECRET'));

class AuthService {
  /*
    Login
  */
  async login(body, auth) {
    const {email, password, lang} = body.all();
    try {
      const user = await User.query().where('email', email).orWhere('username', email).first();
      if (user) {
        // if (!user.is_verified) return new Response({ message: __('Please check your email, to activate your account', lang) }, 422);

        const isPasswordConfirmed = await Hash.verify(password, user.password);
        if (!isPasswordConfirmed) {
          return new Response({ message: __('Wrong password', lang) }, 422);
        }

        // Generate token
        const token = await auth.generate(user);

        // Update logged in at
        user.logged_in_at = moment().format('YYYY-MM-DD HH:mm:ss');
        await user.save();

        const isDefaultPassword = await Hash.verify('PRO_APP', user.password);
        token.is_set_password = isDefaultPassword;

        return new Response({ data: token });
      }
      return new Response({ message: __('Your email is not registered', lang) }, 422);
    } catch (e) {
      Logger.transport('file').error('AuthService.login: ', e);
      return new Response({ message: __('Cant login, please contact support', lang) }, 422);
    }
  }

	/*
    Auto Login
    */
  async autoLogin(body, auth) {
    const {token} = body.all();
    const lang = body.input('lang') ? body.input('lang') : 'en';
    try {
      const myToken = await Token.query().where('token', token).where('type', 'auto_login').first();
			if (myToken) {
				const user = await User.find(myToken.user_id);
				try {
					if (user) {
            // if (!user.is_verified) return new Response({ message: __('Please check your email, to activate your account', lang) }, 422);

            // generate token
            const token = await auth.generate(user);

            // Logged in at
            user.logged_in_at = moment().format('YYYY-MM-DD HH:mm:ss');
            await user.save();

            const isDefaultPassword = await Hash.verify('PRO_APP', user.password);

            token.is_set_password = isDefaultPassword;

            // await myToken.delete();
            return new Response({ data: token, message: __('Login Successfully', user.language) });
					}

					return new Response({ message: __('Your token is not registered', lang) }, 422);
				} catch (e) {
					Logger.transport('file').error('AuthService.autoLogin: ', e);
					return new Response({ message: __('Cannot find user', lang) }, 422);
				}
			} else {
				return new Response({ message: __('Token is not valid', lang) }, 422);
      }
		} catch (e) {
			Logger.transport('file').error('AuthService.autoLogin: ', e);
			return new Response({ message: __('Cannot find token', lang) }, 422);
		}
  }

  /*
    Get Profile
    */
  async getProfile(auth) {
    const lang = auth.current && auth.current.user ? auth.current.user.language : 'no';
    try {
      const user = auth.current.user;
      const freshUser = await User.query().where('id',user.id)
        .with('profile')
        .first()

      // Update logged in at
      freshUser.logged_in_at = moment().format('YYYY-MM-DD HH:mm:ss');
      await freshUser.save();

      return new Response({ data: freshUser });
    } catch (e) {
      Logger.transport('file').error('AuthService.getProfile: ', e);
      return new Response({ message: __('Failed to access profile, please contact support', lang) }, 422);
    }
  }

  /**
   * Update profile user
   */
  async update(body, auth) {
    let lang = auth.current.user.language;
    try {
      const params = body.all();
      const {
        username,
        email,
        is_allow_notify,
        language,
        name,
        address,
        mobile_phone,
        city,
        state,
        country,
        postal_code,
        birth_date,
        gender,
        picture,
        company,
        biography
      } = body.all();

      const user = auth.current.user; // get user data from auth session

      // if user want to change email
      if (email) {
        // check email from database
        const checkEmail = await User.query().where('email', email).whereNot('id', user.id).first()
        // if email has been used send error message
        if (checkEmail) return new Response({
          message: __('Email has been used', lang)
        }, 422)

        user.email = email;
      }

      // if user want to change username
      if (username) {
        // check username from database
        const checkUsername = await User.query().where('username', username).whereNot('id', user.id).first()
        // if username has been used send error message
        if (checkUsername) return new Response({
          message: __('Username has been used', lang)
        }, 422);

        user.username = username;
      }
      if (mobile_phone) user.mobile_phone = mobile_phone;
      if (!isUndefined(is_allow_notify)) user.is_allow_notify = is_allow_notify;
      if (language) {
        lang = language;
        user.language = language;
      }
      await user.save();

      let profile = await Profile.findBy('user_id', user.id);
      if (!profile) {
        profile = new Profile();
        profile.user_id = user.id;
      }

      if (name) profile.name = name;
      if (address) profile.address = address;
      if (city) profile.city = city;
      if (state) profile.state = state;
      if (country) profile.country = country;
      if (postal_code) profile.postal_code = postal_code;
      if (company) profile.company = company;
      if (gender) profile.gender = gender;
      if (picture) profile.picture = picture;
      if (!isUndefined(biography)) profile.biography = biography;
      if (birth_date) {
        const newBirthDate = new Date(birth_date);
        profile.birth_date = moment(newBirthDate).format('YYYY-MM-DD');
      }
      await profile.save()

      // get new data user after updated
      const updatedUser = await User.query().where('id',user.id)
        .with('profile')
        .first()

      return new Response({
        message: __('Profile has been updated', lang),
        data: updatedUser
      })

    } catch (e) {
      Logger.transport('file').error('AuthService.update: ', e);
      return new Response({ message: __('Failed to update profile, please contact support', lang) }, 422);
    }
  }

  /**
   * This function allows user for register to website
   */
  async userRegister(body, auth) {
    const lang = body.input('lang') ? body.input('lang') : 'en';
    const {
      name,
      email,
      password,
      mobile_phone,
      verification_method,
      username,
      gender,
      birth_date,
    } = body.all();

    const trx = await Database.beginTransaction();
    try {
      let user = await User.query().where('email', email).withTrashed(true).first();

      if (verification_method === 'phone') {
        if (!mobile_phone) return new Response({message: __('Phone number not found', lang)}, 404);
      }

      if (user && !user.deleted_at) return new Response({message: __('Email has been used', lang)}, 422);

      // check phone and username
      // let checkUsername = User.query().where('username', username)
      let checkPhone = User.query().where('mobile_phone', mobile_phone)

      if (user) {
        // checkUsername = checkUsername.whereNot('id', user.id)
        if (mobile_phone) checkPhone = checkPhone.whereNot('id', user.id)
      }

      // checkUsername = await checkUsername.withTrashed(true).first();
      // if (checkUsername && !checkUsername.deleted_at) return new Response({message: __('Username has been used', lang)}, 422);

      if (mobile_phone) checkPhone = await checkPhone.withTrashed(true).first();
      if (mobile_phone) if (checkPhone && !checkPhone.deleted_at) return new Response({message: __('Mobile phone has been used', lang)}, 422);
      const newPassword = password ? password : 'PRO_APP';

      // User
      if (!user) user = new User();
      user.email = email;
      user.username = username;
      if (mobile_phone) user.mobile_phone = mobile_phone;
      user.password = newPassword;
      user.is_verified = false;
      user.is_active = true;
      user.deleted_at = null;
      user.roles = JSON.stringify(['client']);
      user.language = lang;
      await user.save();

      // Profile
      let profile = await Profile.query().where('user_id', user.id).withTrashed(true).first()
      if (!profile) profile = new Profile();
      profile.user_id = user.id;
      profile.name = name;
      profile.gender = gender;
      profile.birth_date = birth_date;
      profile.deleted_at = null;
      await profile.save();

      // create new token
      const tokens = new Token();
      if (verification_method === 'email') {
        tokens.token = randomstring.generate(20); // generate random token
        tokens.type = 'verify_account_email';
      } else {
        tokens.type = 'verify_account_phone';
        tokens.token = randomstring.generate({length: 6, charset: 'numeric'});
      }
      tokens.user_id = user.id;
      await tokens.save();

      let message = null;
      const newUser = await User.query().where('id', user.id).first();

      if (verification_method === 'email') {
        message =  __('Registration successfully, please check your email for activation your account', lang);
        // send email to user
        await EmailService.verifiedAccount(Env.get('FRONTEND_URL'), tokens.token, newUser, lang);
      } else {

        message =  __('Verification code successfully sent to your phone', lang)

        try {
          // set params for nexmo
          const from = Env.get('NEXMO_FROM');
          const to = newUser.mobile_phone;
          const text = __('Your LMS login, your registration code is', lang) + ' ' + tokens.token;

          await nexmo.message.sendSms(from, to, text); // send sms via nexmo
        } catch (e) {
          Logger.transport('file').error('AuthService.userRegister-Nexmo: ', e);
          return new Response({ message: __('Please resend registration code with email', lang) }, 422);
        }
      }

      // Generate token login
      const loginToken = await auth.generate(user);
      const payload = {
        message,
        token: loginToken,
      };

      trx.commit();
      return new Response(payload);
    } catch (e) {
      trx.rollback();
      Logger.transport('file').error('AuthService.userRegister: ', e);
      return new Response({ message: __('Failed to register your account, please contact support', lang) }, 422);
    }
  }

  /**
   * This functions allows user for resend email register
   */
  async resendRegistrationCode(body) {
    const lang = body.input('lang') ? body.input('lang') : 'en';
    try {
      const key = body.input('key');
      const verification_method = body.input('verification_method');

      let message = null;

      // Get user
      let user = User.query();
      if (verification_method === 'email') {
        user = user.where('email', key);
        message = __('Email not found', lang);
      } else {
        user = user.where('mobile_phone', key);
        message = __('Phone number not found', lang);
      }
      user = await user.first();

      if (!user) return new Response({message: message}, 404);

      // check if user has been verified
      if (user.is_verified) return new Response({message: 'Your account is active'}, 422);

      // get token user
      let tokens = Token.query().where('user_id', user.id);
      if (verification_method === 'email') {
        tokens = tokens.where('type', 'verify_account_email');
      } else {
        tokens = tokens.where('type', 'verify_account_phone');
      }
      tokens = await tokens.first();

      if (!tokens) {
        // create new token
        tokens = new Token();
        if (verification_method === 'email') {
          tokens.token = randomstring.generate(20); // generate random token
          tokens.type = 'verify_account_email';
        } else {
          tokens.type = 'verify_account_phone';
          tokens.token = randomstring.generate({length: 6, charset: 'numeric'});
        }
        tokens.user_id = user.id;
        await tokens.save();
      }

      if (verification_method === 'email') {
        message =  __('Successfully resend email register, please check your email for activation your account', lang);
        // send email to user
        await EmailService.verifiedAccount(Env.get('FRONTEND_URL'), tokens.token, user, lang);
      } else {
        message =  __('Verification code successfully sent to your phone', lang)
        try {
          // set params for nexmo
          const from = Env.get('NEXMO_FROM');
          const to = user.mobile_phone;
          const text = __('Your LMS login, your registration code is', lang) + ' ' + tokens.token;

          await nexmo.message.sendSms(from, to, text); // send sms via nexmo
        } catch (e) {
          Logger.transport('file').error('AuthService.userRegister-Nexmo: ', e);
          return new Response({ message: __('Please resend registration code with email', lang) }, 422);
        }
      }

      return new Response({message: message});
    } catch (e) {
      Logger.transport('file').error('AuthService.resendEmailRegister: ', e);
      return new Response({ message: __('Failed to resend registration code, please contact support', lang) }, 422);
    }
  }

  /**
   * This functions allow user for verification his account
   */
  async userVerification(body) {
    const lang = body.input('lang') ? body.input('lang') : 'en';
    try {
      const token = body.input('token');
      const tokens = await Token.query().where('token', token).first();
      if (!tokens) return new Response({message: __('Your registration has expired', lang)}, 422);

      const user = await User.query().where('id', tokens.user_id).first();
      if (!user) return new Response({message: __('Your account not found', lang)}, 404);

      user.is_active = true;
      user.is_verified = true;
      await user.save();

      await Token.query().where('token', token).where('type', 'like', '%verify_account%').delete();

      const updatedUser = await User.query().where('id', user.id).first();

      return new Response({message: __('Successfully activated your account', lang), data: updatedUser});
    } catch (e) {
      Logger.transport('file').error('AuthService.userVerification: ', e);
      return new Response({ message: __('Failed to verify your account, please contact support', lang) }, 422);
    }
  }

  /**
   * this function allows for change password
   */
  async changePassword(auth, body) {
    const lang = auth.current.user ? auth.current.user.language : 'no';
    try {
      const {old_password, new_password, confirm_password} = body.all();

      if (!old_password) return new Response({message: __('Please insert old password', lang)}, 422);
      // get current user
      const user = auth.current.user;

      const isDefaultPassword = await Hash.verify('PRO_APP', user.password);

      if (!isDefaultPassword) {
          // compare the old password with new password
          const checkPassword = await Hash.verify(old_password, user.password);

          // if not same betwen new password and old password send error message
          if (!checkPassword) return new Response({message: __('Old password is wrong', lang)}, 422);
      }

      // compare new password and confirmation password, if not same send error message
      if (new_password !== confirm_password) return new Response({message: __('New password and confirmation password not same', lang)}, 422);

      user.password = await Hash.make(new_password); // save new password to database with hash
      await user.save();

      return new Response({message: __('Change password has been successfully', lang)});
    } catch (e) {
      Logger.transport('file').error('AuthService.changePassword: ', e);
      return new Response({ message: __('Failed to change your password, please contact support', lang) }, 422);
    }
  }

  /**
   * this functions allows user for send email forgot password
   */
  async forgotPassword(body) {
    const lang = body.input('lang') ? body.input('lang') : 'en';
    try {
      const email = body.input('email');
      const user = await User.query().where('email', email).first();
      if (!user) return new Response({message: __('Email not found', lang)}, 404);

      // if user account is not verified then return error message
      // if (!user.is_verified) return new Response({message: __('User has not verified the email', lang)}, 422);

      // create new session token
      const tokens = new Token();
      tokens.token = randomstring.generate(20); // generate random token
      tokens.type = 'forgot_password';
      tokens.user_id = user.id;
      await tokens.save();

      const token = tokens.token; // take the generated token

      // send email to user for reset password
      await EmailService.forgotPassword(Env.get('FRONTEND_URL'), token, user.email, lang);

      return new Response({message: __('A link to change your password has been successfully sent to your email', lang)});
    } catch (e) {
      Logger.transport('file').error('AuthService.forgotPassword: ', e);
      return new Response({ message: __('Failed to send email forgot password, please contact support', lang) }, 422);
    }
  }

  /**
   * Reset password
   * This function allows user for set new password
   * @param String new_password, confirm_Password
   * @return Object|Response
   **/
  async resetPassword(body, params) {
    let lang = body.input('lang') ? body.input('lang') : 'no';
    try {
      const {
        new_password,
        confirm_Password
      } = body.all();

      // find user by email
      const user = await User.findBy('email', params.email);
      // if user not exist then return error message
      if (!user) return new Response({
        message: __('User not found', lang)
      }, 422);

      lang = user.language;

      // find token forgot password
      const tokens = await Token.query().where({
        user_id: user.id,
        token: params.token,
        type: 'forgot_password'
      }).first();

      // if user not exist then return error message
      if (!tokens) return new Response({
        message: __('Token has been expired', lang)
      }, 422);

      // Check new password and confirm pasword not same then send error message
      if (new_password !== confirm_Password) return new Response({
        message: __('New password and confirmation password not same', lang)
      }, 422);

      user.password = await Hash.make(new_password); // save new password to database with hash
      await user.save();

      await tokens.delete();

      return new Response({
        message: __('Your password has been set with new password', lang)
      });
    } catch (e) {
      Logger.transport('file').error('AuthService.resetPassword: ', e);
      return new Response({
        message: __('Cant reset your password, please contact support', lang)
      }, 422);
    }
  }

  /**
   * Generate Token auto login
   */
  async tokenAutoLogin(body) {
    let lang = body.input('lang') ? body.input('lang') : 'no';
    try {
      const email = body.input('email');

      const user = await User.query().where('email', email).first();
      if (!user) return new Response({message: __('Email not found, please register first', lang)}, 422);

      // if (!user.is_verified) return new Response({message: __('Please verify your account first', lang)}, 422);

      const randomToken = randomstring.generate(8);
      // generate token
      const tokens = new Token();
      tokens.user_id = user.id;
      tokens.token = randomToken.toUpperCase();
      tokens.type = 'auto_login';
      await tokens.save();

      const profile = user.$relations.profile;
      const userName = profile.name ? profile.name : 'User';

      const url = Env.get('FRONTEND_URL') + '/auto_login?token=' + tokens.token;
      let shortenUrl = null;
      try {
        shortenUrl = await bitly.shorten(url);
      } catch (e) {
        Logger.transport("file").error("AuthService.generateBitly: ", e);
      }

      // create url login
      const emailData = {
        email: user.email,
        urlLogin: shortenUrl ? shortenUrl.link : url,
        userName: userName.toUpperCase(),
        mobilePhone: user.mobile_phone,
        lang: lang
      }

      // send email to user for reset password
      await EmailService.autoLogin(emailData);

      return new Response({message: __('Url has been sent to your email', lang)});
    } catch (e) {
      Logger.transport('file').error('AuthService.tokenAutoLogin: ', e);
      return new Response({
        message: __('Cant generate token, please contact support', lang)
      }, 422);
    }
  }

  /**
   * Function for send code by SMS for login verification
   **/
  async sendSMSCode(body) {
    const lang = body.input('lang') ? body.input('lang') : 'en';

    try {
      const mobile_phone = body.input('mobile_phone');
      // get user by mobile phone
      const user = await User.query().where('mobile_phone', mobile_phone).first();

      // if profile user not exist
      if (!user) return new Response({message: __('Mobile phone not found', lang)}, 422);

      const code = randomstring.generate({
        length: 6,
        charset: 'numeric'
      }); // generate code

      // get token from table tokens
      let tokens = await Token.query().where({
        user_id: user.id,
        type: 'login_sms'
      }).first();

      // if token has been found, then delete token
      if (tokens) await tokens.delete();

      // create new token
      tokens = new Token();
      tokens.token = code;
      tokens.type = 'login_sms';
      tokens.user_id = user.id;
      await tokens.save();

      try {
        // set params for nexmo
        const from = Env.get('NEXMO_FROM');
        const to = user.mobile_phone;
        const text = __('Your Pro login, your code is', lang) + ' ' + code;

        await nexmo.message.sendSms(from, to, text); // send sms via nexmo
      } catch (e) {
        return new Response({ message: e.message + ' ' + 'Please resend login code with email' }, 422);
      }

      return new Response({
        message: __('Verification code has been sent', lang)
      });
    } catch (e) {
      Logger.transport('file').error('AuthService.sendSMSCode: ', e)
      return new Response({
        message: __('Can not Send verification code, please contact support', lang)
      }, 422);
    }
  }

  /**
   * Function login with SMS code
   **/
  async loginWithSMSCode(body, auth) {
    const lang = body.input('lang') ? body.input('lang') : 'en';
    try {
      const {
        code,
        mobile_phone
      } = body.all();

      // get profile user base on phone number
      const user = await User.query().where('mobile_phone', mobile_phone).first();
      // if profile not exist then send response error
      if (!user) return new Response({message: __('Phone number not found', lang)}, 422);

      // get data token from database base on filter user_id, token, and type
      let tokens = await Token.query().where({
        user_id: user.id,
        token: code,
        type: 'login_sms'
      }).first();

      // if token not exist then send error message
      if (!tokens) return new Response({
        message: __('Verification code has been expired', lang)
      });

      const hasil = await auth.generate(user) // generate new seesion
      user.logged_in_at = moment().format('YYYY-MM-DD HH:mm:ss');
      await user.save()

      // delete token code that was just used
      await tokens.delete();

      const isDefaultPassword = await Hash.verify('PRO_APP', user.password);
      hasil.is_set_password = isDefaultPassword;

      return new Response({
        data: hasil
      })
    } catch (e) {
      Logger.transport('file').error('AuthService.updateProfile: ', e)
      return new Response({
        message: __('Cant login with code, please contact support', lang)
      }, 422);
    }
  }
}

module.exports = new AuthService()
