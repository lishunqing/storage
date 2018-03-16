var config = require('../../config')
var util = require('../../util')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    scaning: false,
    stoping: false,
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
      if (permission[x].privilegeid != 1) {
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
    that.loadList();
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
      Idx: idx
    })
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
            action: '到货',
          }],
          method: 'POST',
          success: function (result) {
            that.loadList();
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
      },
      complete: (res) => {
        that.setData({
          scaning: false,
        });
      },
    });
  },
  loadList: function () {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    util.showBusy();
    wx.request({
      url: `${config.service.host}/weapp/dispatch/queryArriveDetail`,
      data: [loginInfo, {
        tenantid: that.data.tenantIDList[that.data.Idx],
      }],
      method: 'POST',
      success: function (result) {
        that.setData({
          list: result.data[0],
        })
        util.stopBusy();
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })
  },
})