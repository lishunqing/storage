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
  queryDispatchList: async (ctx, next) => {
    var condition = ctx.query;
    var loginInfo = JSON.parse(condition.loginInfo);
    //查询自己创建的未完成的进货单
    var importList;
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
      where d.dispatchtype = ?\
      and d.createuser = ?\
      and d.finishtime is null\
      order by d.dispatchlistid',
      [condition.dispatchtype,loginInfo.userid]
    ).then(result => {
      importList = result[0]
    })

    //查询自己有权限的店铺
    var storelist;
    await driver.schema.raw(
      'select s.*\
      from permission p\
        left join store s\
          on p.storeid = s.storeid\
      where p.privilegeid = ?\
      and p.userid = ?',
      [condition.privilegeid,loginInfo.userid]
    ).then(result => {
      storelist = result[0];
    })

    ctx.body = [importList,storelist];
  },
  queryInstoreList: async (ctx, next) => {
    var condition = ctx.query;
    var loginInfo = JSON.parse(condition.loginInfo);
    //查询自己有权限确认签收的入库单
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
      where d.tostore in (\
        select storeid\
        from permission\
        where privilegeid = 2\
        and userid = ?)\
      and d.finishtime is not null\
      and d.instoretime is null\
      order by d.dispatchlistid',
      [loginInfo.userid]
    ).then(result => {
      ctx.body = [result[0]];
    })
  },
  add: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];

    //todo 检查loginInfo中有没有添加派遣单的权限。

    await driver('dispatchlist').insert(arg).then(result => {
      ctx.body = result[0]
    })
  },
  del: async (ctx, next) => {
    var openid = ctx.request.body[0].openid;
    var arg = ctx.request.body[1];
    await driver.schema.raw(
      'delete from dispatchlist where dispatchlistid = ?', [arg.dispatchlistid]
    ).then(result => {
      ctx.body = result[0]
    })
  },
  addDetail: async (ctx, next) => {
    var openid = ctx.request.body[0].openid;
    var arg = ctx.request.body[1];
    await driver.schema.raw(
      'replace into dispatchdetail(\
        dispatchlistid,\
        modelid,\
        amount\
      ) values (?,?,?)',[
        arg.dispatchlistid,
        arg.modelid,
        arg.amount,
      ]
    ).then(result => {
      ctx.body = result[0]
    })
  },
  delDetail: async (ctx, next) => {
    var openid = ctx.request.body[0].openid;
    var arg = ctx.request.body[1];
    await driver.schema.raw(
      'delete from dispatchdetail where dispatchlistid = ? and modelid = ?', [arg.dispatchlistid,arg.modelid]
    ).then(result => {
      ctx.body = result[0]
    })
  },
  queryDetail: async (ctx, next) => {
    var dispatch;
    await driver.schema.raw(
      'select d.dispatchlistid,\
              d.dispatchtype,\
              d.tenantid,\
              t.name tenantname,\
              d.fromstore fromstoreid,\
              fs.name fromstore,\
              d.tostore tostoreid,\
              ts.name tostore,\
              IFNULL(d.remark,"") remark,\
              DATE_FORMAT(d.createtime,\'%Y-%m-%d %H:%I:%S\') createtime,\
              DATE_FORMAT(d.finishtime,\'%Y-%m-%d %H:%I:%S\') finishtime,\
              d.createuser\
      from dispatchlist d\
        left join store fs\
          on d.fromstore = fs.storeid\
        left join store ts\
          on d.tostore = ts.storeid\
        left join tenant t\
          on d.tenantid = t.tenantid\
      where d.dispatchlistid = ?',
      [ctx.query.dispatchid]
    ).then(result => {
      dispatch = result[0][0];
    })

    var dispatchdetail;
    if (dispatch.fromstoreid > 0){
      await driver.schema.raw(
        'select s.amount storageamount,\
                IFNULL(d.amount,0) dispatchamount,\
                m.*\
          from storedetail s\
            left join dispatchdetail d\
              on s.modelid = d.modelid\
              and d.dispatchlistid = ?\
            left join model m\
              on s.modelid = m.modelid\
          where s.storeid = ?\
          and s.amount > 0',
        [ctx.query.dispatchid, dispatch.fromstoreid]
      ).then(result => {
        dispatchdetail = result[0]
      })
    }else{
      await driver.schema.raw(
        'select d.amount dispatchamount,\
              m.*\
      from dispatchdetail d\
        left join model m\
        on d.modelid = m.modelid\
      where d.dispatchlistid = ?\
      order by d.modelid',
        [ctx.query.dispatchid]
      ).then(result => {
        dispatchdetail = result[0]
      })
    }

    ctx.body = [dispatch, dispatchdetail];
  },
  finishDispatch: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];

    await driver.schema.raw(
      'update dispatchlist set finishtime = CURRENT_TIMESTAMP where dispatchlistid = ?',[
        arg.dispatchlistid,
      ]).then(result => {
        ctx.body = result[0]
      })
  },
  instore: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];

    await driver.schema.raw(
      'update dispatchlist set instoretime = CURRENT_TIMESTAMP, instoreuser = ? where dispatchlistid = ?', [
        loginInfo.userid,
        arg.dispatchlistid,
      ]).then(result => {
        ctx.body = result[0]
      })
  },
  outstore: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];
    var detail = ctx.request.body[2];

    await driver.schema.raw(
      'delete from dispatchdetail where dispatchlistid = ?', [
        arg.dispatchlistid,
      ]).then(result => {
        ctx.body = result[0]
      })

    await driver("dispatchdetail").insert(detail);

    await driver.schema.raw(
      'update dispatchlist set finishtime = CURRENT_TIMESTAMP, outstoretime = CURRENT_TIMESTAMP, outstoreuser = ? where dispatchlistid = ?', [
        loginInfo.userid,
        arg.dispatchlistid,
      ]).then(result => {
        ctx.body = result[0]
      })
  },
}
