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
  queryImportList: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];
    //查询自己创建的未完成的进货单
    var importList;
    await driver.schema.raw(
      'select i.importlistid,\
              i.tenantid,\
              t.name tenantname,\
              IFNULL(i.name,"") name,\
              DATE_FORMAT(i.updatetime,\'%Y-%m-%d %H:%i:%S\') updatetime,\
              i.createuser\
      from importlist i\
        left join tenant t\
          on i.tenantid = t.tenantid\
      where i.tenantid in (\
      select distinct s.tenantid\
      from permission p\
        left join store s\
          on p.storeid = s.storeid\
      where p.privilegeid = 2\
      and p.userid = ?)\
      order by i.updatetime desc',
      [loginInfo.userid]
    ).then(result => {
      ctx.body = result;
    })
  },
  addImportList: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];

    //todo 检查loginInfo中有没有添加派遣单的权限。

    await driver('importlist').insert(arg).then(result => {
      ctx.body = result[0]
    })
  },
  delImportList: async (ctx, next) => {
    var openid = ctx.request.body[0].openid;
    var arg = ctx.request.body[1];
    await driver.schema.raw(
      'delete from importlist where importlistid = ?', [arg.importlistid]
    ).then(result => {
      ctx.body = result[0]
    })
  },
  queryImportDetail: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];

    var importlist;
    await driver.schema.raw(
      'select i.*,t.name tenantname\
      from importlist i\
        left join tenant t\
          on i.tenantid = t.tenantid\
      where i.importlistid = ?',
      [arg.importlistid]
    ).then(result => {
      importlist = result[0][0];
    })

    var importdetail;
    await driver.schema.raw(
      'select i.*,\
            m.*\
      from importdetail i\
        left join model m\
          on i.modelid = m.modelid\
      where i.importlistid = ?\
      and i.totalamount > i.instoreamount\
      order by m.modelcode,m.style1,m.style2',
      [arg.importlistid]
    ).then(result => {
      importdetail = result[0]
    })
    ctx.body = [importlist, importdetail];
  },
  addImportDetail: async (ctx, next) => {
    var openid = ctx.request.body[0].openid;
    var importlist = ctx.request.body[1];
    var importdetail = ctx.request.body[2];


    await driver("importdetail").insert(importdetail).then();
    if ((importlist.importname)&&(importlist.importperfix)&&(importlist.importlistid)){
      await driver.schema.raw(
        'update importlist set name = ?,perfix = ? where importlistid = ?', [importlist.importname, importlist.importperfix, importlist.importlistid]
      ).then(result => {
        ctx.body = result
      })
    } else if((importlist.importname) && (importlist.importlistid)){
      await driver.schema.raw(
        'update importlist set name = ? where importlistid = ?', [importlist.importname, importlist.importlistid]
      ).then(result => {
        ctx.body = result
      })
    }
  },
  modImportDetail: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];
    await driver.schema.raw(
      'update importdetail set totalamount = ? where id = ?', [arg.totalamount, arg.id]
    ).then(result => {
      ctx.body = result
    })
  },
  delImportDetail: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];
    await driver.schema.raw(
      'delete from importdetail where id = ?', [ arg.id]
    ).then(result => {
      ctx.body = result
    })
  },
  queryArriveDetail: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];
    await driver.schema.raw(
      'select m.*,d.totalamount,d.instoreamount from importdetail d left join importlist i on d.importlistid = i.importlistid left join model m on d.modelid = m.modelid where d.instoreamount < d.totalamount and i.tenantid = ?', [arg.tenantid]
    ).then(result => {
      ctx.body = result
    })
  },

}
