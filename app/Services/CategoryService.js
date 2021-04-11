'use strict';

const Category = use('App/Models/Category');
const Response = use('App/Class/Response');
const Logger = use('Logger');
const Database = use('Database');
const __ = use('App/Helpers/string-localize');
const GenerateSlug = use('App/Helpers/generate-slug');
const isUndefined = require("is-undefined");
const SpreadSheet = use('SpreadSheet');
const docx = require('docx');

class CategoryService {
  /**
   * Function get data category
  **/
  async getAll(body, auth) {
    const lang = auth.current.user.language;
    try {
      const {
        page,
        limit,
        type,
        order_by,
        sort_by,
        keyword,
        parent_id
      } = body.all();

      // Define variable categories is a query from table categories
      let categories = Category.query();

      // if frontend send variable type, then add condition for filter data base on field type
      if (type) categories = categories.where('type', type);

      if (parent_id) {
        categories = categories.where('parent_id', parent_id);
      } else {
        categories = categories.whereNull('parent_id');
      }
      if (keyword) categories = categories.where('name', 'like', '%' + keyword + '%');
      // if frontend send variable order_by and sort_by
      if (order_by && sort_by) {
        // add condition for filter orderBy and sortBy table base on order_by and sort_by from frontend
        categories = categories.orderBy(order_by, sort_by);
      } else { // condition if user not send variable order_by and sort_by, then use default query
        categories = categories.orderBy('name', 'ASC');
      }

      // Get data from database with pagination
      categories = await categories.paginate(page, limit);

      return new Response(categories);
    } catch (e) {
      Logger.transport('file').error('CategoryService.getAll: ', e);
      return new Response({
        message: __('Cant get data categories, please contact support', lang)
      }, 422);
    }
  }

  /**
   * Function get detail data category base on id
  **/
  async getById(id, auth) {
    const lang = auth.current.user.language;
    try {
      // get data category from table categories base on id
      const category = await Category.query().where('id', id).first();

      return new Response({
        data: category
      });
    } catch (e) {
      Logger.transport('file').error('CategoryService.getById: ', e);
      return new Response({
        message: __('Cant get detail category, please contact support', lang)
      }, 422);
    }
  }

  /**
   * Function get detail data category base on slug
  **/
  async getBySlug(slug, auth) {
    const lang = auth.current.user.language;
    try {
      // get data category from table categories base on slug
      const category = await Category.query().where('slug', slug).first();

      return new Response({
        data: category
      });
    } catch (e) {
      Logger.transport('file').error('CategoryService.getBySlug: ', e);
      return new Response({
        message: __('Cant get detail category, please contact support', lang)
      }, 422);
    }
  }

  /**
   * Function create category
  **/
  async create(body, auth) {
    const lang = auth.current.user.language;
    try {
      const { name, type, parent_id, icon, background_color, description, order } = body.all();

      // create new category
      const category = new Category();
      category.name = name;
      category.slug = await GenerateSlug(Category, name);
      category.type = type;
      category.parent_id = parent_id;
      category.icon = icon;
      category.background_color = background_color;
      category.description = description;
      category.order = order;
      await category.save();

      // get new data category
      const createdCategory =  await Category.query().where('id', category.id).first();

      return new Response({
        message: __('New Category has been created', lang),
        data: createdCategory
      });
    } catch (e) {
      Logger.transport('file').error('CategoryService.create: ', e);
      return new Response({
        message: __('Cant create category, please contact support', lang)
      }, 422);
    }
  }

  /**
   * Function create category
   * @param String id, name, type, parent_id, icon, background_color, description
   * @return Object|Response
  **/
  async update(id, body, auth) {
    const lang = auth.current.user.language;
    try {
      const {
        name,
        type,
        parent_id,
        icon,
        background_color,
        description,
        order
      } = body.all();

      const category = await Category.find(id); // get data category base on id

      // if category not exist, then send error message
      if (!category) return new Response({
        message: __('Category not found', lang)
      }, 404);

      // check new value, if value not null/empty change value from database with new value
      if (name) {
        category.name = name;
        category.slug = await GenerateSlug(Category, name);
      }
      if (!isUndefined(type)) category.type = type;
      if (!isUndefined(parent_id)) category.parent_id = parent_id;
      if (!isUndefined(icon)) category.icon = icon;
      if (!isUndefined(background_color)) category.background_color = background_color;
      if (!isUndefined(description)) category.description = description;
      if (!isUndefined(order)) category.order = order;
      await category.save();

      // get new data category base on id after updated successfully
      const updatedCategory =  await Category.query().where('id', category.id).first();

      return new Response({
        message: __('Category has been updated', lang),
        data: updatedCategory
      });
    } catch (e) {
      Logger.transport('file').error('CategoryService.create: ', e);
      return new Response({
        message: __('Cant update category, please contact support', lang)
      }, 422);
    }
  }

  /**
   * Function bulk delete category
  **/
  async deleteBulk(body, auth) {
    const lang = auth.current.user.language;
    // begin transaction
    const trx = await Database.beginTransaction();
    try {
      let categoryIds = body.input('ids'); // insert value articleIds to new variable
      categoryIds = JSON.parse(categoryIds); // convert to json

      // delete all sub category
      await Category.query().whereIn('parent_id', categoryIds).delete(trx);

      // delete category
      await Category.query().whereIn('id', categoryIds).delete(trx);

      await trx.commit(trx);
      return new Response({
        message: __('Category has been deleted', lang)
      });
    } catch (e) {
      await trx.rollback(trx);

      Logger.transport('file').error('CategoryService.delete: ', e);
      return new Response({
        message: __('Cant delete category, please contact support', lang)
      }, 422);
    }
  }

  /**
   * Function delete category
  **/
  async delete(id, auth) {
    const lang = auth.current.user.language;
    try {
      // delete all sub category
      await Category.query().where('parent_id', id).delete();

      await Category.query().where('id', id).delete();

      return new Response({
        message: __('Category has been deleted', lang)
      });
    } catch (e) {
      Logger.transport('file').error('CategoryService.delete: ', e);
      return new Response({
        message: __('Cant delete category, please contact support', lang)
      }, 422);
    }
  }

  /**
   * Function create bulk category
  **/
  async createBulk(body, auth) {
    const lang = auth.current.user.language;
    try {
      let categories = body.input('categories');
      categories = JSON.parse(categories);
      const createdCategoryIds = [];

      for (let i = 0; i < categories.length; i++) {
        const category = new Category();
        category.name = categories[i].name;
        category.slug = await GenerateSlug(Category, categories[i].name);
        category.type = categories[i].type;
        category.description = categories[i].description;
        category.background_color = categories[i].background_color;
        category.parent_id = categories[i].parent_id;
        category.order = categories[i].order;
        await category.save();

        createdCategoryIds.push(category.id);
      }

      const createdCategories = await Category.query().whereIn('id', createdCategoryIds).fetch();
      return new Response({
        message: createdCategoryIds.length + ' ' + __('Category has been created', lang),
        data: createdCategories
      });
    } catch (e) {
      Logger.transport('file').error('CategoryService.createBulk: ', e);
      return new Response({
        message: __('Cant create bulk category, please contact support', lang)
      }, 422);
    }
  }

  /**
   * Function update bulk category
  **/
  async updateBulk(body, auth) {
    const lang = auth.current.user.language;
    try {
      const {
        name,
        type,
        parent_id,
        background_color,
        description,
        order
      } = body.all();

      let categoryIds = body.input('ids');
      categoryIds = JSON.parse(categoryIds);
      const updatedCategoryIds = [];

      for (let i = 0; i < categoryIds.length; i++) {
        const category = await Category.find(categoryIds[i]);

        if (category) {
          if (name) {
            category.name = name;
            category.slug = await GenerateSlug(Category, name);
          }
          if (!isUndefined(type)) category.type = type;
          if (!isUndefined(background_color)) category.background_color = background_color;
          if (!isUndefined(description)) category.description = description;
          if (!isUndefined(parent_id)) category.parent_id = parent_id;
          if (!isUndefined(order)) category.order = order;
          await category.save();

          updatedCategoryIds.push(category.id);
        }
      }

      const updatedCategories = await Category.query().whereIn('id', updatedCategoryIds).fetch();
      return new Response({
        message: updatedCategoryIds.length + ' ' + __('Category has been updated', lang),
        data: updatedCategories
      });
    } catch (e) {
      Logger.transport('file').error('CategoryService.updateBulk: ', e);
      return new Response({
        message: __('Cant update bulk category, please contact support', lang)
      }, 422);
    }
  }

  /**
   * Export Excel
   */
  async exportToExcel(body, response) {
    try {
      const ss = new SpreadSheet(response, 'xlsx')

      const {
        type,
        order_by,
        sort_by,
        keyword,
        parent_id,
      } = body.all();

      // Define variable categories is a query from table categories
      let categories = Category.query();

      // if frontend send variable type, then add condition for filter data base on field type
      if (type) categories = categories.where('type', type);

      if (parent_id) {
        categories = categories.where('parent_id', parent_id);
      } else {
        categories = categories.whereNull('parent_id');
      }
      if (keyword) categories = categories.where('name', 'like', '%' + keyword + '%');
      // if frontend send variable order_by and sort_by
      if (order_by && sort_by) {
        // add condition for filter orderBy and sortBy table base on order_by and sort_by from frontend
        categories = categories.orderBy(order_by, sort_by);
      } else { // condition if user not send variable order_by and sort_by, then use default query
        categories = categories.orderBy('name', 'ASC');
      }

      // Get data from database with pagination
      categories = await categories.fetch();

      const data = []

      data.push([
        'No',
        'Category',
        'Sub Category',
        'Description',
        'Type',
        'Tcon'
      ])

      const arr = categories.toJSON()
      for (let i = 0; i < arr.length; i++) {
        data.push([
          i+1,
          arr[i].name,
          '',
          arr[i].description,
          arr[i].type,
          arr[i].icon
        ])

        const subCategories = arr[i].subCategories;
        for (let j=0; j<subCategories.length; j++) {
          data.push([
            '',
            '',
            subCategories[j].name,
            subCategories[j].description,
            subCategories[j].type,
            subCategories[j].icon
          ])
        }
      }

      ss.addSheet('Categories', data)
      return ss
    } catch (e) {
      Logger.transport("file").error("CategoryService.exportToExcel: ", e);
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
        type,
        order_by,
        sort_by,
        keyword,
        parent_id,
      } = body.all();

      // Define variable categories is a query from table categories
      let categories = Category.query();

      // if frontend send variable type, then add condition for filter data base on field type
      if (type) categories = categories.where('type', type);

      if (parent_id) {
        categories = categories.where('parent_id', parent_id);
      } else {
        categories = categories.whereNull('parent_id');
      }
      if (keyword) categories = categories.where('name', 'like', '%' + keyword + '%');
      // if frontend send variable order_by and sort_by
      if (order_by && sort_by) {
        // add condition for filter orderBy and sortBy table base on order_by and sort_by from frontend
        categories = categories.orderBy(order_by, sort_by);
      } else { // condition if user not send variable order_by and sort_by, then use default query
        categories = categories.orderBy('name', 'ASC');
      }

      // Get data from database with pagination
      categories = await categories.fetch();
      const arr = categories.toJSON();

      const doc = new Document({
        creator: "Seeking",
        description: "Export from Seeking"
      });

      const data = [];
      for(let i=0; i<arr.length; i++) {
        data.push(
          new Paragraph({
            text: 'Name\t\t: ' + arr[i].name
          }),
          new Paragraph({
            text: 'Type\t\t: ' + arr[i].type
          }),
          new Paragraph({
            text: 'icon\t\t: ' + arr[i].icon
          }),
          new Paragraph({
            text: 'Description\t: ' + arr[i].description
          }),
          new Paragraph({
            text: 'Sub Category\t:'
          }),
          new Paragraph({
            text: ''
          }),
        )

        for (let j=0; j<arr.length; j++) {
          data.push(
            new Paragraph({
              text: '\t\tName\t\t: ' + arr[i].name
            }),
            new Paragraph({
              text: '\t\tType\t\t: ' + arr[i].type
            }),
            new Paragraph({
              text: '\t\ticon\t\t: ' + arr[i].icon
            }),
            new Paragraph({
              text: '\t\tDescription\t: ' + arr[i].description
            }),
            new Paragraph({
              text: ''
            }),
          )
        }
      }

      doc.addSection({
        properties: {},
        children: data,
      });

      const b64string = await Packer.toBase64String(doc);
      return b64string;

    } catch (e) {
      Logger.transport("file").error("CategoryService.exportToDocx: ", e);
      return null;
    }
  }

  /*
    Reorder
   */
  async reorder(body, auth) {
    const lang = auth.current.user.language;
    try {
      let categories = body.input('categories');
      categories = JSON.parse(categories);

      let order = 0;
      const ids = [];
      for(let i=0; i<categories.length; i++) {
        order = order + 1;
        const category = await Category.query().where('id', categories[i].id).first();
        category.order = order;
        await category.save();

        let subOrder = 0;
        const subCategories = categories[i].subCategories;
        for(let j=0; j<subCategories.length; j++) {
          subOrder = subOrder + 1;
          const subCategory = await Category.query().where('id', subCategories[j].id).first();
          subCategory.order = subOrder;
          await subCategory.save();
        }

        ids.push(categories[i].id);
      }

      const data = await Category.query().whereIn('id', ids).orderBy('order', 'asc').fetch();

      return new Response({message: __('Reorder has been successfully', lang), data: data});
    } catch (e) {
      Logger.transport("file").error("CategoryService.reorder: ", e);
      return new Response({ message: __("Cant reorder category, please contact support", lang) }, 422);
    }
  }
}

module.exports = new CategoryService();
