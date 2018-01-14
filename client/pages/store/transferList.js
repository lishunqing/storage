var config = require('../../config')
// transferList.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    storeID: [],
    storeName: [],
    tenantID: [],
    tostoreID:[],
    tostoreName:[],
    fromstoreindex: 0,
    tostoreindex: 0,
    remark: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    //获取已有订单列表
    wx.request({
      url: `${config.service.host}/weapp/storage/queryDispatchList`,
      data: {
        loginInfo: loginInfo,
        dispatchtype: 2,
        privilegeid: 2,
      },
      method: 'GET',
      success: function (result) {
        var storeid = new Array();
        var storename = new Array();
        var tenantid = new Array();
        for (var x in result.data[1]) {
          storeid[x] = result.data[1][x].storeid;
          storename[x] = result.data[1][x].name;
          tenantid[x] = result.data[1][x].tenantid;
        };
        that.setData({
          storeID: storeid,
          storeName: storename,
          tenantID: tenantid,
          list: result.data[0],
        })
        that.buildtostore(0);
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },

  buildtostore: function(idx){
    var that=this;
    var tenant = that.data.tenantID[idx];
    var tostoreid = [];
    var tostorename = [];
    for (var x in that.data.storeID) {
      if (that.data.tenantID[x] != tenant) {
        continue;
      }
      if (that.data.storeID[x] == that.data.storeID[idx]) {
        continue;
      }
      tostoreid.push(that.data.storeID[x]);
      tostorename.push(that.data.storeName[x]);
    }
    this.setData({
      tostoreindex: 0,
      tostoreID: tostoreid,
      tostoreName: tostorename,
    });
  },

  fromstoreChange: function (e) {
    var that = this;
    this.setData({
      fromstoreindex: e.detail.value,
    });
    that.buildtostore(e.detail.value);
  },
  tostoreChange: function (e) {
    this.setData({
      tostoreindex: e.detail.value,
    });
  },

  remarkInput: function (e) {
    this.setData({
      remark: e.detail.value,
    });
  },

  delBind: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    var id = e.currentTarget.id;
    wx.showModal({
      title: '提示',
      content: '确定要删除吗？',
      success: function (sm) {
        if (sm.confirm) {
          var data = that.data.list;
          //确认删除货单
          wx.request({
            url: `${config.service.host}/weapp/storage/delDispatchList`,
            data: [loginInfo,
              {
                'dispatchlistid': data[id].dispatchlistid,
              }],
            method: 'POST',
            header: { 'content-type': 'application/json' },
            success: function (result) {
              data.splice(id, 1);
              that.setData({
                list: data,
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

  addBind: function () {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    //提交新建货单
    wx.request({
      url: `${config.service.host}/weapp/storage/addDispatchList`,
      data: [loginInfo,
        {
          dispatchtype: 2,
          tenantid: that.data.tenantID[that.data.fromstoreindex],
          fromstore: that.data.storeID[that.data.fromstoreindex],
          tostore: that.data.storeID[that.data.tostoreindex],
          remark: that.data.remark,
          createuser: loginInfo.userid,
        }],
      method: 'POST',
      header: { 'content-type': 'application/json' },
      success: function (result) {
        console.log(result)
        wx.redirectTo({
          url: "/pages/store/transferDetail?id=" + result.data,
        });
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },

  toDetail: function (e) {
    var that = this;
    var id = e.currentTarget.id;
    wx.navigateTo({
      url: "/pages/store/transferDetail?id=" + that.data.list[id].dispatchlistid,
    });
  },
})