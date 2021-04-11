'use strict'

const { hooks } = require('@adonisjs/ignitor')

hooks.after.providersBooted(() => {
  const View = use('View')
  const __ = use('App/Helpers/string-localize')
  View.global('__', __)
})