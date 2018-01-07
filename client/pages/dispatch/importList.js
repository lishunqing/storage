var config = require('../../config')

// importList.js
Page({

  data: {
    list:[],
    storeID:[],
    storeName:[],
    tenantID:[],
    storeindex:0,
    remark:'',
    aaa:[],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    //获取已有订单列表
    wx.request({
      url: `${config.service.host}/weapp/storage/queryDispatchList`,
      data:[],
      method: 'GET', 
      success: function(result){
        that.setData({list:result.data})
      },
      fail: function(err){
        console.log(err);
      }
    })
    //获取可用店铺列表
    wx.request({
      url: `${config.service.host}/weapp/storage/store`,
      data: [],
      method: 'GET',
      success: function (result) {
        var x;
        var storeid = new Array();
        var storename = new Array();
        var tenantid = new Array();
        for (x in result.data)
        {
          storeid[x] = result.data[x].storeid;
          storename[x] = result.data[x].name;
          tenantid[x] = result.data[x].tenantid;
        };
        that.setData({
          storeID:storeid,
          storeName:storename,
          tenantID:tenantid,
        })
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },

  storeChange: function (e) {
    this.setData({
      storeindex:e.detail.value,
    });
  },

  remarkInput: function(e) {
    this.setData({
      remark: e.detail.value,
    });
  },

  delBind: function (e){
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
                'id': data[id].dispatchlistid,
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
    //提交新建进货单
    wx.request({
      url: `${config.service.host}/weapp/storage/addDispatchList`,
      data: [loginInfo,
        { 
          'type': 1, 
          'tenant': that.data.tenantID[that.data.storeindex],
          'tostore': that.data.storeID[that.data.storeindex],
          'remark': that.data.remark, 
        }],
      method: 'POST',
      header: { 'content-type': 'application/json' },
      success: function (result) {
        console.log(result)
        wx.redirectTo({
          url: "/pages/dispatch/importDetail?id=" + result.data.insertId + "&tenant=" + that.data.tenantID[that.data.storeindex],
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
    wx.redirectTo({
      url: "/pages/dispatch/importDetail?id=" + that.data.list[id].dispatchlistid + "&tenant=" + that.data.list[id].tenantid ,
    });
  },
})
