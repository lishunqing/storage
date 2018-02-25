var config = require('../../config')

Page({

  data: {
    id: 0,
    model: {},
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
    that.setData({
      id: options.id,
    })
    wx.request({
      url: `${config.service.host}/weapp/storage/queryImportDetail`,
      data: [loginInfo, {
        importlistid: that.data.id,
      }],
      method: 'POST',
      success: function (result) {
        var tenantStyle = wx.getStorageSync('tenantStyle')[result.data[0].tenantid];
        var data = result.data[1];
        for(var x in data){
          data[x].amount = 0;
        }
        that.setData({
          importList: result.data[0],
          style: tenantStyle,
          list: data,
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
    if (data[id].amount < (data[id].totalamount - data[id].instoreamount)){
      ++data[id].amount;
      that.setData({
        list: data,
      })
    }
  },
  min: function (e) {
    var that = this;
    var data = that.data.list;
    var id = e.currentTarget.id;
    if (data[id].amount > 0) {
      --data[id].amount;
      that.setData({
        list: data,
      })
    }
  },
  finish: function () {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    var dispatchlist = {};
    dispatchlist.dispatchtype = 1;
    dispatchlist.tenantid = that.data.importList.tenantid;
    dispatchlist.fromstore = 0;
    dispatchlist.tostore = that.data.importList.storeid;
    dispatchlist.createuser = loginInfo.userid;
    var dispatchdetail = [];
    for (var x in that.data.list) {
      if (that.data.list[x].amount > 0) {
        var m = {
          modelid: that.data.list[x].modelid,
          amount: that.data.list[x].amount,
        };
        dispatchdetail.push(m);
      }
    }
    if (dispatchdetail.length <= 0)
    {
      wx.showModal({
        title: '错误',
        content: '没有任何到货',
        showCancel: false
      })
      return;
    }
    wx.showModal({
      title: '提示',
      content: '确定要完成到货吗？',
      success: function (sm) {
        if (sm.confirm) {
          //确认删除货单

          wx.request({
            url: `${config.service.host}/weapp/storage/addArrive`,
            data: [loginInfo,
              {
                dispatchlist: dispatchlist,
                dispatchdetail:dispatchdetail,
                importlistid:that.data.id,
              }],
            method: 'POST',
            header: { 'content-type': 'application/json' },
            success: function (result) {
              wx.redirectTo({
                url: "/pages/print/importPrintConfirm?id=" + result.data,
              });
            },
            fail: function (err) {
              console.log(err);
            }
          })
        } else if (sm.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
})