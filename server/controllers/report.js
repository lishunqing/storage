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
  storereport: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];

    if ((arg.startdate) && (arg.enddate) && (arg.storeid)) {
      //查询店面库存和库存流水情况
      arg.startdate += ' 00:00:00';
      arg.enddate += ' 23:59:59';
      await driver.schema.raw(
        'SELECT DATE_FORMAT(actime,\'%Y-%m-%d\') actime,action,count(1) count FROM itemrec WHERE storeid = ? and actime between ? and ? group by DATE_FORMAT(actime,\'%Y-%m-%d\'),action',
        [arg.storeid, arg.startdate, arg.enddate]
      ).then(result => {
        ctx.body = result;
      })
      await driver.schema.raw(
        'SELECT count(1) count FROM item WHERE storeid = ?',
        [arg.storeid]
      ).then(result => {
        ctx.body[1] = result[0][0];
      })
    }
  },
  sellreport: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];

    if ((arg.startdate) && (arg.enddate)) {
      //查询本店今天的销售记录，用于销售页面
      arg.startdate += ' 00:00:00';
      arg.enddate += ' 23:59:59';
      await driver.schema.raw(
        'SELECT date,d.storeid,s.name storename,sum(sellcount) sellcount,sum(sellprice) sellprice,sum(refundcount) refundcount,sum(refundprice) refundprice FROM ( SELECT DATE_FORMAT(selltime,\'%Y-%m-%d\') date, storeid, 1 sellcount, actualprice sellprice,0 refundcount, 0 refundprice FROM sell WHERE selltime BETWEEN ? AND ? UNION ALL SELECT DATE_FORMAT(refundtime,\'%Y-%m-%d\') date, storeid, 0 sellcount, 0 sellprice,1 refundcount, actualprice refundprice FROM sell WHERE refundtime BETWEEN ? AND ?) d LEFT JOIN store s ON d.storeid = s.storeid GROUP BY date,storeid',
        [arg.startdate, arg.enddate, arg.startdate, arg.enddate]
      ).then(result => {
        ctx.body = result
      })
    }
  },
  sellmodel: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];

    if ((arg.startdate) && (arg.enddate)&&(arg.tenantid)) {
      //查询本店今天的销售记录，用于销售页面
      arg.startdate += ' 00:00:00';
      arg.enddate += ' 23:59:59';
      await driver.schema.raw(
        'select m.*,r.sellcount,ifnull(d.storageamount,0) storageamount from (select modelid,count(*) sellcount from sell where refundtime is null and selltime between ? and ? group by modelid) r left join model m on r.modelid = m.modelid left join (select modelid,sum(amount) storageamount from storedetail group by modelid) d on r.modelid = d.modelid where m.tenantid = ?',
        [arg.startdate, arg.enddate, arg.tenantid]
      ).then(result => {
        ctx.body = result
      })
    }
  },

}