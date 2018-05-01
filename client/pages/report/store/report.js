var config = require('../../../config')
var util = require('../../../util')

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
    var now = new Date();
    var permission = wx.getStorageSync('permission');
    var defaultStore = wx.getStorageSync('defaultStore');
    var idx = 0;
    var storeIDList = [];
    var storeNameList = [];
    var tenantIDList = [];
    for (var x in permission) {
      if (permission[x].privilegeid != 11) {
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
    function N(n) {
      n = n.toString()
      return n[1] ? n : '0' + n
    };
    that.setData({
      storeIDList: storeIDList,
      storeNameList: storeNameList,
      tenantIDList: tenantIDList,
      startDate: now.getDate() > 15 ? N(now.getFullYear()) + '-' + N(now.getMonth() + 1) + '-16' : N(now.getMonth() == 0 ? now.getFullYear() - 1 : now.getFullYear()) + '-' + N(now.getMonth() == 0 ? 12 : now.getMonth()) + '-16',
      endDate: util.getDate(now),
      Idx: storeIDList.length - 1,
    });
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
      url: `${config.service.host}/weapp/report/storereport`,
      data: [loginInfo, {
        storeid: that.data.storeIDList[that.data.Idx],
        startdate: that.data.startDate,
        enddate: that.data.endDate,
      }],
      method: 'POST',
      success: function (result) {
        var reportlist = [];
        for(var x in result.data[0]){
          var listid = -1;
          for(var y in reportlist){
            if (reportlist[y].actime == result.data[0][x].actime){
              listid = y;
              break;
            }
          }

          if (listid > -1){
            reportlist[listid][result.data[0][x].action] = result.data[0][x].count;
          }else{
            var item = { actime: result.data[0][x].actime};
            item[result.data[0][x].action] = result.data[0][x].count;
            reportlist.push(item);
          }
        }
        
        that.setData({
          reportlist: reportlist,
          count: result.data[1].count,
          mode: 1,
        })
        that.sort({ currentTarget: { id:'actime'}});
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
    } else if (mode == 3) {
      mode = 1;
    }
    that.setData({
      mode: mode,
    });
  }
})