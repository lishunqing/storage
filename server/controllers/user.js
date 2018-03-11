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
    var sessionkey;
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
        sessionkey = res.session_key;
        config.set(res.openid, [res.session_key, new Date().getTime()]);
      }
    });

    await driver.schema.raw('select * from user where openid = ?', [loginInfo.openid]).then(result => {
      loginInfo.session_key = sessionkey;
      
      for (var key in result[0][0]){
        loginInfo[key] = result[0][0][key];
      }
    });

    var tenantList;
    await driver.schema.raw('select * from tenant where tenantid > 0').then(result => {
      tenantList = result[0]
    })

    var tenantStyle = {};
    await driver.schema.raw('select * from tenantstyle').then(result => {
      for (var x in result[0]) {
        var item = result[0][x];
        if (tenantStyle[item.tenantid]) {
          tenantStyle[item.tenantid].push(item);
        } else {
          tenantStyle[item.tenantid] = [item];
        }
      }
      console.log(tenantStyle);
    })

    var permission = {};
    if (loginInfo.userid != undefined){
      await driver.schema.raw('select privilegeid,p.storeid,s.name storename,t.tenantid,t.name tenantname from permission p left join store s on p.storeid = s.storeid left join tenant t on s.tenantid = t.tenantid where userid = ?', [loginInfo.userid]).then(result => {
        permission = result[0]
      })
    }
    ctx.body = [loginInfo, tenantList, tenantStyle, permission];
  },

  save: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];
    if ((loginInfo.userid == undefined) || (loginInfo.userid == "")){
      arg.userid = undefined;
      await driver('user').insert(arg).then(result => {
        ctx.body = {userid:result[0]};
        loginInfo.userid = result[0];
      })
    }else{
      await driver('user').where({ 
        userid: loginInfo.userid,
      }).update({
        username:arg.username,
        userremark:arg.userremark,
      });
      ctx.body = { userid: loginInfo.userid};
    }
    arg = ctx.request.body[2];

    if (arg.auth){
      await driver.schema.raw('update user a,user b set a.disabled = b.disabled where a.userid = ? and b.openid = ?', [loginInfo.userid, arg.auth]).then();
      await driver.schema.raw('delete from grantedprivilege where userid = ?', [loginInfo.userid]).then();
      await driver.schema.raw('insert into grantedprivilege(userid,privilegeid,storeid) select ?,privilegeid,storeid from grantedprivilege where userid = (select userid from user where openid = ?)', [loginInfo.userid, arg.auth]).then();
    }
  },

  queryList: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];

    if (loginInfo.userid == 0){
      await driver.schema.raw('select * from user', []).then(result => {
        ctx.body = result[0];
      });
    }else{
      await driver.schema.raw('select * from user where userid != ? and userid > 0', [
        loginInfo.userid
      ]).then(result => {
        ctx.body = result[0];
      });
    }
  },
  disable: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];

    await driver.schema.raw('update user set disabled = 1 - disabled where userid = ?', [
      arg.userid
    ]).then(result => {
      ctx.body = result;
    });
  },
  queryPrivilege: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var arg = ctx.request.body[1];

    ctx.body = [];
    await driver.schema.raw('select s.storeid,\
                                    s.name storename,\
                                    p.privilegeid,\
                                    p.name privilegename,\
                                    p.remark privilegeremark,\
                                    ifnull(b.storeid,0) permission\
                              from permission a\
                              left join grantedprivilege b\
                              on a.privilegeid = b.privilegeid\
                              and a.storeid = b.storeid\
                              and b.userid = ?\
                              left join store s\
                              on a.storeid = s.storeid\
                              left join privilege p\
                              on a.privilegeid = p.privilegeid\
                              where (a.userid, a.storeid) in\
                                (select userid, storeid\
                                  from permission\
                                  where userid = ?\
                                  and privilegeid = 0)\
                              order by a.storeid,a.privilegeid',[
        arg.userid,loginInfo.userid
      ]).then(result => {
      ctx.body[0] = result[0];
    });

    await driver.schema.raw('select * from user where userid = ?', [
      arg.userid
    ]).then(result => {
      ctx.body[1] = result[0][0];
    });
  },
  savePrivilege: async (ctx, next) => {
    var loginInfo = ctx.request.body[0];
    var del = ctx.request.body[1];
    var ins = ctx.request.body[2];

    for(var x in del){
      await driver('grantedprivilege').where(del[x]).del();
    }

    await driver('grantedprivilege').insert(ins).then(result => {
      ctx.body = result[0];
    });
  },
}
