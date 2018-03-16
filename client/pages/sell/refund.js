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

    if (!e.detail.value) {
      that.setData({
        modellist: [],
        model: { modelcode: e.detail.value, },
      })
      return;
    }
    //尝试获取款号
    util.showBusy();
    wx.request({
      url: `${config.service.host}/weapp/store/querysell`,
      data: [loginInfo, {
        tenantid: that.data.tenantIDList[that.data.Idx],
        modelcode: e.detail.value,
      }],
      method: 'POST',
      success: function (result) {
        if (result.data[0].length > 0) {
          that.setData({
            modellist: result.data[0],
            model: { modelcode: e.detail.value, },
          })
          util.stopBusy();
        }
        else {
          that.setData({
            modellist: [],
            model: { modelcode: e.detail.value, },
          })
          util.showModel('错误', '没有查询到该标签的销售记录。');
        }
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })
  },
  choose: function (e) {
    var that = this;
    that.setData({
      model: that.data.modellist[e.currentTarget.id],
    });
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
        util.showBusy('查询中');
        wx.request({
          url: `${config.service.host}/weapp/store/querysell`,
          data: [loginInfo, {
            item: timestamp + '.' + sequence,
          }],
          method: 'POST',
          success: function (result) {
            if (result.data[0].length > 0){
              that.setData({
                model: result.data[0][0],
              })
              util.stopBusy();
            }else{
              that.setData({
                model: { modelcode: modelcode},
              })
              util.showModel('错误', '没有查询到该标签的销售记录。');
            }
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
  refund: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    util.showBusy('工作中');
    wx.request({
      url: `${config.service.host}/weapp/item/add`,
      data: [loginInfo, {
        item: that.data.model.item,
        modelid: that.data.model.modelid,
        storeid: that.data.storeIDList[that.data.Idx],
        action: '退货',
      }],
      method: 'POST',
      success: function (result) {
        util.showSuccess('成功');
        that.setData({
          model:{},
          modellist:[],
        })
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })
  },
})