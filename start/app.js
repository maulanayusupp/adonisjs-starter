'use strict'
const Helpers = use('Helpers')

/*
|--------------------------------------------------------------------------
| Providers
|--------------------------------------------------------------------------
|
| Providers are building blocks for your Adonis app. Anytime you install
| a new Adonis specific package, chances are you will register the
| provider here.
|
*/
const providers = [
  '@adonisjs/framework/providers/AppProvider',
  '@adonisjs/auth/providers/AuthProvider',
  '@adonisjs/bodyparser/providers/BodyParserProvider',
  '@adonisjs/cors/providers/CorsProvider',
  '@adonisjs/lucid/providers/LucidProvider',
  '@adonisjs/framework/providers/ViewProvider',
  Helpers.appRoot('app/Providers/ExtendResponseProvider'),
  '@adonisjs/shield/providers/ShieldProvider',
  '@adonisjs/session/providers/SessionProvider',
  'adonis-kue/providers/KueProvider',
  'adonis-scheduler/providers/SchedulerProvider',
  '@adonisjs/mail/providers/MailProvider',
  '@adonisjs/redis/providers/RedisProvider',
  '@adonisjs/antl/providers/AntlProvider',
  '@adonisjs/validator/providers/ValidatorProvider',
  '@radmen/adonis-lucid-soft-deletes/providers/SoftDeletesProvider',
  '@adonisjs/drive/providers/DriveProvider',
  'adonis-spreadsheet/providers/SpreadSheetProvider',
  '@adonisjs/lucid-slugify/providers/SlugifyProvider'
]

/*
|--------------------------------------------------------------------------
| Ace Providers
|--------------------------------------------------------------------------
|
| Ace providers are required only when running ace commands. For example
| Providers for migrations, tests etc.
|
*/
const aceProviders = [
  '@adonisjs/lucid/providers/MigrationsProvider',
  'adonis-kue/providers/CommandsProvider',
  'adonis-scheduler/providers/CommandsProvider',
  Helpers.appRoot('providers/ServiceGenerator/providers/ServiceGeneratorProvider'),
]

/*
|--------------------------------------------------------------------------
| Aliases
|--------------------------------------------------------------------------
|
| Aliases are short unique names for IoC container bindings. You are free
| to create your own aliases.
|
| For example:
|   { Route: 'Adonis/Src/Route' }
|
*/
const aliases = {}

/*
|--------------------------------------------------------------------------
| Commands
|--------------------------------------------------------------------------
|
| Here you store ace commands for your package
|
*/
const commands = []

const jobs = [
  'App/Jobs/EmailVerifiedAccount',
  'App/Jobs/EmailForgotPassword',
  'App/Jobs/EmailAutoLogin',
]

module.exports = { providers, aceProviders, aliases, commands, jobs }
