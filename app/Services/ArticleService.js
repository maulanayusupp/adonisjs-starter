'use strict'
const Article = use('App/Models/Article');
const Category = use('App/Models/Category');
const Response = use('App/Class/Response');
const Logger = use('Logger');
const Database = use('Database');
const isUndefined = require("is-undefined");
const __ = use('App/Helpers/string-localize');

class ArticleService {

  /**
   * Get all data from table article
  **/
  async getAll(body, auth) {
    const language = auth.current.user.language;
    try {
      const {
        page,
        limit,
        order_by,
        sort_by,
        keyword
      } = body.all();

      // get article data
      let articles = Article.query();

      if (keyword) { // for searching
        articles = articles.select(['articles.*'])
          .leftJoin('categories', 'categories.id', 'articles.category_id')
          .where(function () {
            this.where('articles.title', 'like', '%' + keyword + '%')
              .orWhere('articles.excerpt', 'like', '%' + keyword + '%')
              .orWhere('categories.name', 'like', '%' + keyword + '%')
          })
          .orderBy('articles.title', 'ASC');

      } else {
        if (order_by && sort_by) {
          articles = articles.orderBy(order_by, sort_by);
        } else {
          articles = articles.orderBy('created_at', 'DESC');
        }
      }

      articles = await articles.with('category').paginate(page, limit);
      return new Response({
        data: articles
      });
    } catch (e) {
      Logger.transport('file').error('ArticleService.getAll: ', e);
      return new Response({
        message: __('Cant get data articles, please contact support', language)
      }, 422);
    }
  }

  /**
   * Get detail data article from table article
  **/
  async getById(id, auth) {
    const language = auth.current.user.language;
    try {
      // get data article by ID
      const article = await Article.query().where('id', id).with('category').first();

      if (!article) return new Response({
        message: __('Article not found', language)
      }, 422);

      return new Response({
        data: article
      });
    } catch (e) {
      Logger.transport('file').error('ArticleService.getById: ', e);
      return new Response({
        message: __('Cant get detail article, please contact support', language)
      }, 422);
    }
  }

  /**
   * Get detail data article from table article
  **/
  async getBySlug(slug, auth) {
    const language = auth.current.user.language;
    try {
      // Get data article by slug
      const article = await Article.query().where('slug', slug).with('category').first();
      
      if (!article) return new Response({message: __('Article not found', language)}, 422);

      // count total views
      article.total_seen = article.total_seen + 1;
      await article.save();

      return new Response({
        data: article
      });
    } catch (e) {
      Logger.transport('file').error('ArticleService.getBySlug: ', e);
      return new Response({
        message: __('Cant get detail article, please contact support', language)
      }, 422);
    }
  }

  /**
   * Post article
  **/
  async create(body, auth) {
    const language = auth.current.user.language;
    try {
      const {
        title,
        content,
        excerpt,
        is_published,
        type,
        category_id
      } = body.all();

      // get total index
      const countOrder = await Article.query().where('type', type).count('* as total');

      if (category_id) {
        const category = await Category.find(category_id);
        if (!category) return new Response({
          message: __('Cant create article, please select category', language)
        }, 422);
      }

      // create new article
      const article = new Article();
      article.title = title;
      article.content = content;
      article.excerpt = excerpt;
      article.is_published = is_published;
      article.total_seen = 0;
      article.type = type;
      article.order = countOrder[0].total ? countOrder[0].total + 1 : 0;
      article.user_id = auth.current.user.id;
      article.category_id = category_id;

      await article.save();

      // get new data article
      const createdArticle = await Article.query().where('id', article.id).with('category').first();

      return new Response({
        message: __('New article has been created', language),
        data: createdArticle
      });
    } catch (e) {
      Logger.transport('file').error('ArticleService.create: ', e);
      return new Response({
        message: __('Cant create article, please contact support', language)
      }, 422);
    }
  }

  /**
   * Update article
  **/
  async update(id, body, auth) {
    const language = auth.current.user.language;
    try {
      const {
        title,
        content,
        excerpt,
        is_published,
        type,
        category_id
      } = body.all();

      const article = await Article.find(id); // find article by id
      // if article not exist, then send error message
      if (!article) return new Response({
        message: __('Article not found', language)
      }, 422);

      if (category_id) { // if category_id not null/empty
        const category = await Category.find(category_id); // get data category
        // check if category not exist
        if (!category) return new Response({
          message: __('Cant update article, please select category', language)
        }, 422);

        // change value category_id in database with new value
        article.category_id = category_id;
      }

      // check new value, if value not null/empty change value from database with new value
      if (title) article.title = title;
      if (content) article.content = content;
      if (excerpt) article.excerpt = excerpt;
      if (!isUndefined(is_published)) article.is_published = is_published;
      if (type) article.type = type;

      await article.save(); // save article data

      // get new data article
      const updatedArticle = await Article.query().where('id', article.id).with('category').first();

      return new Response({
        message: __('Article has been updated', language),
        data: updatedArticle
      });
    } catch (e) {
      Logger.transport('file').error('ArticleService.update: ', e);
      return new Response({
        message: __('Cant update article, please contact support', language)
      }, 422);
    }
  }

  /**
   * Function delete article
  **/
  async delete(id, auth) {
    const lang = auth.current.user.language;
    try {
      await Article.query().where('id', id).delete();

      return new Response({
        message: __('Article has been deleted', lang)
      });
    } catch (e) {
      Logger.transport('file').error('ArticleService.delete: ', e);
      return new Response({
        message: __('Cant delete article, please contact support', lang)
      }, 422);
    }
  }

  /**
   * Delete bulk article
  **/
  async deleteBulk(body, auth) {
    const language = auth.current.user.language;
    // Begin transaction
    const trx = await Database.beginTransaction();
    try {
      let articleIds = body.input('ids'); // insert value articleIds to new variable
      articleIds = JSON.parse(articleIds); // convert to json
      const deletedArticles = [];

      // looping for get articleIds data
      for (let i = 0; i < articleIds.length; i++) {
        const article = await Article.find(articleIds[i]); // find article by article id

        if (article) { // if article found
          deletedArticles.push(article); // push data article to array deleteArticle
          await article.delete(trx); // delete data article from DB
        }
      }

      await trx.commit(trx);

      return new Response({
        message: deletedArticles.length + ' ' + __('Article has been deleted', language),
        data: deletedArticles
      });
    } catch (e) {
      await trx.rollback(trx);

      Logger.transport('file').error('ArticleService.delete: ', e)
      return new Response({
        message: __('Cant delete article, please contact support', language)
      }, 422);
    }
  }

  /**
   * Create bulk article
  **/
  async createBulk(body, auth) {
    const language = auth.current.user.language;
    const trx = await Database.beginTransaction(); // Begin transaction
    try {
      let articles = body.input('articles'); // insert value articles to new variable
      articles = JSON.parse(articles); // convert to json data
      const createdArticleIds = [];

      // looping for get data article
      for (let i = 0; i < articles.length; i++) {
        // create new article
        const type = articles[i].type ? articles[i].type : null;

        const article = new Article();
        article.title = articles[i].title;
        article.content = articles[i].content ? articles[i].content : null;
        article.excerpt = articles[i].excerpt ? articles[i].excerpt : null;
        article.is_published = articles[i].is_published ? articles[i].is_published : false;
        article.order = articles[i].order ? articles[i].order : 0;
        article.total_seen = articles[i].total_seen ? articles[i].total_seen : 0;
        article.type = type;
        article.user_id = auth.current.user.id;

        if (articles[i].category_id) { // condition if user send category id
          const category = await Category.find(articles[i].category_id); // get category by id
          if (category) { // if category found
            article.category_id = articles[i].category_id; // insert category id to article
          }
        }

        await article.save(trx);

        // push data id to array createdArticleIds
        createdArticleIds.push(article.id);
      }

      await trx.commit(trx);

      // get new article from database base on array createdArticleIds
      const createdArticles = await Article.query().whereIn('id', createdArticleIds).fetch();

      return new Response({
        message: createdArticleIds.length + ' ' + __('Article has been created', language),
        data: createdArticles
      });
    } catch (e) {
      await trx.rollback(trx);

      Logger.transport('file').error('ArticleService.createBulk: ', e);
      return new Response({
        message: __('Cant create bulk article, please contact support', language)
      }, 422);
    }
  }

  /**
   * Update bulk article
  **/
  async updateBulk(body, auth) {
    const trx = await Database.beginTransaction(); // Begin transaction
    const language = auth.current.user.language;
    try {
      // get variable from frontend
      const {
        title,
        content,
        excerpt,
        is_published,
        category_id,
        type
      } = body.all();

      let articleIds = body.input('ids'); // insert articleIds to new variable
      articleIds = JSON.parse(articleIds); // Convert to json data
      const updatedarticleIds = [];

      // looping for data articleIds
      for (let i = 0; i < articleIds.length; i++) {
        const article = await Article.find(articleIds[i]); // find article by id

        if (article) { // if article found
          // check new value, if value not null/empty change value from database with new value
          if (title) article.title = title;
          if (content) article.content = content;
          if (excerpt) article.excerpt = excerpt;
          if (is_published) article.is_published = is_published;
          if (type) article.type = type;

          if (category_id) { // check if category send by user
            const category = await Category.find(category_id); // find category by id
            if (!category) { // category not found
              await trx.rollback(trx);
              return new Response({ message: __('Category not found', language) }, 422); // Return error message
            }

            article.category_id = category_id; // insert category_id to article
          }

          await article.save(trx);

          updatedarticleIds.push(article.id); // push article id to array updatedArticleIds
        }
      }

      await trx.commit(trx);

      // get data article base on array updatedArticleIds
      const updatedArticles = await Article.query().whereIn('id', updatedarticleIds).fetch();

      return new Response({
        message: updatedarticleIds.length + ' ' + __('Article has been updated', language),
        data: updatedArticles
      });
    } catch (e) {
      await trx.rollback(trx);

      Logger.transport('file').error('ArticleService.updateBulk: ', e);
      return new Response({
        message: __('Cant update bulk article, please contact support', language)
      }, 422);
    }
  }

  /*
    Reorder
   */
  async reorder(body, auth) {
    const lang = auth.current.user.language;
    try {
      let ids = body.input('ids');
      ids = JSON.parse(ids);

      let order = 0;
      for(let i=0; i<ids.length; i++) {
        const article = await Article.query().where('id', ids[i]).first();
        if (article) {
          order = order + 1;
          article.order = order;
          await article.save();
        }
      }

      const data = await Article.query()
        .whereIn('id', ids)
        .with('category')
        .orderBy('order', 'asc')
        .fetch();

      return new Response({message: __('Reorder has been successfully', lang), data: data});
    } catch (e) {
      Logger.transport("file").error("DisplayService.reorder: ", e);
      return new Response({ message: __("Cant reorder display, please contact support", lang) }, 422);
    }
  }
}

module.exports = new ArticleService()
