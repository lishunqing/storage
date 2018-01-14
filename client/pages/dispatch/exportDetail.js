var config = require('../../config')
// pages/dispatch/exportDetail.js
Page({

  data: {
    dispatchListID: 0,
    model: {},
    choose: [
      { value: '只看本单', checked: 'true' },
      { value: '所有库存' },
    ],
    allStorage: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    if (options.id == undefined) {
      wx.redirectTo({
        url: "/pages/menu/menu",
      });
    }
    wx.request({
      url: `${config.service.host}/weapp/storage/queryDispatchDetail`,
      data: {
        dispatchid: options.id,
      },
      method: 'GET',
      success: function (result) {
        var tenantStyle = wx.getStorageSync('tenantStyle')[result.data[0].tenantid];
        that.setData({
          dispatchListID: options.id,
          dispatch: result.data[0],
          list: result.data[1],
          style: tenantStyle,
        })
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },

  codeInput: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');

    var m = {};
    for(var x in that.data.list){
      if (e.detail.value == that.data.list[x].modelcode){
        m = that.data.list[x];
      }
    }
    that.setData({
      model: m,
    })
  },
  radioChange: function (e) {
    var that = this;
    if (e.detail.value == that.data.choose[0].value) {
      that.setData({
        allStorage: false,
      });
    } else {
      that.setData({
        allStorage: true,
      });
    }
  },
  amountInput: function (e) {
    var that = this;
    if (e.detail.value) {
      var amount = parseInt(e.detail.value);
      var m = that.data.model;
      if (amount > m.storageamount){
        amount = m.storageamount;
      } else if (amount < 0){
        amount = 0;
      }
      m.dispatchamount = amount;
      var l = that.data.list;
      for(var x in l){
        if (l[x].modelid == m.modelid){
          l[x].dispatchamount = amount;
        }
      }
      that.setData({
        model: m,
        list: l,
      })
    }
  },

  add: function (e) {
    var that = this;
    for (var x in that.data.list) {
      var t = that.data.list[x];
      if (that.data.list[x].modelid == e.currentTarget.id) {
        var amount = t.dispatchamount + 1;
        if (amount > t.storageamount){
          amount = t.storageamount;
        }
        t.dispatchamount = amount;
        that.setData({
          model: t,
          list: that.data.list,
        });
      }
    }
  },

  min: function (e) {
    var that = this;
    for (var x in that.data.list) {
      var t = that.data.list[x];
      if (that.data.list[x].modelid == e.currentTarget.id) {
        var amount = t.dispatchamount - 1;
        if (amount < 0) {
          amount = 0;
        }
        t.dispatchamount = amount;
        that.setData({
          model: t,
          list: that.data.list,
        });
      }
    }
  },

  choose: function (e) {
    var that = this;
    for (var x in that.data.list) {
      var t = that.data.list[x];
      if (t.modelid == e.currentTarget.id) {
        that.setData({
          model: t,
        });
      }
    }
  },

  finish: function () {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    wx.showModal({
      title: '提示',
      content: '确定要完成调度单吗？\n注意：完成调度单后将核减库存，不能再修改单据中的条目和数量了，请再次确认!',
      success: function (sm) {
        if (sm.confirm) {
          //确认
          var detaillist = [];
          for(var x in that.data.list){
            var t = that.data.list[x];
            if (t.dispatchamount > 0){
              detaillist.push({
                dispatchlistid: that.data.dispatchListID,
                modelid: t.modelid,
                amount: t.dispatchamount,
              });
            }
          }
          wx.request({
            url: `${config.service.host}/weapp/storage/outstore`,
            data: [loginInfo,
              {
                dispatchlistid: that.data.dispatchListID,
              },
              detaillist],
            method: 'POST',
            header: { 'content-type': 'application/json' },
            success: function (result) {
              wx.redirectTo({
                url: "/pages/menu/menu",
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