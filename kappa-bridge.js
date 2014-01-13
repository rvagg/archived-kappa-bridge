#!/usr/bin/env node

const argv  = require('optimist').argv
    , path  = require('path')
    , proxy = require('./proxy')

var config

if (argv.c) {
  config = require(path.resolve(argv.c))
} else {
  config = { kappa: { tls: {} }, registry: { tls: {} } }

  //TODO: args ?
}

if (!config
    || typeof config.kappa != 'object'
    || typeof config.kappa.remote != 'object'
    || typeof config.kappa.remote.host != 'string'
    || typeof config.kappa.remote.port != 'number'
    || typeof config.kappa.remote.tls != 'object'
    || typeof config.kappa.remote.tls.keyFile != 'string'
    || typeof config.kappa.remote.tls.certFile != 'string'
    || typeof config.kappa.local != 'object'
    || typeof config.kappa.local.host != 'string'
    || typeof config.kappa.local.port != 'number'
    || typeof config.registry != 'object'
    || typeof config.registry.remote != 'object'
    || typeof config.registry.remote.host != 'string'
    || typeof config.registry.remote.port != 'number'
    || typeof config.registry.remote.tls != 'object'
    || typeof config.registry.remote.tls.keyFile != 'string'
    || typeof config.registry.remote.tls.certFile != 'string'
    || typeof config.registry.local != 'object'
    || typeof config.registry.local.host != 'string'
    || typeof config.registry.local.port != 'number'
  ) {

  console.error('Usage: kappa-bridge -c <config file json/js>')
  console.error('   or: kappa-bridge -kl <kappa local> -kr <kappa remote>'
              + '-kkey <key file> -kcert <cert file>'
              + '-rl <kappa local> -rr <kappa remote> '
              + '-rkey <key file> -rcert <cert file>'
  )
  process.exit(-1)
}

proxy(config.kappa, function (err) {
  if (err)
    throw err

  console.log('Kappa proxy listening on', config.kappa.local.host + ':' + config.kappa.local.port)
})

proxy(config.registry, function (err) {
  if (err)
    throw err

  console.log('Registry proxy listening', config.registry.local.host + ':' + config.registry.local.port)
})
