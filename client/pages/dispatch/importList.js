var config = require('../../config')
Page({

  data: {
    list:[],
    storeID:[],
    storeName:[],
    index:0,
    remark:'',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    //获取已有订单列表
    wx.request({
      url: `${config.service.host}/weapp/storage/queryImportList`,
      data: [loginInfo,
        {}],
      method: 'POST', 
      success: function(result){
        var storeid = new Array();
        var storename = new Array();
        for (var x in result.data[1]) {
          storeid[x] = result.data[1][x].storeid;
          storename[x] = result.data[1][x].name;
        };
        that.setData({
          storeName: storename,
          storeID: storeid,
          list: result.data[0],
        })
      },
      fail: function(err){
        console.log(err);
      }
    })
  },

  storeChange: function (e) {
    this.setData({
      index:e.detail.value,
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
            url: `${config.service.host}/weapp/storage/delImportList`,
            data: [loginInfo,
              {
                'importlistid': data[id].importlistid,
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
      url: `${config.service.host}/weapp/storage/addImportList`,
      data: [loginInfo,
        { 
          storeid: that.data.storeID[that.data.index],
          remark: that.data.remark, 
          createuser: loginInfo.userid,
        }],
      method: 'POST',
      header: { 'content-type': 'application/json' },
      success: function (result) {
        console.log(result)
        wx.redirectTo({
          url: "/pages/dispatch/importDetail?id=" + result.data,
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
      url: "/pages/dispatch/importDetail?id=" + that.data.list[id].importlistid,
    });
  },
})
