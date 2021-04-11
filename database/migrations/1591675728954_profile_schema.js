'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class ProfileSchema extends Schema {
  up () {
    this.create('profiles', (table) => {
      table.increments();
      table.integer('user_id').unsigned().references('id').inTable('users');
      table.string('name', 254).nullable();
      table.string('picture', 1024).nullable();
      table.string('gender', 20).nullable();
      table.string('job_title', 254).nullable();
      table.text('address').nullable();
      table.string('city', 100).nullable();
      table.string('state', 100).nullable();
      table.string('country', 100).nullable();
      table.string('postal_code', 10).nullable();
      table.string('company', 255).nullable();
      table.date('birth_date').nullable();
      table.text('biography').nullable();
      table.datetime('deleted_at').nullable();
      table.timestamps();
    })
  }

  down () {
    this.drop('profiles');
  }
}

module.exports = ProfileSchema;
