const config = require('../config');

const driver = require('knex')({
  client: 'mysql',
  connection: {
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.serviceuser,
    password: config.mysql.servicepass,
    database: config.mysql.servicedb,
    charset: config.mysql.char
  }
})

module.exports = {
  query: async (ctx, next) => {
    await driver.schema.raw(
      'select * from model where tenantid = ? and modelcode = ?',
      [ctx.query.tenant,ctx.query.model]
    ).then(result => {
      ctx.body = result[0]
    })
  },
  add: async (ctx, next) => {
    var openid = ctx.request.body[0].openid;
    var arg = ctx.request.body[1];
    await driver("model").insert(arg).then(result => {
      ctx.body = result[0]
    })
  },
  del: async (ctx, next) => {
    var openid = ctx.request.body[0].openid;
    var arg = ctx.request.body[1];
    await driver.schema.raw(
      'delete from dispatchlist where dispatchlistid = ?', [arg.id]
    ).then(result => {
      ctx.body = result[0]
    })
  },
}
