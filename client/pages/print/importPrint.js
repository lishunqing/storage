const config = require('../../config');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    status:"打印机未连接",
    deviceID:"N/A",
    connected: false,
  
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    var id = wx.getStorageSync('deviceID');

    if (id){
      that.getDevice(id);
    }
    if (true){
      //查询自己创建的或等待自己签收的，已经完成，尚未签收的进货单
      wx.request({
        url: `${config.service.host}/weapp/storage/queryImportList` ,
        data: [loginInfo,],
        method: 'POST',
        success: function (result) {
          that.setData({
            list: result.data[0],
          })
        },
        fail: function (err) {
          console.log(err);
        }
      })
    }
  
  },
  getDevice:function (id){
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    wx.request({
      url: `${config.service.host}/weapp/print/device`,
      data: [loginInfo, {
        deviceid: id,
        connected: false,
      }],
      method: 'POST',
      success: function (result) {
        if (result.data.devicetime == undefined){
          that.setData({
            status:"非法的设备。ID:" + id,
            deviceID: "N/A",
          })
          return;
        }else{
          wx.setStorageSync('deviceID', id);
          if (parseInt(result.data.servertime) - parseInt(result.data.devicetime) < parseInt(result.data.outtime)) {
            that.setData({
              status: "设备(" + id + ")已连接。",
              deviceID: id,
              connected: true,
             })
          } else {
            that.setData({
              status: "设备(" + id + ")已断线。时间：" + Math.round((parseInt(result.data.servertime) - parseInt(result.data.devicetime)) / 1000),
              deviceID: id,
              connected: false,
            })
          }
        }
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },
  connectPrint:function(e){
    var that = this;
    wx.scanCode({
      onlyFromCamera: true,
      scanType: ['qrCode'],
      success: (res) => {
        that.getDevice(res.result);
        that.setData({
          deviceID: res.result
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

  },
  toDetail: function (e) {
    var that = this;
    var id = e.currentTarget.id;
    wx.navigateTo({
      url: "/pages/print/importPrintConfirm?id=" + that.data.list[id].importlistid,
    });
  },
})