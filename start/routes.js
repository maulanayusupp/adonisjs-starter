'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URLs and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

Route.get('/', () => {
  return { greeting: 'Hello world in JSON' }
})

// Auth
Route.group(() => {
	Route.post('login', 'AuthController.login');
	Route.post('login/sms/generate', 'AuthController.sendSMSCode');
	Route.post('login/sms', 'AuthController.loginWithSMSCode');
	Route.post('login/auto', 'AuthController.autoLogin');
	Route.post('logout', 'AuthController.logout').middleware(['auth']);
	Route.post('register', 'AuthController.register');
	Route.post('login/auto/generate', 'AuthController.tokenAutoLogin');
	Route.post('register/resend', 'AuthController.resendRegistrationCode');
	Route.post('register/verified', 'AuthController.userVerification');
	Route.post('password/forgot', 'AuthController.forgotPassword');
	Route.post('password/reset/:email/:token', 'AuthController.resetPassword');

	Route.put('profile', 'AuthController.update').middleware(['auth']);
	Route.get('profile', 'AuthController.findById').middleware(['auth']);
	Route.put('password/change', 'AuthController.changePassword').middleware(['auth']);
}).prefix('auth');

// Upload File
Route.post('upload', 'FileController.upload').middleware(['auth']);

// Get file
Route.get('files/:type/:filename', 'FileController.get');

Route.group(() => {
	// Users
	Route.put('users/force_update_password/:user_id', 'UserController.forceUpdatePassword');
	Route.delete('users/bulk/delete', 'UserController.deleteBulk');
	Route.put('users/bulk/update', 'UserController.updateBulk');
	Route.put('users/banned/:id', 'UserController.bannedUser');
	Route.post('users/bulk/create', 'UserController.createBulk');
	Route.get('users/export/excel', 'UserController.exportExcel');
	Route.get('users/export/docx', 'UserController.exportDocx');
	Route.resource('users', 'UserController').apiOnly();

	// Categories
	Route.get('categories/slug/:slug', 'CategoryController.showBySlug');
	Route.post('categories/bulk/create', 'CategoryController.createBulk');
	Route.put('categories/bulk/update', 'CategoryController.updateBulk');
	Route.delete('categories/bulk/delete', 'CategoryController.deleteBulk');
	Route.get('categories/export/excel', 'CategoryController.exportExcel');
	Route.get('categories/export/docx', 'CategoryController.exportDocx');
	Route.put('categories/reorder', 'CategoryController.reorder');
	Route.resource('categories', 'CategoryController');

	// Articles
	Route.get('articles/slug/:slug', 'ArticleController.showBySlug');
	Route.post('articles/bulk/create', 'ArticleController.createBulk');
	Route.put('articles/bulk/update', 'ArticleController.updateBulk');
	Route.delete('articles/bulk/delete', 'ArticleController.deleteBulk');
	Route.put('articles/reorder', 'ArticleController.reorder');
  Route.resource('articles', 'ArticleController');

  // User Medias
  Route.resource('user_medias', 'UserMediaController');

  // User Media Requests
  Route.resource('user_media_requests', 'UserMediaRequestController');

  // User Favorites
  Route.resource('user_favorites', 'UserFavoriteController');

  // User Viewings
  Route.resource('user_viewings', 'UserViewingController');

  // Messages
  Route.resource('messages', 'MessageController');

  // Packages
  Route.resource('packages', 'PackageController');

  // User Packages
  Route.resource('user_packages', 'UserPackageController');

  // Transactions
  Route.post('transactions/verify_signature', 'TransactionController.verifySignature');
  Route.resource('transactions', 'TransactionController');
}).middleware(['auth']);
