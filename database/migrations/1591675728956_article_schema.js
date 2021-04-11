'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class ArticleSchema extends Schema {
  up () {
    this.create('articles', (table) => {
      table.increments();
      table.string('title', 250).notNullable();
      table.string('slug', 250).notNullable();
      table.text('content').nullable();
      table.text('excerpt').nullable();
      table.boolean('is_published').defaultTo(false);
      table.bigInteger('total_seen').defaultTo(0);
      table.string('type', 150).nullable();
      table.integer('order').defaultTo(0);
      table.integer('user_id').unsigned().references('id').inTable('users');
      table.integer('category_id').unsigned().references('id').inTable('categories');
      table.datetime('deleted_at').nullable();
      table.timestamps();
    });
  }

  down () {
    this.drop('articles');
  }
}

module.exports = ArticleSchema;
