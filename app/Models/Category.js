'use strict';

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');
const uuid = use('uuid');

class Category extends Model {
  static boot () {
    super.boot();

    this.addTrait('@provider:Lucid/SoftDeletes');
  }

  static query () {
    return super.query().with('subCategories');
  }

  // Relations
  subCategories () {
    return this.hasMany('App/Models/Category', 'id', 'parent_id');
  }
}

module.exports = Category;
