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
  },
  query: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];
    if ((arg.modelid)&&(arg.storeid)){
      await driver.schema.raw(
        'select m.*,s.amount from model m left join storedetail s on s.storeid = ? and s.modelid = m.modelid where m.modelid = ?',
        [arg.storeid, arg.modelid]
      ).then(result => {
        ctx.body = result
      })
    }else if ((arg.tenantid)&&(arg.modelcode)&&(arg.storeid)){
      await driver.schema.raw(
        'select m.*,s.amount from model m left join storedetail s on s.storeid = ? and s.modelid = m.modelid where m.modelcode = ? and m.tenantid = ?',
        [arg.storeid, arg.modelcode, arg.tenantid]
      ).then(result => {
        ctx.body = result
      })
    }

  },
  addsell: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];
    
    if (arg.item == '')
      arg.item = undefined;

    await driver('sell').insert(arg).then(result => {
      ctx.body = 0;
    })
  },
  querysell: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];
    var timestamp = new Date();
    function N(n) {
      n = n.toString()
      return n[1] ? n : '0' + n
    };
    if (arg.startdate){
      arg.startdate = arg.startdate + ' 00:00:00';
    }else{
      arg.startdate = N(timestamp.getFullYear()) + '-' + N(timestamp.getMonth() + 1) + '-' + N(timestamp.getDate()) + ' 00:00:00';
    }
    if (arg.enddate) {
      arg.enddate = arg.enddate + ' 23:59:59';
    } else {
      arg.enddate = N(timestamp.getFullYear()) + '-' + N(timestamp.getMonth() + 1) + '-' + N(timestamp.getDate()) + ' 23:59:59';
    }
    

    await driver.schema.raw(
      'select m.*,su.username sellname,ru.username refundname,s.sellid,\
      DATE_FORMAT(s.selltime,\'%Y-%m-%d\') selldate,\
      DATE_FORMAT(s.selltime,\'%H:%I\') selltime,\
      DATE_FORMAT(s.refundtime,\'%Y-%m-%d\') refunddate,\
      DATE_FORMAT(s.refundtime,\'%H:%I\') refundtime,\
      s.item from sell s left join user su on s.selluser = su.userid left join user ru on s.refunduser = ru.userid left join model m on s.modelid = m.modelid where s.storeid = ? and s.selltime between ? and ?',
      [arg.storeid, arg.startdate, arg.enddate]
    ).then(result => {
      ctx.body = result
    })
  },
}
