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
  addArrive: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var dispatchlist = ctx.request.body[1].dispatchlist;
    var dispatchdetail = ctx.request.body[1].dispatchdetail;
    
    await driver('dispatchlist').insert(dispatchlist).then(result => {
      dispatchlist.dispatchlistid = result[0];
      for (var x in dispatchdetail){
        dispatchdetail[x].dispatchlistid = dispatchlist.dispatchlistid;
      }
    })
    await driver('dispatchdetail').insert(dispatchdetail).then(result => {
      ctx.body = 0;
    })
    await driver.schema.raw(
      'update importdetail i , dispatchdetail d set i.instoreamount = i.instoreamount + d.amount where i.importlistid = ? and d.dispatchlistid = ? and i.modelid = d.modelid', [
        ctx.request.body[1].importlistid,
        dispatchlist.dispatchlistid,
      ]
    ).then(result => {
      ctx.body = 0;
    })
    await driver.schema.raw(
      'update importlist i set i.finishtime = CURRENT_TIMESTAMP where i.importlistid = ? and not exists(select 1 from importdetail d where d.importlistid = i.importlistid and d.instoreamount != d.totalamount)', [
        ctx.request.body[1].importlistid
      ]
    ).then(result => {
      ctx.body = 0;
    })
    await driver.schema.raw(
      'update dispatchlist d set d.finishtime = CURRENT_TIMESTAMP where d.dispatchlistid = ?', [
        dispatchlist.dispatchlistid,
      ]
    ).then(result => {
      ctx.body = 0;
    })

    ctx.body = dispatchlist.dispatchlistid;
  }
}
