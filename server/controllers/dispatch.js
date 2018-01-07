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
  queryAll: async (ctx, next) => {
    await driver.schema.raw(
      'select d.dispatchlistid,\
              d.dispatchtype,\
              d.tenantid,\
              t.name tenantname,\
              fs.name fromstore,\
              ts.name tostore,\
              IFNULL(d.remark,"") remark,\
              DATE_FORMAT(d.createtime,\'%Y-%m-%d %H:%I:%S\') createtime,\
              d.createuser\
      from dispatchlist d\
        left join store fs\
          on d.fromstore = fs.storeid\
        left join store ts\
          on d.tostore = ts.storeid\
        left join tenant t\
          on d.tenantid = t.tenantid\
      order by d.dispatchlistid'
    ).then(result => {
      ctx.body = result[0]
    })
  },
  add: async (ctx, next) => {
    var openid = ctx.request.body[0].openid;
    var arg = ctx.request.body[1];
    await driver.schema.raw(
      'insert into dispatchlist(\
              dispatchtype,\
              tenantid,\
              tostore,\
              remark,\
              createuser)\
            values(?,?,?,?,?)', [arg.type, arg.tenant, arg.tostore,arg.remark, openid]
    ).then(result => {
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
