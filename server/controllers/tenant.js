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

    //获取loginInfo
    var loginInfo;
    await http({
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
        loginInfo = res;
      }
    });

    var tenantList;
    await driver.schema.raw('select * from tenant where tenantid > 0').then(result => {
      tenantList = result[0]
    })

    var tenantStyle = {};
    await driver.schema.raw('select * from tenantstyle').then(result => {
      for(var x in result[0]){
        var item = result[0][x];
        if (tenantStyle[item.tenantid]){
          tenantStyle[item.tenantid].push(item);
        }else{
          tenantStyle[item.tenantid] = [item];
        }
      }
      console.log(tenantStyle);
    })
    
    ctx.body = [loginInfo, tenantList, tenantStyle];
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
