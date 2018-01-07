 const config = require('../config');
 const http = require('axios')

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
  getLogin: async (ctx, next) => {
    const appid = config.appId
    const appsecret = config.appSecret
    const code = ctx.query.js_code;

    return http({
      url: 'https://api.weixin.qq.com/sns/jscode2session',
      method: 'GET',
      params: {
        appid: appid,
        secret: appsecret,
        js_code: code,
        grant_type: 'authorization_code'
      }
    }).then(res => {
      res = res.data
      if (res.errcode || !res.openid || !res.session_key) {
        throw new Error(`${ERRORS.ERR_GET_SESSION_KEY}\n${JSON.stringify(res)}`)
      } else {
        ctx.body = res
      }
    })
  },
  getTenant: async (ctx, next) => {
    await driver.schema.raw('select * from tenant where tenantid > 0').then(result => {
      ctx.body = result[0]
    })
  },
  getStore: async (ctx, next) => {
    await driver.schema.raw('select * from store where storeid > 0').then(result => {
      ctx.body = result[0]
    })
  },
}
