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
  add: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];

    await driver.schema.raw('insert into item(item,modelid,storeid,userid,action) values (?,?,?,?,?) on duplicate key update storeid = ?,userid = ?,action = ?', [
      arg.item,
      arg.modelid,
      arg.storeid,
      loginInfo.userid,
      arg.action,
      arg.storeid,
      loginInfo.userid,
      arg.action,
    ]).then(result => {
      ctx.body = result;
    })
  },
  queryRec: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];

    await driver.schema.raw('select i.recid,m.*,u.username,i.action,DATE_FORMAT(i.actime,\'%H:%i\') actime from itemrec i left join model m on m.modelid = i.modelid left join user u on u.userid = i.userid where i.storeid = ? and i.action = ? and i.actime >= DATE_FORMAT(CURRENT_TIMESTAMP,\'%Y-%m-%d 00:00:00\')', [
      arg.storeid,
      arg.action,
    ]).then(result => {
      ctx.body = result;
    })
  },
}
