'use strict'

/*
|--------------------------------------------------------------------------
| UserSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')
const User = use("App/Models/User");
const Profile = use("App/Models/Profile");

class UserSeeder {
  async run () {
    // super admin
    const user1 = new User();
    user1.username = "maulana";
    user1.email = "maulanayusupp@gmail.com";
    user1.password = "asdfasdf";
    user1.mobile_phone = '6287822766333';
    user1.roles = JSON.stringify(['super_admin', 'client']);
    user1.is_verified = true;
    user1.is_active = true;
    user1.is_allow_notify = true;
    user1.language = 'en';
    await user1.save();

    const profile1 = new Profile();
    profile1.name = 'Maulana';
    profile1.address = 'Wangsa Niaga Kulon No 27';
    profile1.city = 'Padalarang';
    profile1.state = 'Jawa Barat';
    profile1.country = 'Indonesia';
    profile1.job_title = 'Dev Ops';
    profile1.birth_date = '1991-12-24';
    profile1.gender = 'male';
    profile1.user_id = user1.id;
    await profile1.save();
  }
}

module.exports = UserSeeder
