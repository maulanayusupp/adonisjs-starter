"use strict";

const User = use('App/Models/User');
const Profile = use('App/Models/Profile');
const HelperService = use('App/Services/HelperService');
const Response = use('App/Class/Response');
const Logger = use('Logger');
const Database = use('Database');
const Hash = use('Hash');
const __ = use('App/Helpers/string-localize');
const moment = require('moment');
const SpreadSheet = use('SpreadSheet');
const docx = require('docx');
const isUndefined = require("is-undefined");

class UserService {
  /**
   * Get all data user
   **/
  async getAll(body, auth) {
    // Auth
    const language = auth.current.user.language;
    const userId = auth.current.user.id;
    const authUser = await User.query().where('id', userId).with('profile').first();
    const authUserProfile = authUser.$relations && authUser.$relations.profile ? authUser.$relations.profile : null;

    try {
      const {
        page,
        limit,
        role,
        order_by,
        sort_by,
        keyword,
        is_verified,
        logged_in_at,
      } = body.all();

      let users = User.query()
        .select(['users.*'])
        .leftJoin('profiles as profiles', 'profiles.user_id', 'users.id');

      // Role
      if (role) users = users.where('users.roles', 'like', '%' + role + '%');

      // Verified
      if (is_verified) users = users.where('is_verified', is_verified);

      // Keyword
      if (keyword) {
        users = users.where(function () {
          this.where('users.email', 'like', '%' + keyword + '%')
          this.orWhere('users.username', 'like', '%' + keyword + '%')
          this.orWhere('profiles.name', 'like', '%' + keyword + '%')
          this.orWhere('profiles.address', 'like', '%' + keyword + '%')
          this.orWhere('profiles.city', 'like', '%' + keyword + '%')
          this.orWhere('profiles.state', 'like', '%' + keyword + '%')
          this.orWhere('profiles.country', 'like', '%' + keyword + '%')
          this.orWhere('profiles.job_title', 'like', '%' + keyword + '%')
          this.orWhere('profiles.gender', 'like', '%' + keyword + '%')
          this.orWhere('profiles.biography', 'like', '%' + keyword + '%')
        })
      }

      // Logged In At
      if (!isUndefined(logged_in_at)) users = users.where('users.logged_in_at', logged_in_at);

      // Order By or Sort By
      if (order_by && sort_by) {
        users = users.orderBy(order_by, sort_by);
      } else {
        users = users.orderBy('users.created_at', 'asc');
      }

      users = await users
        .with('createdBy')
        .paginate(page, limit);

      return new Response(users);
    } catch (e) {
      Logger.transport('file').error('UserService.getAll: ', e);
      return new Response({
        message: __('Cant get data user, please contact support', language)
      }, 422);
    }
  }

  /**
   * Get detail
   **/
  async getById(id, auth) {
    const language = auth.current.user.language;
    try {
      const user = await User.query()
        .where('id', id)
        .orWhere('username', id)
        .with('profile')
        .first();

      return new Response({
        data: user
      });
    } catch (e) {
      Logger.transport('file').error('UserService.getById: ', e);
      return new Response({
        message: __('Cant get detail user, please contact support', language)
      }, 422);
    }
  }

  /**
   * Create data user
   **/
  async create(auth, params) {
    const userParams = params;
    userParams.user = auth.current.user;

    const newUser = await this.onCreate(params);

    return new Response({message: newUser.message, data: newUser.data}, newUser.status);
  }

  /**
   * Update user
   **/
  async update(body, id, auth) {
    const userParams = body.all();
    userParams.id = id;
    userParams.user = auth.current.user;

    const updateUser = await this.onUpdate(userParams);

    return new Response({message: updateUser.message, data: updateUser.data}, updateUser.status);
  }

  /*
		Delete
	 */
	async delete(id, auth) {
    const language = auth.current.user.language;
		const trx = await Database.beginTransaction();
		try {
			const user = await User.findOrFail(id);
      const profile = await Profile.findBy("user_id", id);
			await profile.delete(trx);
			await user.delete(trx);
			trx.commit();
			return new Response({ message: __("User deleted", language) });
		} catch (e) {
			trx.rollback();
			Logger.transport("file").error("UserService.delete: ", e);
			return new Response({ message: __("Cant delete user", language) }, 422);
		}
	}

  /**
   * Create bulk data user
   **/
  async createBulk(body, auth) {
    const language = auth.current.user.language;
    try {
      let users = body.input('users');
      // parse string to json
      users = JSON.parse(users);

      // define array createUser, recoverUser, emailUsed
      const createdUserIds = [];
      const recoveryUserIds = [];
      const emailUsed = [];

      for (let i = 0; i < users.length; i++) {

        const roles = users[i].roles ? users[i].roles : JSON.stringify(['client']);
        const params = {
          // user params
          username: users[i].username ? users[i].username : null,
          email: users[i].email,
          roles: typeof(roles) === 'string' ? roles : JSON.stringify(roles),
          language: users[i].language ? users[i].language : 'no',
          password: users[i].password  ? users[i].password : false,
          mobile_phone: users[i].mobile_phone ? users[i].mobile_phone : null,
          settings: users[i].settings ? users[i].settings : null,

          // profile params
          city: users[i].city ? users[i].city : null,
          job_title: users[i].job_title ? users[i].job_title : null,
          birth_date: users[i].birth_date ? users[i].birth_date : null,
          gender: users[i].gender ? users[i].gender : null,
          picture: users[i].picture ? users[i].picture : null,
          company: users[i].company ? users[i].company : null,
          name: users[i].name ? users[i].name : null,
          address: users[i].address ? users[i].address : null,
          postal_code: users[i].postal_code ? users[i].postal_code : null,
          city: users[i].city ? users[i].city : null,
          state: users[i].state ? users[i].state : null,
          country: users[i].country ? users[i].country : null,
          biography: users[i].biography ? users[i].biography : null,
          user: auth.current.user
        }

        const user = await this.onCreate(params);

        if (user.is_recovered === 1) {
          recoveryUserIds.push(user.data.id);
        } else if (user.is_email_used === 1) {
          emailUsed.push(user.data);
        } else {
          createdUserIds.push(user.data.id);
        }
      }
      const createdUser = await User.query().whereIn('id', createdUserIds).with('createdBy').fetch();
      const recoveryUser = await User.query().whereIn('id', recoveryUserIds).with('createdBy').fetch();

      const data = {
        createdUsers: createdUser,
        recoveryUsers: recoveryUser,
        emailUsed: emailUsed,
      }

      const message = createdUserIds.length + ' ' + __('User has been created', language) + ', ' + recoveryUserIds.length + ' ' + __('User has been recovered from trash', language);

      return new Response({
        message: message,
        data: data
      });
    } catch (e) {
      Logger.transport('file').error('UserService.createBulk: ', e)
      return new Response({
        message: __('Cant create bulk user, please contact support', language)
      }, 422)
    }
  }

  async updateBulk(body, auth) {
    const language = auth.current.user.language;
    try {
      const updatedUserIds = [];

      const userParams = body.all();
      userParams.user = auth.current.user;

      const userIds = JSON.parse(body.input('user_ids'));

      for (let i = 0; i < userIds.length; i++) {
        userParams.id = userIds[i];
        const user = await this.onUpdate(userParams);

        if (user.status === 200) {
          updatedUserIds.push(user.data.id);
        }
      }

      const updatedUser = await User.query().whereIn('id', updatedUserIds).with('createdBy').fetch();
      const message = updatedUserIds.length + ' ' + __('User has been updated', language);

      return new Response({
        message: message,
        data: updatedUser
      });
    } catch (e) {
      Logger.transport('file').error('UserService.updateBulk: ', e);
      return new Response({
        message: __('Cant update bulk user, please contact support', language)
      }, 422);
    }
  }

  /**
   * Delete bulk data user
   **/
  async deleteBulk(body, auth) {
    const language = auth.current.user.language;
    const trx = await Database.beginTransaction();
    try {
      let user_ids = body.input('ids');
      user_ids = JSON.parse(user_ids);
      const deletedUser = [];

      for (let i = 0; i < user_ids.length; i++) {
        const user = await User.find(user_ids[i]);
        if (user) {
          const profile = await Profile.findBy("user_id", user.id);
          await profile.delete(trx);
          await user.delete(trx);
          deletedUser.push(user_ids[i]);
        }
      }

      await trx.commit(trx);
      return new Response({
        message: deletedUser.length + ' ' + __('User has been deleted', language)
      });
    } catch (e) {
      await trx.rollback(trx);

      Logger.transport('file').error('UserService.delete: ', e);
      return new Response({
        message: __('Cant delete user, please contact support', language)
      }, 422);
    }
  }

  async onCreate(params) {
    const createBy = params.user;
    const lang = createBy.language;
    const data = {
      message: '',
      data: null,
      status: 422,
      is_recovered: 0,
      is_email_used: 0
    };

    const trx = await Database.beginTransaction();
    try {
      // user params
      let username = params.username;
      const email = params.email;
      const mobile_phone = params.mobile_phone;
      const is_allow_notify = params.is_allow_notify;
      const language = params.language;
      const roles = params.roles;
      const password = params.password;
      const settings = params.settings;

      // profile params
      const name = params.name;
      const address = params.address;
      const city = params.city;
      const state = params.state;
      const country = params.country;
      const postal_code = params.postal_code;
      const job_title = params.job_title;
      const birth_date = params.birth_date;
      const gender = params.gender;
      const picture = params.picture;
      const company = params.company;
      const biography = params.biography;

      // find user base on email
      let user = await User.query().where('email', email).withTrashed(true).first();

      // conditions if a user has been found
      if (user) {
        // conditins if user has been deleted
        if (user.deleted_at) {
          // recover user account from trash
          user.deleted_at = null;
          user.is_verified = 1;
          user.settings = settings;
          let newPassword = 'PRO_APP';
          if (password) newPassword = password;
          user.password = await Hash.make(newPassword);
          await user.save(trx);

          data.message = __('User has been restored', lang);
          data.is_recovered = 1;
        } else {
          await trx.rollback(trx);

          data.message = __('Email has been used, please try with another email', lang);
          data.data = user;
          data.is_email_used = 1;

          return data;
        }

        // conditions if a user not found
      } else {
        // define new class user
        user = new User();

        if (!username) {
          username = email.split('@')[0];
          const totalUsername = await User.query().where('username', 'like', '%' + username + '%').count('* as total');
          if (totalUsername[0].total > 0) {
            const total  = totalUsername[0].total;
            username = username + total;
          }
        }

        // find user base on username
        const checkUsername = await User.query().where('username', username).withTrashed(true).first();

        // conditions if username has been used with another user
        if (checkUsername) {
          await trx.rollback(trx);
          data.message =  __('Username has been used, please try with another username', lang);
          return data;
        }

        user.username = username;
        user.is_allow_notify = is_allow_notify;
        user.email = email;
        user.language = language ? language : 'no';
        user.is_verified = true;
        user.roles = roles ? roles : JSON.stringify(['client']);
        user.password = password ? password : 'PRO_APP';
        user.created_by_id = createBy.id;
        user.mobile_phone = mobile_phone;
        await user.save(trx);

        data.message = __('User has been created', lang);
      }

      let profile = await Profile.query().where('user_id', user.id).withTrashed(true).first();
      if (!profile) profile = new Profile();
      profile.user_id = user.id;
      profile.name = name ? name : username;
      profile.address = address;
      profile.city = city;
      profile.state = state;
      profile.country = country;
      profile.postal_code = postal_code;
      profile.job_title = job_title;
      profile.gender = gender;
      profile.deleted_at = null;
      profile.picture = picture;
      profile.company = company;
      profile.biography = biography;

      if (birth_date) {
        const newBirthDate = new Date(birth_date);
        profile.birth_date = moment(newBirthDate).format('YYYY-MM-DD');
      }
      await profile.save(trx);

      await trx.commit(trx);
      // get new user
      const newUser = await User.query().where('id', user.id).with('createdBy').first();

      data.status = 200;
      data.data = newUser;
      return data;
    } catch (e) {
      await trx.rollback(trx);
      Logger.transport('file').error('UserService.onCreate: ', e);
      data.message = __('Cant create user, please contact support', lang);
      return data;
    }
  }

  async onUpdate(params) {
    const createBy = params.user;
    const lang = createBy.language;
    const data = {
      message: '',
      data: null,
      status: 422
    };

    const trx = await Database.beginTransaction();
    try {
      // define variable user
      const id = params.id;
      const username = params.username;
      const email = params.email;
      const is_allow_notify = params.is_allow_notify;
      const language = params.language;
      const roles = params.roles;
      const is_verified = params.is_verified;
      const is_active = params.is_active;
      const mobile_phone = params.mobile_phone;
      const settings = params.settings;
      const is_approved = params.is_approved;

      // profile params
      const name = params.name;
      const address = params.address;
      const city = params.city;
      const state = params.state;
      const country = params.country;
      const postal_code = params.postal_code;
      const job_title = params.job_title;
      const birth_date = params.birth_date;
      const gender = params.gender;
      const picture = params.picture;
      const company = params.company;
      const biography = params.biography;

      // find user by id
      const user = await User.find(id);
      // send message if user not found
      if (!user) {
        await trx.rollback(trx);
        data.message = __('User not found', lang);
        data.status = 404;
        return data;
      }

      if (email) {
        const checkEmail = await User.query().where('email', email).whereNot('id', user.id).first();
        if (checkEmail) {
          await trx.rollback(trx);
          data.message = __('Email has been used', lang);
          return data;
        }

        user.email = email;
      }

      if (username) {
        const checkUsername = await User.query().where('username', username).whereNot('id', user.id).first();
        if (checkUsername) {
          await trx.rollback(trx);
          data.message = __('Username has been used', lang);
          return data;
        }

        user.username = username;
      }
      if (roles) user.roles = roles;
      if (settings) user.settings = settings;
      if (!isUndefined(is_allow_notify)) user.is_allow_notify = is_allow_notify;
      if (language) user.language = language;
      if (!isUndefined(is_verified)) user.is_verified = is_verified;
      if (!isUndefined(is_active)) user.is_active = is_active;
      if (!isUndefined(mobile_phone)) user.mobile_phone = mobile_phone;
      if (!isUndefined(is_approved)) user.is_approved = is_approved;
      await user.save(trx);

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
      if (!isUndefined(job_title)) profile.job_title = job_title;
      if (!isUndefined(biography)) profile.biography = biography;
      if (company) profile.company = company;
      if (gender) profile.gender = gender;
      if (picture) profile.picture = picture;
      if (birth_date) {
        const newBirthDate = new Date(birth_date);
        profile.birth_date = moment(newBirthDate).format('YYYY-MM-DD');
      }
      await profile.save(trx);

      await trx.commit(trx);

      const updatedUser = await User.query().where('id', user.id).with('createdBy').first();

      data.message = __('User has been updated', lang);
      data.data = updatedUser;
      data.status = 200;

      return data;
    } catch (e) {
      await trx.rollback(trx);

      Logger.transport('file').error('UserService.onUpdate: ', e);
      data.message = __('Cant update user, please contact support', lang);
      return data;
    }
  }

  /**
   * Export Excel
   */
  async exportToExcel(body, response) {
    try {
      const ss = new SpreadSheet(response, 'xlsx')

      const {
        role,
        order_by,
        sort_by,
        keyword
      } = body.all();

      let users = User.query()
        .select(['users.*'])
        .leftJoin('profiles', 'profiles.user_id', 'users.id');

      if (role) users = users.where('users.roles', 'like', '%' + role + '%');

      if (keyword) {
        users = users.where(function () {
            this.where('users.email', 'like', '%' + keyword + '%')
            this.orWhere('users.username', 'like', '%' + keyword + '%')
            this.orWhere('profiles.name', 'like', '%' + keyword + '%')
            this.orWhere('profiles.address', 'like', '%' + keyword + '%')
            this.orWhere('profiles.city', 'like', '%' + keyword + '%')
            this.orWhere('profiles.state', 'like', '%' + keyword + '%')
            this.orWhere('profiles.country', 'like', '%' + keyword + '%')
            this.orWhere('profiles.job_title', 'like', '%' + keyword + '%')
            this.orWhere('profiles.gender', 'like', '%' + keyword + '%')
            this.orWhere('profiles.biography', 'like', '%' + keyword + '%')
          })
        }

      if (order_by && sort_by) {
        users = users.orderBy(order_by, sort_by);
      } else {
        users = users.orderBy('users.created_at', 'asc');
      }

      users = await users.with('createdBy').fetch();

      const data = []

      data.push([
        'No',
        'Name',
        'Username',
        'Email',
        'Roles',
        'Phone Number',
        'Created By',
      ])

      const arr = users.toJSON()
      for (let i = 0; i < arr.length; i++) {
        data.push([
          i+1,
          arr[i].profile ? arr[i].profile.name : '',
          arr[i].username,
          arr[i].email,
          arr[i].roles,
          arr[i].mobile_phone ? arr[i].mobile_phone : '',
          arr[i].createdBy && arr[i].createdBy.profile ? arr[i].createdBy.profile.name : '',
        ])
      }

      ss.addSheet('users', data)
      return ss
    } catch (e) {
      Logger.transport("file").error("UserService.exportToExcel: ", e);
      return null;
    }
  }

  /**
   * Export Docx
   */
  async exportToDocx(body) {
    try {
      const { Document, Packer, Paragraph } = docx;

      const {
        role,
        order_by,
        sort_by,
        keyword
      } = body.all();

      let users = User.query()
        .select(['users.*'])
        .leftJoin('profiles', 'profiles.user_id', 'users.id');

      if (role) users = users.where('users.roles', 'like', '%' + role + '%');

      if (keyword) {
        users = users.where(function () {
            this.where('users.email', 'like', '%' + keyword + '%')
            this.orWhere('users.username', 'like', '%' + keyword + '%')
            this.orWhere('profiles.display_name', 'like', '%' + keyword + '%')
            this.orWhere('profiles.first_name', 'like', '%' + keyword + '%')
            this.orWhere('profiles.last_name', 'like', '%' + keyword + '%')
            this.orWhere('profiles.address', 'like', '%' + keyword + '%')
            this.orWhere('profiles.city', 'like', '%' + keyword + '%')
            this.orWhere('profiles.state', 'like', '%' + keyword + '%')
            this.orWhere('profiles.country', 'like', '%' + keyword + '%')
            this.orWhere('profiles.job_title', 'like', '%' + keyword + '%')
            this.orWhere('profiles.gender', 'like', '%' + keyword + '%')
            this.orWhere('profiles.biography', 'like', '%' + keyword + '%')
          })
        }

      if (order_by && sort_by) {
        users = users.orderBy(order_by, sort_by);
      } else {
        users = users.orderBy('users.created_at', 'asc');
      }

      users = await users.with('createdBy').fetch();
      const arr = users.toJSON();

      const doc = new Document({
        creator: "Pro",
        description: "Export from Pro"
      });

      const data = [];
      for(let i=0; i<arr.length; i++) {
        const name = arr[i].profile && arr[i].profile.name ? arr[i].profile.name : '-';
        const mobile_phone = arr[i].profile && arr[i].profile.mobile_phone ? arr[i].profile.mobile_phone : '-';
        const createdBy = arr[i].createdBy && arr[i].createdBy.profile ? arr[i].createdBy.profile.name : '-';

        data.push(
          new Paragraph({
            text: 'Name\t\t: ' + name
          }),
          new Paragraph({
            text: 'Username\t: ' + arr[i].username
          }),
          new Paragraph({
            text: 'Email\t\t: ' + arr[i].email
          }),
          new Paragraph({
            text: 'Roles\t\t: ' + arr[i].roles
          }),
          new Paragraph({
            text: 'Mobile Phone\t: ' + mobile_phone
          }),
          new Paragraph({
            text: 'Created By\t: ' + createdBy
          }),
          new Paragraph({
            text: ''
          }),
        )
      }

      doc.addSection({
        properties: {},
        children: data,
      });

      const b64string = await Packer.toBase64String(doc);
      return b64string;
    } catch (e) {
      Logger.transport("file").error("UserService.exportToDocx: ", e);
      return null;
    }
  }

  /**
   * Banned user
   */
  async bannedUser(id, auth) {
    const language = auth.current.user.language;
    try {
      const user = await User.query().where('id', id).first();

      if (!user) return new Response({message: __('User not found', language)}, 404);

      const banned = user.is_banned ? false : true;
      let message = __('User has been banned', language);
      if (!banned) message = __('User has been unbanned', language);

      user.is_banned = banned;
      await user.save();

      const updatedUser = await User.query()
        .where('id', id)
        .with('createdBy')
        .first();

      return new Response({
        message: message,
        data: updatedUser
      });
    } catch (e) {
      Logger.transport('file').error('UserService.bannedUser: ', e);
      return new Response({
        message: __('Cant banned user, please contact support', language)
      }, 422);
    }
  }

  /**
   * Force update password
   **/
  async forceUpdatePassword(body, id, auth) {
    const language = auth.current.user.language;
    try {
      const password = body.input('password');

      const user = await User.query().where('id', id).first();
      if (!user) return new Response({message: __('User not found', language)}, 404);

      user.password = await Hash.make(password);
      await user.save();

      return new Response({message: __('User password has been updated', language)});
    } catch (e) {
      Logger.transport('file').error('UserService.forceUpdatePassword: ', e)
      return new Response({
        message: __('Cant force update user password, please contact support', language)
      }, 422)
    }
  }
}

module.exports = new UserService();
