var config = require('../../config')
var util = require('../../util')

Page({

  /**
   * 页面的初始数据
   */
  data: {
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;

    var permission = wx.getStorageSync('permission');
    var defaultStore = wx.getStorageSync('defaultStore');
    var idx = 0;
    var storeIDList = [];
    var storeNameList = [];
    var tenantIDList = [];
    for (var x in permission) {
      if (permission[x].privilegeid != 3) {
        continue;
      }
      var newStore = true;
      for (var y in tenantIDList) {
        if (permission[x].storeid == storeIDList[y]) {
          newStore = false;
          break;
        }
      }
      if (newStore) {
        if (permission[x].storeid == defaultStore) {
          idx = storeIDList.length;
        }
        storeIDList.push(permission[x].storeid);
        storeNameList.push(permission[x].storename);
        tenantIDList.push(permission[x].tenantid);
      }
    }
    that.setData({
      storeIDList: storeIDList,
      storeNameList: storeNameList,
      tenantIDList: tenantIDList,
    })

    that.storeInput({ detail: { value: idx } });
    that.dateInput();
  },
  storeInput: function (e) {
    var that = this;
    var idx = e.detail.value;
    var modelnamelist = wx.getStorageSync('modelNameList.' + that.data.tenantIDList[idx]);
    if ((modelnamelist == undefined) || (modelnamelist == '')) {
      var tenantlist = wx.getStorageSync('tenantList');
      for (var x in tenantlist) {
        if (tenantlist[x].tenantid == that.data.tenantIDList[idx]) {
          modelnamelist = tenantlist[x].namelist.split(',');
        }
      }
    }
    var tenantStyle = wx.getStorageSync('tenantStyle')[that.data.tenantIDList[idx]];
    var stylevaluelist = [];
    for (var x in tenantStyle) {
      var itemlist = wx.getStorageSync('styleValueList.' + that.data.tenantIDList[idx] + '.' + tenantStyle[x].styleid);
      if ((itemlist == undefined) || (itemlist == '')) {
        itemlist = tenantStyle[x].stylelist.split(',');
      }
      stylevaluelist[tenantStyle[x].styleid] = itemlist;
    }

    wx.setStorageSync('defaultStore', that.data.storeIDList[parseInt(idx)]);
    var date = wx.getStorageSync('checkDate');

    that.setData({
      modelNameList: modelnamelist,
      styleValueList: stylevaluelist,
      style: tenantStyle,
      Idx: idx,
      model: {},
    })
    that.loadList({
      storeid: that.data.storeIDList[that.data.Idx],
      action: '盘点',
      date: date,
    },1);
  },
  dateInput: function (e) {
    var that = this;
    if (e) {
      wx.setStorageSync('checkDate', e.detail.value);
      that.setData({
        date: e.detail.value,
      });
    } else {
      var date = wx.getStorageSync('checkDate');
      if (!date) {
        date = util.getDate(new Date(new Date().getTime() - 3 * 86400000));
      }
      that.setData({
        date: date,
      });
    }
    that.loadList({
      storeid: that.data.storeIDList[that.data.Idx],
      action: '盘点',
      date: that.data.date,
    }, 1);
  },
  codeInput: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');

    that.setData({
      list: [],
      mode: 2,
      model: { modelcode: e.detail.value },
    })

    //尝试获取款号
    that.loadList({
      tenantid: that.data.tenantIDList[that.data.Idx],
      modelcode: e.detail.value,
    }, 2);
  },
  codeScan: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    wx.scanCode({
      onlyFromCamera: true,
      scanType: ['qrCode'],
      success: (res) => {
        var text = res.result;
        text = text.substr(text.indexOf('?'));
        var modelcode = text.substring(text.indexOf('1=') + 2, text.indexOf('&2='))
        var modelid = parseInt(text.substring(text.indexOf('&2=') + 3, text.indexOf('&3=')));
        var sequence = text.substring(text.indexOf('&3=') + 3, text.indexOf('&4='))
        var timestamp = text.substring(text.indexOf('&4=') + 3)
        util.showBusy();
        wx.request({
          url: `${config.service.host}/weapp/store/query`,
          data: [loginInfo, {
            modelid: modelid,
            storeid: that.data.storeIDList[that.data.Idx],
          }],
          method: 'POST',
          success: function (result) {
            that.setData({
              seq: timestamp + '.' + sequence,
              model: result.data[0][0],
            })
            that.loadItem(modelid);
            util.stopBusy();
          },
          fail: function (err) {
            util.showModel('网络异常', err);
          }
        })
      },
      fail: (res) => {
        that.setData({
          model: {},
        })
      },
    });
  },
  choose: function (e) {
    var that = this;
    that.setData({
      model: that.data.list[e.currentTarget.id],
    });
    that.loadItem(that.data.list[e.currentTarget.id].modelid);
  },
  loadList: function (arg, mode) {
    //获取本店库存
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');

    if (arg == undefined)
    {
      arg = that.data.arg;
      mode = that.data.mode;
    }

    util.showBusy();
    wx.request({
      url: `${config.service.host}/weapp/store/query`,
      data: [loginInfo, arg],
      method: 'POST',
      success: function (result) {
        that.setData({
          list: result.data[0],
          seq:"",
          mode: mode,
          arg: arg,
          model: arg,
        })
        util.stopBusy();
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })
  },
  back:function(e){
    var that = this;
    that.loadList();
  },
  loadItem:function(modelid){
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    util.showBusy();
    wx.request({
      url: `${config.service.host}/weapp/store/queryItem`,
      data: [loginInfo, {
        modelid: modelid,
      }],
      method: 'POST',
      success: function (result) {
        var itemrec = result.data[0];
        var itemlist = [];
        var currentitem = {item:''};
        var lastrecordtime;
        for(var x in itemrec){
          var item = {
            item:itemrec[x].item,
            modelid:itemrec[x].modelid,
            storeid: itemrec[x].storeid,
            state: itemrec[x].storeid == 0 ? itemrec[x].action : itemrec[x].storename,
            actime: itemrec[x].itime,
            actname: itemrec[x].itemuser,
            action: itemrec[x].action,
            record:[],
          };
          var record = {
            rectime: itemrec[x].rectime,
            recstore: itemrec[x].recstore,
            recname: itemrec[x].recname,
            rection: itemrec[x].rection,
          };
          if (currentitem.item == item.item){
            currentitem.record.push(record);
          }else{
            //currentitem和item不同，item中是一条信记录
            //currentitem状态是盘点的情况下，需要添加一条记录
            if (currentitem.actime > lastrecordtime){
              var newrecord = {
                rectime: currentitem.actime,
                recstore: currentitem.state,
                recname: currentitem.actname,
                rection: '确认',
              };
              currentitem.record.push(newrecord);
            }
            item.record.push(record);
            currentitem = item;
            //在存在seq，且item的seq不为扫描出来的seq时，跳过本单，不记录。
            if ((that.data.seq != "")&&(that.data.seq != item.item))
              continue;

            itemlist.push(item);
          }
          lastrecordtime = itemrec[x].rectime;
        }
        if (currentitem.actime > lastrecordtime) {
          var newrecord = {
            rectime: currentitem.actime,
            recstore: currentitem.state,
            recname: currentitem.actname,
            rection: '确认',
          };
          currentitem.record.push(newrecord);
        }

        that.setData({
          itemrec: result.data[0],
          itemlist:itemlist,
        })
        util.stopBusy();
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })    
  },

  destory: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');

    for (var x in that.data.itemlist) {
      if (that.data.itemlist[x].item == e.target.id) {
        if (that.data.itemlist[x].storeid == 0) {
          return;
        } else {
          break;
        }
      }
    }
    wx.showModal({
      title: '提示',
      content: '确定这件货已经售出，只是漏扫码登记了么？',
      success: function (sm) {
        if (sm.confirm) {
          util.showBusy();
          wx.request({
            url: `${config.service.host}/weapp/store/addsell`,
            data: [loginInfo, {
              storeid: that.data.storeIDList[that.data.Idx],
              modelid: that.data.model.modelid,
              item: e.target.id,
              action: '补售',
              selluser: loginInfo.userid,
              selltime: util.getTime(new Date()),
              actualprice: that.data.model.price,
            }],
            method: 'POST',
            success: function (result) {
              if (result.data.code == 0) {
                util.showSuccess('已提交');
              } else {
                util.showModel('错误', '可能是重复出售了，详细信息：\n' + result.data.error);
              }
              that.loadItem(that.data.model.modelid);
            },
            fail: function (err) {
              util.showModel('网络异常', err);
            }
          })
        } else if (sm.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
})