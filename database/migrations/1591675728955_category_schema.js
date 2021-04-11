'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class CategorySchema extends Schema {
  up () {
    this.create('categories', (table) => {
      table.increments();
      table.string('name', 200).notNullable();
      table.string('slug', 255).notNullable();
      table.text('description').nullable();
      table.string('type', 50).notNullable();
      table.string('icon', 254).nullable();
      table.integer('order').defaultTo(0);
      table.string('background_color', 20).nullable();
      table.integer('parent_id').unsigned().references('id').inTable('categories');
      table.datetime('deleted_at').nullable();
      table.timestamps();
    });
  }

  down () {
    this.drop('categories');
  }
}

module.exports = CategorySchema;
