const fs    = require('fs')
    , path  = require('path')
    , Hapi  = require('hapi')
    , url   = require('url')
    , after = require('after')

function loadKey (config, file, callback) {
  if (!config.tls || typeof config.tls[file + 'File'] != 'string')
    return callback()

  var _file = path.join(config.configDir || '.', config.tls[file + 'File'])

  fs.readFile(_file, 'utf8', function (err, data) {
    if (err)
      return callback(err)

    config.tls[file] = data
    callback()
  })
}

function loadTls (config, callback) {
  var done = after(4, callback)

  function loadFor (type) {
    config[type].configDir = config.configDir

    if (config[type].tls
        && typeof config[type].tls.keyFile == 'string'
        && typeof config[type].tls.key != 'string')
      loadKey(config[type], 'key', done)
    else
      done()

    if (config[type].tls
        && typeof config[type].tls.certFile == 'string'
        && typeof config[type].tls.cert != 'string')
      loadKey(config[type], 'cert', done)
    else
      done()
  }

  loadFor('remote')
  loadFor('local')
}

function proxy (config, callback) {
  loadTls(config, function (err) {
    if (err)
      return callback(err)

    //!! Avert your eyes !!//
    // Monkey-patch url.parse to insert 'key' and 'cert' properties on the
    // returned object which Nipple uses to build http/https agent requests

    if (config.remote.tls && config.remote.tls.key && config.remote.tls.cert) {
      var urlParse = url.parse

      url.parse = function () {
        var parsed = urlParse.apply(url, arguments)
        if (parsed.hostname == config.remote.host && parsed.port == config.remote.port) {
          parsed.key = config.remote.tls.key
          parsed.cert = config.remote.tls.cert
        }
        return parsed
      }
    }

    var options = { }

    if (config.local.tls && config.local.tls.key && config.local.tls.cert) {
      options.tls = config.local.tls
      options.tls.rejectUnauthorized = true
      options.tls.requestCert = true
    }

    // Create a simple HTTP hapi server

    var server = new Hapi.Server(config.local.host || '', config.local.port, options)

    // Single route to rule them all, a pass-through proxy to send all
    // requests down to the HTTP connection to the upstream Kappa registry
    server.route({
        path    : '/{p*}'
      , method  : '*'
      , handler : {
            proxy : {
                host               : config.remote.host
              , port               : config.remote.port
              , protocol           : config.remote.tls ? 'https' : 'http'
              , passThrough        : true
              , rejectUnauthorized : false
            }
        }
    })

    server.start(callback)
  })
}

module.exports = proxy
module.exports.loadKey = loadKey