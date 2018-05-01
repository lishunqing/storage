var config = require('../../config')
var util = require('../../util')

// pages/report/sellreport.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    order:{},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var now = new Date();
    var permission = wx.getStorageSync('permission');
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
        storeIDList.push(permission[x].storeid);
        storeNameList.push(permission[x].storename);
        tenantIDList.push(permission[x].tenantid);
      }
    }
    if (storeIDList.length > 1){
      storeIDList.push(0);
      storeNameList.push('全部');
      tenantIDList.push(tenantIDList[0]);
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
    that.loadList();
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

    //根据店铺的选择，过滤查询结果
    var list = that.data.reportlist;
    var totalsellprice = 0;
    var totalsellcount = 0;
    var totalrefundprice = 0;
    var totalrefundcount = 0;
    for(var x in list){
      var storeid = that.data.storeIDList[idx];
      if (storeid == 0){
        list[x].display = false;
        for (var y in that.data.storeIDList){
          if (list[x].storeid == that.data.storeIDList[y]){
            list[x].display = true;
            totalsellprice += list[x].sellprice;
            totalsellcount += list[x].sellcount;
            totalrefundprice += list[x].refundprice;
            totalrefundcount += list[x].refundcount;
            break;
          }
        }
      }else if (storeid == list[x].storeid){
        list[x].display = true;
        totalsellprice += list[x].sellprice;
        totalsellcount += list[x].sellcount;
        totalrefundprice += list[x].refundprice;
        totalrefundcount += list[x].refundcount;
      }else{
        list[x].display = false;
      }
    }

    that.setData({
      modelNameList: modelnamelist,
      styleValueList: stylevaluelist,
      style: tenantStyle,
      Idx: idx,
      reportlist: list,
      choosed: false,
      totalsellprice: totalsellprice,
      totalsellcount: totalsellcount,
      totalrefundprice: totalrefundprice,
      totalrefundcount: totalrefundcount,
    });
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
      url: `${config.service.host}/weapp/report/sellreport`,
      data: [loginInfo, {
        startdate: that.data.startDate,
        enddate: that.data.endDate,
      }],
      method: 'POST',
      success: function (result) {
        that.setData({
          reportlist: result.data[0],
          mode: 1,
        })
        that.storeInput({ detail: { value: that.data.Idx } });
        util.stopBusy();
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })
  },
  loadsell: function (e) {
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
          mode:2,
        })
        util.stopBusy();
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })
  },
  loadrefund: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    var idx = e.currentTarget.id;

    //尝试获取销售记录
    util.showBusy();
    wx.request({
      url: `${config.service.host}/weapp/store/queryrefund`,
      data: [loginInfo, {
        storeid: that.data.reportlist[idx].storeid,
        startdate: that.data.reportlist[idx].date,
        enddate: that.data.reportlist[idx].date,
      }],
      method: 'POST',
      success: function (result) {
        var itemrec = result.data[0];
        var itemlist = [];
        var currentitem = { item: '' };
        var lastrecordtime;
        for (var x in itemrec) {
          var item = {
            item: itemrec[x].item,
            modelid: itemrec[x].modelid,
            storeid: itemrec[x].storeid,
            state: itemrec[x].storeid == 0 ? itemrec[x].action : itemrec[x].storename,
            actime: itemrec[x].itime,
            actname: itemrec[x].itemuser,
            action: itemrec[x].action,
            modelcode: itemrec[x].modelcode,
            modelname: itemrec[x].name,
            style1: itemrec[x].style1,
            style2: itemrec[x].style2,
            record: [],
          };
          var record = {
            rectime: itemrec[x].rectime,
            recstore: itemrec[x].recstore,
            recname: itemrec[x].recname,
            rection: itemrec[x].rection,
          };
          if (currentitem.item == item.item) {
            currentitem.record.push(record);
          } else {
            //currentitem和item不同，item中是一条信记录
            //currentitem状态是盘点的情况下，需要添加一条记录
            if (currentitem.actime > lastrecordtime) {
              var newrecord = {
                rectime: currentitem.actime,
                recstore: currentitem.state,
                recname: currentitem.actname,
                rection: '确认',
              };
              currentitem.record.push(newrecord);
            }
            item.record.push(record);
            currentitem = item;

            itemlist.push(item);
          }
          lastrecordtime = itemrec[x].rectime;
        }
        if (currentitem.actime > lastrecordtime) {
          var newrecord = {
            rectime: currentitem.actime,
            recstore: currentitem.state,
            recname: currentitem.actname,
            rection: '确认',
          };
          currentitem.record.push(newrecord);
        }

        that.setData({
          itemrec: result.data[0],
          itemlist: itemlist,
          mode: 3,
        })
        util.stopBusy();
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })
  },
  sort: function (e){
    var that = this;
    var id = e.currentTarget.id;
    var list = that.data.reportlist;
    var order = that.data.order;
    if (order[id] == undefined){
      order[id] = 0;
    }else{
      order[id] = 1 - order[id];
    }

    //冒泡排序
    var len = list.length;
    for (var i = 0; i < len - 1; i++){
      for (var j = 0; j < len - 1 - i; j++){
        if (order[id]){
          if (list[j][id] < list[j + 1][id]) {
            var temp = list[j];
            list[j] = list[j + 1];
            list[j + 1] = temp;
          }
        }else{
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
  back:function (e){
    var that = this;
    var mode = that.data.mode;
    if (mode == 2){
      mode = 1;
    } else if (mode == 3){
      mode = 1;
    }
    that.setData({
      mode:mode,
    });
  }
})