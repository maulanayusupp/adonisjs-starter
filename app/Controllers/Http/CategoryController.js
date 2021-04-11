'use strict';

const CategoryService = use('App/Services/CategoryService');

class CategoryController {
  /**
   * Show a list of all categories.
   * GET categories
   */
  async index ({ request, response, auth }) {
    const result = await CategoryService.getAll(request, auth);
    return response.status(result.status).send(result.data);
  }

  /**
   * Create/save a new category.
   * POST categories
   */
  async store ({ request, response, auth }) {
    const result = await CategoryService.create(request, auth);
    return response.status(result.status).send(result.data);
  }

  /**
   * Display a single category.
   * GET categories/:id
   */
  async show ({ params, response, auth }) {
    const result = await CategoryService.getById(params.id, auth);
    return response.status(result.status).send(result.data);
  }

  /**
   * Display a single category.
   * GET categories/slug/:slug
   */
  async showBySlug ({ params, response, auth }) {
    const result = await CategoryService.getBySlug(params.slug, auth);
    return response.status(result.status).send(result.data);
  }

  /**
   * Update category details.
   * PUT or PATCH categories/:id
   */
  async update ({ params, request, response, auth }) {
    const result = await CategoryService.update(params.id, request, auth);
    return response.status(result.status).send(result.data);
  }

  /**
   * Delete a category with id.
   * DELETE categories
   */
  async destroy ({ params, response, auth }) {
    const result = await CategoryService.delete(params.id, auth);
    return response.status(result.status).send(result.data);
  }

  /**
   * Delete Bulk category with ids.
   * DELETE categories/bulk/delete
   */
  async deleteBulk ({ request, response, auth }) {
    const result = await CategoryService.deleteBulk(request, auth);
    return response.status(result.status).send(result.data);
  }

  /**
   * Create Bulk categories.
   * POST categories/bulk/create
   */
  async createBulk ({ request, response, auth }) {
    const result = await CategoryService.createBulk(request, auth);
    return response.status(result.status).send(result.data);
  }

  /**
   * Update Bulk categories.
   * POST categories/bulk/update
   */
  async updateBulk ({ request, response, auth }) {
    const result = await CategoryService.updateBulk(request, auth);
    return response.status(result.status).send(result.data);
  }

  /*
		Export Excel
	 */
  async exportExcel({ request, response, auth }) {
    const result = await CategoryService.exportToExcel(request, response)
    if(result){
      result.download('category-export-'+ new Date().getTime())
    }else {
      return response.status(422).send({message: 'Cant export to excel, please contact support'})
    }
  }

  /*
		Export Docx
	 */
  async exportDocx({ request, response, auth }) {
    const result = await CategoryService.exportToDocx(request);

    if(result){
      const filename = 'category-export-' + new Date().getTime() + '.docx';
      response.header('Content-Disposition', 'attachment; filename='+filename);
      return response.send(Buffer.from(result, 'base64'));
    }else {
      return response.status(422).send({message: 'Cant export to docx, please contact support'});
    }
  }

  /*
		Reorder
	 */
  async reorder({ request, response, auth }) {
    const result = await CategoryService.reorder(request, auth);
    return response.status(result.status).send(result.data);
  }
}

module.exports = CategoryController;
