'use strict'

const ArticleService = use('App/Services/ArticleService');
const HelperService = use('App/Services/HelperService');

class ArticleController {
  /**
   * Show a list of all articles.
   * GET articles
   */
  async index ({ request, response, auth }) {
    const result = await ArticleService.getAll(request, auth);
    return response.status(result.status).send(result.data);
  }

  /**
   * Create/save a new company.
   * POST articles
   */
  async store ({ request, response, auth }) {
    await HelperService.validate(request, {
      title: 'required'
    });

    const result = await ArticleService.create(request, auth);
    return response.status(result.status).send(result.data);
  }

  /**
   * Display a single company.
   * GET articles/:id
   */
  async show ({ params, response, auth }) {
    const result = await ArticleService.getById(params.id, auth);
    return response.status(result.status).send(result.data);
  }

  /**
   * Display a single company.
   * GET articles/slug/:slug
   */
  async showBySlug ({ params, response, auth }) {
    const result = await ArticleService.getBySlug(params.slug, auth);
    return response.status(result.status).send(result.data);
  }

  /**
   * Update company details.
   * PUT or PATCH articles/:id
   */
  async update ({ params, request, response, auth }) {
    const result = await ArticleService.update(params.id, request, auth);
    return response.status(result.status).send(result.data);
  }

  /**
   * Delete a company with id.
   * DELETE articles/:id
   */
  async destroy ({ params, response, auth }) {
    const result = await ArticleService.delete(params.id, auth);
    return response.status(result.status).send(result.data);
  }

  /**
   * Delete Bulk category with ids.
   * DELETE articles/bulk/delete
   */
  async deleteBulk ({ request, response, auth }) {
    const result = await ArticleService.deleteBulk(request, auth);
    return response.status(result.status).send(result.data);
  }

  /**
   * Create Bulk articles.
   * POST articles/bulk/create
   */
  async createBulk ({ request, response, auth }) {
    const result = await ArticleService.createBulk(request, auth);
    return response.status(result.status).send(result.data);
  }

  /**
   * Update Bulk articles.
   * POST articles/bulk/update
   */
  async updateBulk ({ request, response, auth }) {
    const result = await ArticleService.updateBulk(request, auth);
    return response.status(result.status).send(result.data)
  }

  /*
		Reorder
	 */
  async reorder({ request, response, auth }) {
    const result = await ArticleService.reorder(request, auth);
    return response.status(result.status).send(result.data);
  }
}

module.exports = ArticleController
