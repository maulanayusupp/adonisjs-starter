'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const uuid = use('uuid')

class Article extends Model {
  static boot () {
    super.boot()

    this.addTrait('@provider:Lucid/SoftDeletes')

    this.addTrait('@provider:Lucid/Slugify', {
      fields: { slug: 'title' },
      strategy: 'dbIncrement',
      disableUpdates: false
    })
  }

  // Relations
  category () {
    return this.belongsTo('App/Models/Category')
  }
}

module.exports = Article
      