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
  getPrintTask: async (ctx, next) => {
    var condition = ctx.query;
    var id = condition.id;
    if (id){
      //打印程序传入ID，以打印程序生成的ID为准
      var task = config.get(id);
      if (!task) {
        //本地缓存中没有发现这个设备，在缓存中注册，立即返回。
        config.set(id, { devicetime: new Date().getTime() });
        ctx.body = { id: id };
        return;
      }
      //响应消息中返回ID和任务
      ctx.body = { id: id ,task: task.task};
      task.devicetime = new Date().getTime();
      if (task.task){
        //清空任务
        //task.task = undefined;
      }
      config.set(id, task);
    }else{
      //打印程序没有传入设备ID，自动随机生成一个
      id = (Math.random().toString() + "0000000000").substring(2, 10);
      config.set(id, { devicetime: new Date().getTime() });
      ctx.body = { id: id };
      return;
    }
  },
  getPrintDevice: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];
    var data = config.get(arg.deviceid);
    if (data){
      ctx.body = { 
        devicetime:data.devicetime,
        servertime:new Date().getTime(),
        outtime:30000,//打印机超时时间，30秒
      };
    }
  },
  queryImportList: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    //查询自己创建的或等待自己签收的，已经完成，尚未签收的进货单
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
      where ((d.dispatchtype = 1\
      and d.createuser = ?)\
      or ((d.dispatchtype = 1\
      or d.dispatchtype = 2)\
      and d.tostore in (\
      select storeid\
      from permission\
      where privilegeid = 2\
      and userid = ?)))\
      and d.finishtime is not null\
      and d.instoretime is null\
      order by d.dispatchlistid',
      [loginInfo.userid, loginInfo.userid]
    ).then(result => {
      importList = result[0]
    })

    ctx.body = [importList];
  },

  addTagTask: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];
    var deviceID = arg.deviceid;
    var task = config.get(deviceID);
    if (!task) {
      return;
    }
    task.task = arg.tagTask;
    config.set(id, task);
  }
}
