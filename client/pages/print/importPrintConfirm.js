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
      url: `${config.service.host}/weapp/dispatch/queryImportDetail`,
      data: [loginInfo, {
        importlistid: options.id,
      }],
      method: 'POST',
      success: function (result) {
        var tenantStyle = wx.getStorageSync('tenantStyle')[result.data[0].tenantid];
        for (var x in result.data[1]) {
          result.data[1][x].printamount = 0;
        }
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
  add: function (e) {
    var that = this;
    var data = that.data.list;
    var id = e.currentTarget.id;
    if (data[id].printamount < data[id].totalamount) {
      ++data[id].printamount;
      that.setData({
        list: data,
      })
    }
  },
  min: function (e) {
    var that = this;
    var data = that.data.list;
    var id = e.currentTarget.id;
    if (data[id].printamount > 0) {
      --data[id].printamount;
      that.setData({
        list: data,
      })
    }
  },
  printall: function(e){
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    var list = that.data.list;
    for(var x in list){
      list[x].amount = list[x].totalamount;
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
  },
  printuna: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    var list = that.data.list;
    var printlist = [];
    for (var x in list) {
      if (list[x].totalamount > list[x].instoreamount) {
        var i = list[x];
        i.amount = i.totalamount - i.instoreamount;
        printlist.push(i);
      }
    }
    var style = wx.getStorageSync('tenantStyle')[that.data.dispatch.tenantid];
    var id = wx.getStorageSync('deviceID');

    wx.request({
      url: `${config.service.host}/weapp/print/addTagTask`,
      data: [loginInfo, {
        deviceid: id,
        tagTask: {
          type: 1,
          model: printlist,
          style: style,
        }
      }],
      method: 'POST',
      success: function (result) {
        wx.showToast({
          title: '已提交',
          icon: 'success',
          duration: 2000
        })
        setTimeout(function () {
          wx.redirectTo({
            url: "/pages/menu/menu",
          });
        }, 500);
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },
  printlist: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    var list = that.data.list;
    for (var x in list) {
      list[x].amount = list[x].dispatchamount;
    }
    var style = wx.getStorageSync('tenantStyle')[that.data.dispatch.tenantid];
    var id = wx.getStorageSync('deviceID');

    wx.request({
      url: `${config.service.host}/weapp/print/addTagTask`,
      data: [loginInfo, {
        deviceid: id,
        tagTask: {
          type: 2,
          model: list,
          style: style,
        }
      }],
      method: 'POST',
      success: function (result) {
        wx.showToast({
          title: '已提交',
          icon: 'success',
          duration: 2000
        })
        setTimeout(function () {
          wx.redirectTo({
            url: "/pages/menu/menu",
          });
        }, 500);
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },
  print: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    var list = that.data.list;
    var printlist = [];
    for (var x in list) {
      if (list[x].printamount > 0) {
        var i = list[x];
        i.amount = i.printamount;
        printlist.push(i);
      }
    }
    var style = wx.getStorageSync('tenantStyle')[that.data.dispatch.tenantid];
    var id = wx.getStorageSync('deviceID');

    wx.request({
      url: `${config.service.host}/weapp/print/addTagTask`,
      data: [loginInfo, {
        deviceid: id,
        tagTask: {
          type: 1,
          model: printlist,
          style: style,
        }
      }],
      method: 'POST',
      success: function (result) {
        wx.showToast({
          title: '已提交',
          icon: 'success',
          duration: 2000
        })
        setTimeout(function () {
          wx.redirectTo({
            url: "/pages/menu/menu",
          });
        }, 500);
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },
})
