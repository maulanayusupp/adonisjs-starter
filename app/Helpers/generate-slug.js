'use strict'
const Logger = use('Logger');
const slugify = require('slugify');

module.exports = async (Model, name) => {
  try {
    let slug = slugify(name, {
      replacement: '-',
      remove: /[*+~.()?'"!:@]/g,
      lower: true,
      strict: false
    })

    let newSlug = slug;
    let available = false;
    let counter = 1;

    const cekSlug = await Model.query().where('slug', slug).first();
    if (cekSlug) {
      slug = slug;
      newSlug = slug + '-' + counter;
    }

    while (!available) {
      const getSlug = await Model.query().where('slug', newSlug).first();
      if (getSlug) {
        counter = counter + 1;
        newSlug = slug + '-' + counter;
      } else {
        available = true;
      }
    }

    return newSlug;
  } catch(error) {
    Logger.info('Generate Slug : ' . error);
    return null;
  }
}