var config = require('../../config.js')
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
    var that = this

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
      choosed: false,
    })

    that.storeInput({ detail: { value: idx } });
    that.codeScan();
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
  codeInput: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    var model = { modelcode: e.detail.value, };
    if (!e.detail.value) {
      that.setData({
        modellist: [],
        choosed: false,
        model: model,
      })
      return;
    }
    //尝试获取款号
    util.showBusy();
    wx.request({
      url: `${config.service.host}/weapp/store/query`,
      data: [loginInfo, {
        tenantid: that.data.tenantIDList[that.data.Idx],
        storeid: that.data.storeIDList[that.data.Idx],
        modelcode: e.detail.value,
      }],
      method: 'POST',
      success: function (result) {
        if (result.data[0].length > 0) {
          var m = result.data[0];
          that.setData({
            modellist: m,
            choosed: false,
            model: model,
          })
        }
        else {
          that.setData({
            modellist: [],
            choosed: false,
            model: model,
          })
        }
        util.stopBusy();
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })
  },
  codeScan: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    wx.scanCode({
      onlyFromCamera: true,
      scanType: ['qrCode'],
      success: (res) => {
        util.showBusy();
        var text = res.result;
        text = text.substr(text.indexOf('?'));
        var modelcode = text.substring(text.indexOf('1=') + 2, text.indexOf('&2='))
        var modelid = parseInt(text.substring(text.indexOf('&2=') + 3, text.indexOf('&3=')));
        var sequence = text.substring(text.indexOf('&3=') + 3, text.indexOf('&4='))
        var timestamp = text.substring(text.indexOf('&4=') + 3)
        wx.request({
          url: `${config.service.host}/weapp/store/query`,
          data: [loginInfo, {
            modelid: modelid,
            storeid: that.data.storeIDList[that.data.Idx],
          }],
          method: 'POST',
          success: function (result) {
            var now = new Date();
            that.setData({
              model: result.data[0][0],
              seq: timestamp + '.' + sequence,
              choosed: true,
              date: util.getDate(now),
              time: util.getMinute(now),
            })
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
          choosed: false,
        })
      },
    });
  },

  bad: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    wx.showModal({
      title: '提示',
      content: '确定要将这件货登记为次品吗？',
      success: function (sm) {
        if (sm.confirm) {
          //确认登记为次品
          util.showBusy();
          wx.request({
            url: `${config.service.host}/weapp/item/add`,
            data: [loginInfo, {
              item: that.data.seq,
              modelid: that.data.model.modelid,
              storeid: 0,
              action: '次品',
            }],
            method: 'POST',
            success: function (result) {
              util.stopBusy();
              wx.redirectTo({
                url: "/pages/menu/menu",
              });
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