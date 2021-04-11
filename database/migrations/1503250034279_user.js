'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class UserSchema extends Schema {
  up () {
    this.create('users', (table) => {
      table.increments();
      table.string('username', 80).nullable().unique();
      table.string('email', 254).notNullable().unique();
      table.string('password', 60).notNullable();
      table.string('mobile_phone', 20).nullable();
      table.string('roles', 254).nullable();
      table.string('language', 10).nullable();
      table.boolean('is_verified').defaultTo(0);
      table.boolean('is_active').defaultTo(0);
      table.boolean('is_banned').defaultTo(0);
      table.boolean('is_allow_notify').defaultTo(0);
      table.boolean('is_approved').nullable().defaultTo(false);
      table.datetime('logged_in_at').nullable();
      table.datetime('logged_out_at').nullable();
      table.integer('created_by_id').nullable();
      table.text('settings').nullable();
      table.datetime('deleted_at').nullable();
      table.timestamps();
    });
  }

  down () {
    this.drop('users');
  }
}

module.exports = UserSchema;
