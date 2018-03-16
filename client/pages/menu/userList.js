var config = require('../../config')
var util = require('../../util')

Page({

  /**
   * 页面的初始数据
   */
  data: {
  text:"",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    //获取已有订单列表
    wx.request({
      url: `${config.service.host}/weapp/storage/userList`,
      data: [loginInfo,{}],
      method: 'POST',
      success: function (result) {
        that.setData({
          list: result.data,
        })
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },
  choose: function (e) {
    var that = this;
    var id = e.currentTarget.id;
    wx.navigateTo({
      url: "/pages/menu/userPermission?id=" + e.currentTarget.id,
    });
  },
  disable: function(e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    //获取已有订单列表
    wx.request({
      url: `${config.service.host}/weapp/storage/disable`,
      data: [loginInfo, {
        userid: e.currentTarget.id,
      }],
      method: 'POST',
      success: function (result) {
        if (result.data[0].affectedRows == 1){
          var l = that.data.list;
          for(var x in l){
            if (l[x].userid == e.currentTarget.id){
              l[x].disabled = 1 - l[x].disabled;
              that.setData({list:l});
              break;
            }
          }
        }
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },

  scan: function(e){
    var that = this;
    wx.scanCode({
      onlyFromCamera: true,
      scanType:['qrCode'],
      success: (res) => {
        console.log(res);
        that.setData({
          text: res.result
        })
        wx.showToast({
          title: '成功',
          icon: 'success',
          duration: 2000
        })
      },
      fail: (res) => {
        console.log(res);
        wx.showToast({
          title: '失败',
          icon: 'success',
          duration: 2000
        })
      },
      complete: (res) => {
      },
    });
  }
})