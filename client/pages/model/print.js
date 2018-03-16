var config = require('../../config')
var util = require('../../util')

Page({

  data: {
    choosed: false,
    model: {},
    modellist: [],
    modelNameList: [],
    styleValueList: [],
    tenantNameList: [],
    tenantIDList: [],
    tenantIdx: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    var id = wx.getStorageSync('deviceID');
    if (id) {
      that.getDevice(id);
    }
    var permission = wx.getStorageSync('permission');
    var tenantIDList = [];
    var tenantNameList = [];
    for (var x in permission) {
      if (permission[x].privilegeid != 1) {
        continue;
      }
      var newTenant = true;
      for (var y in tenantIDList) {
        if (permission[x].tenantid == tenantIDList[y]) {
          newTenant = false;
          break;
        }
      }
      if (newTenant) {
        tenantIDList.push(permission[x].tenantid);
        tenantNameList.push(permission[x].tenantname);
      }
    }
    that.setData({
      tenantIDList: tenantIDList,
      tenantNameList: tenantNameList,
    })
    that.tenantInput({ detail: { value: 0 } });
  },
  getDevice: function (id) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    util.showBusy();
    wx.request({
      url: `${config.service.host}/weapp/print/device`,
      data: [loginInfo, {
        deviceid: id,
        connected: false,
      }],
      method: 'POST',
      success: function (result) {
        if (result.data.devicetime == undefined) {
          that.setData({
            status: "非法的设备。ID:" + id,
            deviceID: "N/A",
          })
          return;
        } else {
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
        util.stopBusy();
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })
  },
  connectPrint: function (e) {
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
    });

  },
  tenantInput: function (e) {
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

    that.setData({
      modelNameList: modelnamelist,
      styleValueList: stylevaluelist,
      style: tenantStyle,
      tenantIdx: idx
    })
  },
  codeInput: function (e) {
    var that = this;
    var model = that.data.model;
    var loginInfo = wx.getStorageSync('loginInfo');
    model.modelcode = e.detail.value;

    if (!e.detail.value) {
      that.setData({
        modellist: [],
        choosed: false,
        model: model,
        amount:'',
      })
      return;
    }
    //尝试获取款号
    util.showBusy();
    wx.request({
      url: `${config.service.host}/weapp/storage/getModel`,
      data: [loginInfo, {
        tenant: that.data.tenantIDList[that.data.tenantIdx],
        model: e.detail.value,
      }],
      method: 'POST',
      success: function (result) {
        if (result.data[0].length > 0) {
          var m = result.data[0];
          that.setData({
            modellist: m,
            choosed: false,
            model: model,
            amount: '',
          })
        }
        else {
          that.setData({
            modellist: [],
            choosed: false,
            model: model,
            amount: '',            
          })
        }
        util.stopBusy();
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })
  },
  choose: function (e) {
    var that = this;
    that.setData({
      choosed: true,
      model: that.data.modellist[e.currentTarget.id],
    });
  },

  amountInput: function (e) {
    var that = this;
    if (e.detail.value) {
      that.setData({
        amount: parseInt(e.detail.value),
      })
    }
  },

  print:function (e){
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');

    if (!(that.data.amount > 0)){
      that.setDate({
        amount:1,
      });
    }

    var model = that.data.model;
    model.amount = that.data.amount;
    var printlist = [model];

    var style = wx.getStorageSync('tenantStyle')[that.data.tenantIDList[that.data.tenantIdx]];
    var id = wx.getStorageSync('deviceID');

    util.showBusy();
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
        util.showSuccess('已提交打印');
        that.setData({
          amount:'',
        });
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })
  },
})
