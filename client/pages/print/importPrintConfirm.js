var config = require('../../config')

// pages/print/importPrintConfirm.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    dispatchListID: 0,
  

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    if (options.id == undefined) {
      wx.redirectTo({
        url: "/pages/menu/menu",
      });
    }
    wx.request({
      url: `${config.service.host}/weapp/storage/queryDispatchDetail`,
      data: [loginInfo, {
        dispatchid: options.id,
      }],
      method: 'POST',
      success: function (result) {
        var tenantStyle = wx.getStorageSync('tenantStyle')[result.data[0].tenantid];
        that.setData({
          dispatchListID: options.id,
          style: tenantStyle,
          dispatch: result.data[0], 
          list: result.data[1],
        })
      },
      fail: function (err) {
        console.log(err);
      }
    })  
  },

  print: function(e){
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    var list = that.data.list;
    for(var x in list){
      list[x].amount = list[x].dispatchamount;
    }
    var style = wx.getStorageSync('tenantStyle')[that.data.dispatch.tenantid];
    var id = wx.getStorageSync('deviceID');

    wx.request({
      url: `${config.service.host}/weapp/print/addTagTask`,
      data: [loginInfo, {
        deviceid: id,
        tagTask: {
          type: 1,
          model: list,
          style: style,
      }}],
      method: 'POST',
      success: function (result) {
        wx.showToast({
          title: '已提交',
          icon: 'success',
          duration: 2000
        })
        setTimeout(function(){wx.redirectTo({
          url: "/pages/menu/menu",
        });},500);
      },
      fail: function (err) {
        console.log(err);
      }
    })  
  }
})