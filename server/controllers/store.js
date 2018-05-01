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
  queryItem: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];

    if ((arg.storeid)&&(arg.modelid)){
      //根据款号店铺查询该店铺的状态和流水，用于库存查询和盘点看明细
      await driver.schema.raw(
        'select i.*,cs.name storename,rs.storeid recstoreid,rs.name recstore,u.username recname,DATE_FORMAT(r.actime,\'%Y-%m-%d %H:%i:%S\') rectime,r.action rection,iu.username itemuser,DATE_FORMAT(i.actime,\'%Y-%m-%d %H:%i:%S\') itime  from item i left join user iu on i.userid = iu.userid left join store cs on i.storeid = cs.storeid left join itemrec r on i.item = r.item left join store rs on r.storeid = rs.storeid left join user u on r.userid = u.userid where i.modelid = ? and (i.storeid = ? or i.item in (select item from sell where sell.storeid = ? and item is not null)) order by i.storeid,i.item,r.recid',
        [arg.modelid,arg.storeid,arg.storeid]
      ).then(result => {
        ctx.body = result
      })
    } else if (arg.modelid){
      //查询每件货的状态和流水，用于核销库存
      await driver.schema.raw(
        'select i.*,cs.name storename,rs.storeid recstoreid,rs.name recstore,u.username recname,DATE_FORMAT(r.actime,\'%Y-%m-%d %H:%i:%S\') rectime,r.action rection,iu.username itemuser,DATE_FORMAT(i.actime,\'%Y-%m-%d %H:%i:%S\') itime  from item i left join user iu on i.userid = iu.userid left join store cs on i.storeid = cs.storeid left join itemrec r on i.item = r.item left join store rs on r.storeid = rs.storeid left join user u on r.userid = u.userid where i.modelid = ? order by i.storeid, i.item,r.recid',
        [arg.modelid]
      ).then(result => {
        ctx.body = result
      })
    }
  },
  query: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];
    if ((arg.modelid)&&(arg.storeid)){
      //查询本店库存，用于销售
      await driver.schema.raw(
        'select m.*,s.amount from model m left join storedetail s on s.storeid = ? and s.modelid = m.modelid where m.modelid = ?',
        [arg.storeid, arg.modelid]
      ).then(result => {
        ctx.body = result;
      })
    }else if ((arg.tenantid)&&(arg.modelcode)){
      //根据款号查询所有库存
      await driver.schema.raw(
        'select m.*,d.storeid,s.name storename,d.amount from model m,storedetail d left join store s on d.storeid = s.storeid where d.amount > 0 and d.modelid = m.modelid and m.tenantid = ? and m.modelcode = ? order by d.storeid',
        [arg.tenantid, arg.modelcode]
      ).then(result => {
        ctx.body = result;
      })
    } else if ((arg.storeid) && (arg.action) && (arg.date)) {
      var now = arg.date + ' 00:00:00';

      //用于库存盘点,返回总库存和已盘点库存
      await driver.schema.raw(
        'select m.*,s.storeid,s.amount,ifnull(i.confirmamount,0) confirmamount from storedetail s left join (select modelid,count(*) confirmamount from item where storeid = ? and actime > ? group by modelid) i on s.modelid = i.modelid left join model m on s.modelid = m.modelid  where s.storeid = ? and s.amount > 0',
        [arg.storeid, now, arg.storeid]
      ).then(result => {
        ctx.body = result
      })
    } else if ((arg.storeid)&&(arg.action)) {
      //获取上个月16号0点
      var now = new Date();
      function N(n) {
        n = n.toString()
        return n[1] ? n : '0' + n
      };
      //if (now.getMonth() == 0){
      //  now = (now.getFullYear() - 1) + '-12-16 00:00:00';
      //}else{
      //  now = now.getFullYear() + '-' + now.getMonth() +'-16 00:00:00';
      //}
      //获取3天前的0店
      now = new Date(now.getTime() - 3 * 86400000);
      now = now.getFullYear() + '-' + N(now.getMonth() + 1) + '-' + N(now.getDay()) + ' 00:00:00';

      //用于库存盘点,返回总库存和已盘点库存
      await driver.schema.raw(
        'select m.*,s.storeid,s.amount,ifnull(i.confirmamount,0) confirmamount from storedetail s left join (select modelid,count(*) confirmamount from item where storeid = ? and actime > ? group by modelid) i on s.modelid = i.modelid left join model m on s.modelid = m.modelid  where s.storeid = ? and s.amount > 0',
        [arg.storeid, now, arg.storeid]
      ).then(result => {
        ctx.body = result
      })
    } else if (arg.storeid) {
      //查询本店所有库存
      await driver.schema.raw(
        'select m.*,s.storeid,s.amount from storedetail s left join model m on s.modelid = m.modelid where s.storeid = ?',
        [arg.storeid]
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
    
    if ((arg.storeid) && (arg.startdate) && (arg.enddate)){
      //查询本店今天的销售记录，用于销售页面
      await driver.schema.raw(
        'select m.*,su.username sellname,ru.username refundname,s.sellid,\
      DATE_FORMAT(s.selltime,\'%Y-%m-%d\') selldate,\
      DATE_FORMAT(s.selltime,\'%H:%i\') selltime,\
      DATE_FORMAT(s.refundtime,\'%Y-%m-%d\') refunddate,\
      DATE_FORMAT(s.refundtime,\'%H:%i\') refundtime,\
      s.item from sell s left join user su on s.selluser = su.userid left join user ru on s.refunduser = ru.userid left join model m on s.modelid = m.modelid where s.storeid = ? and s.selltime between ? and ? and s.refundtime is null',
        [arg.storeid, arg.startdate, arg.enddate]
      ).then(result => {
        ctx.body = result
      })
    } else if ((arg.tenantid) && (arg.modelcode)) {
      //根据款号查询所有的销售清单，用于退货
      await driver.schema.raw(
        'select m.*,su.username sellname,ru.username refundname,s.sellid,\
      DATE_FORMAT(s.selltime,\'%Y-%m-%d\') selldate,\
      DATE_FORMAT(s.selltime,\'%H:%i\') selltime,\
      DATE_FORMAT(s.refundtime,\'%Y-%m-%d\') refunddate,\
      DATE_FORMAT(s.refundtime,\'%H:%i\') refundtime,\
      s.item from sell s left join user su on s.selluser = su.userid left join user ru on s.refunduser = ru.userid left join model m on s.modelid = m.modelid where m.tenantid = ? and m.modelcode = ? order by s.sellid',
        [arg.tenantid, arg.modelcode]
      ).then(result => {
        ctx.body = result
      });
    } else if (arg.item) {
          //根据itemid查询本件货物的销售情况，用于退货
          await driver.schema.raw(
            'select m.*,su.username sellname,ru.username refundname,s.sellid,\
      DATE_FORMAT(s.selltime,\'%Y-%m-%d\') selldate,\
      DATE_FORMAT(s.selltime,\'%H:%i\') selltime,\
      DATE_FORMAT(s.refundtime,\'%Y-%m-%d\') refunddate,\
      DATE_FORMAT(s.refundtime,\'%H:%i\') refundtime,\
      s.item from sell s left join user su on s.selluser = su.userid left join user ru on s.refunduser = ru.userid left join model m on s.modelid = m.modelid where s.item = ?',
            [arg.item]
          ).then(result => {
            ctx.body = result      });
    }
  },
  queryrefund: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];
    var timestamp = new Date();
    function N(n) {
      n = n.toString()
      return n[1] ? n : '0' + n
    };
    if (arg.startdate) {
      arg.startdate = arg.startdate + ' 00:00:00';
    } else {
      arg.startdate = N(timestamp.getFullYear()) + '-' + N(timestamp.getMonth() + 1) + '-' + N(timestamp.getDate()) + ' 00:00:00';
    }
    if (arg.enddate) {
      arg.enddate = arg.enddate + ' 23:59:59';
    } else {
      arg.enddate = N(timestamp.getFullYear()) + '-' + N(timestamp.getMonth() + 1) + '-' + N(timestamp.getDate()) + ' 23:59:59';
    }

    if ((arg.storeid) && (arg.startdate) && (arg.enddate)) {
      //查询指定日期的的退货记录，用于销售页面
      await driver.schema.raw(
        'select m.*,i.item,i.storeid,i.userid,i.action,i.actime,cs.name storename,rs.storeid recstoreid,rs.name recstore,u.username recname,DATE_FORMAT(r.actime,\'%Y-%m-%d %H:%i:%S\') rectime,r.action rection,iu.username itemuser,DATE_FORMAT(i.actime,\'%Y-%m-%d %H:%i:%S\') itime  from item i left join user iu on i.userid = iu.userid left join store cs on i.storeid = cs.storeid left join itemrec r on i.item = r.item left join store rs on r.storeid = rs.storeid left join user u on r.userid = u.userid left join model m on i.modelid = m.modelid where i.item in (select recitem from sell s where s.storeid = ? and s.refundtime between ? and ?) order by i.storeid, i.item,r.recid',
        [arg.storeid, arg.startdate, arg.enddate]
      ).then(result => {
        ctx.body = result
      })
    }
  },
}
