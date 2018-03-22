var config = require('../../config')
var util = require('../../util')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    scaning: false,
    stoping: false,
    choosed: false,
    mode: 3,//1：本店库存，2:指定款号查库存，3：库存盘点
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
    setInterval(function () { that.codeScan(); }, 100);
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
    }, 3);
  },

  back: function (e) {
    var that = this;
    that.setData({
      choosed: false,
    });
  },
  starting: function () {
    var that = this;
    that.setData({
      stoping: false,
    })
  },
  codeScan: function () {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');

    if (that.data.scaning || that.data.stoping) {
      return;
    }
    that.setData({
      scaning: true,
    });

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
          url: `${config.service.host}/weapp/item/add`,
          data: [loginInfo, {
            item: timestamp + '.' + sequence,
            modelid: modelid,
            storeid: that.data.storeIDList[that.data.Idx],
            action: '盘点',
          }],
          method: 'POST',
          success: function (result) {
            util.stopBusy();
          },
          fail: function (err) {
            util.showModel('网络异常', err);
          }
        })
      },
      fail: (res) => {
        that.setData({
          stoping: true,
        });
        that.loadList({
          storeid: that.data.storeIDList[that.data.Idx],
          action: '盘点',
        }, 3);
      },
      complete: (res) => {
        that.setData({
          scaning: false,
        });
      },
    });
  },
  loadList: function (arg, mode) {
    //获取本店库存
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    util.showBusy();
    wx.request({
      url: `${config.service.host}/weapp/store/query`,
      data: [loginInfo, arg],
      method: 'POST',
      success: function (result) {
        var totalamount = 0;
        for (var x in result.data[0]) {
          totalamount += result.data[0][x].amount;
        }
        that.setData({
          list: result.data[0],
          choosed: false,
          totalamount: totalamount,
        })
        util.stopBusy();
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })
  },
  choose: function(e){
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    util.showBusy();
    wx.request({
      url: `${config.service.host}/weapp/store/queryItem`,
      data: [loginInfo, {
        storeid: that.data.storeIDList[that.data.Idx],
        modelid: that.data.list[e.currentTarget.id].modelid,
      }],
      method: 'POST',
      success: function (result) {
        var itemrec = result.data[0];
        var itemlist = [];
        var currentitem = { item: '' };
        var lastrecordtime;
        for (var x in itemrec) {
          var item = {
            item: itemrec[x].item,
            modelid: itemrec[x].modelid,
            storeid: itemrec[x].storeid,
            state: itemrec[x].storeid == 0 ? itemrec[x].action : itemrec[x].storename,
            actime: itemrec[x].itime,
            actname: itemrec[x].itemuser,
            action: itemrec[x].action,
            record: [],
          };
          var record = {
            rectime: itemrec[x].rectime,
            recstore: itemrec[x].recstore,
            recname: itemrec[x].recname,
            rection: itemrec[x].rection,
          };
          if (currentitem.item == item.item) {
            currentitem.record.push(record);
          } else {
            //currentitem和item不同，item中是一条信记录
            //currentitem状态是盘点的情况下，需要添加一条记录
            if (currentitem.actime > lastrecordtime) {
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
          itemlist: itemlist,
          choosed: true,
        })
        util.stopBusy(); 
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })    
  },
})