var config = require('../../config')

// instoreConfirm.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    remark: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    if (options.id == undefined){
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
        //检查，有没有这个仓库的权限
        var permissions = wx.getStorageSync('permission');
        var nopermission = true;
        for (var x in permissions){
          if ((permissions[x].privilegeid == 2) && (permissions[x].storeid == result.data[0].tostoreid)){
            nopermission = false;
          }
        }
        if (nopermission){
          wx.redirectTo({
            url: "/pages/menu/menu",
          });
        }
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

  remarkInput: function (e) {
    this.setData({
      remark: e.detail.value,
    });
  },
  instore: function(e){
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    wx.showModal({
      title: '提示',
      content: '清点完毕，确认入库!',
      success: function (sm) {
        if (sm.confirm) {
          //确认删除货单
          wx.request({
            url: `${config.service.host}/weapp/storage/instore`,
            data: [loginInfo,
              {
                dispatchlistid: that.data.dispatchListID,
              }],
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