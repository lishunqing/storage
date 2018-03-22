var config = require('../../config')
var util = require('../../util')

// pages/report/sellreport.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    order: {},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
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

    var now = new Date();
    function N(n) {
      n = n.toString()
      return n[1] ? n : '0' + n
    };
    that.setData({
      tenantIDList: tenantIDList,
      tenantNameList: tenantNameList,
      startDate: now.getDate() > 15 ? N(now.getFullYear()) + '-' + N(now.getMonth() + 1) + '-16' : N(now.getMonth() == 0 ? now.getFullYear() - 1 : now.getFullYear()) + '-' + N(now.getMonth() == 0 ? 12 : now.getMonth()) + '-16',
      endDate: util.getDate(now),
    });
    that.tenantInput({ detail: { value: 0 } });
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
    that.loadList();
  },
  startDateInput: function (e) {
    var that = this;
    that.setData({
      startDate: e.detail.value,
    });
    that.loadList();
  },
  endDateInput: function (e) {
    var that = this;
    that.setData({
      endDate: e.detail.value,
    });
    that.loadList();
  },
  loadList: function () {
    //获取统计结果
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    util.showBusy();
    wx.request({
      url: `${config.service.host}/weapp/report/sellmodel`,
      data: [loginInfo, {
        startdate: that.data.startDate,
        enddate: that.data.endDate,
        tenantid: that.data.tenantIDList[that.data.tenantIdx],
      }],
      method: 'POST',
      success: function (result) {
        that.setData({
          reportlist: result.data[0],
          mode: 1,
        })
        util.stopBusy();
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })
  },
  loaddetail: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    var idx = e.currentTarget.id;

    //尝试获取销售记录
    util.showBusy();
    wx.request({
      url: `${config.service.host}/weapp/store/querysell`,
      data: [loginInfo, {
        storeid: that.data.reportlist[idx].storeid,
        startdate: that.data.reportlist[idx].date,
        enddate: that.data.reportlist[idx].date,
      }],
      method: 'POST',
      success: function (result) {
        var totalcount = 0;
        var totalprice = 0;
        for (var x in result.data[0]) {
          ++totalcount;
          totalprice += result.data[0][x].price;
        }
        that.setData({
          list: result.data[0],
          totalcount: totalcount,
          totalprice: totalprice,
          mode: 2,
        })
        util.stopBusy();
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })
  },
  sort: function (e) {
    var that = this;
    var id = e.currentTarget.id;
    var list = that.data.reportlist;
    var order = that.data.order;
    if (order[id] == undefined) {
      order[id] = 0;
    } else {
      order[id] = 1 - order[id];
    }

    //冒泡排序
    var len = list.length;
    for (var i = 0; i < len - 1; i++) {
      for (var j = 0; j < len - 1 - i; j++) {
        if (order[id]) {
          if (list[j][id] < list[j + 1][id]) {
            var temp = list[j];
            list[j] = list[j + 1];
            list[j + 1] = temp;
          }
        } else {
          if (list[j][id] > list[j + 1][id]) {
            var temp = list[j];
            list[j] = list[j + 1];
            list[j + 1] = temp;
          }
        }
      }
    }
    that.setData({
      reportlist: list,
      order: order,
    })
  },
  back: function (e) {
    var that = this;
    var mode = that.data.mode;
    if (mode == 2) {
      mode = 1;
    }
    that.setData({
      mode: mode,
    });
  }
})