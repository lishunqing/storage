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

    //获取已有订单列表
    wx.request({
      url: `${config.service.host}/weapp/dispatch/queryImportList`, 
      data: [loginInfo,
        {}],
      method: 'POST', 
      success: function(result){
        that.setData({
          tenantIDList: tenantIDList,
          tenantNameList: tenantNameList,
          list: result.data[0],
        })
      },
      fail: function(err){
        console.log(err);
      }
    })
  },

  change: function (e) {
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
            url: `${config.service.host}/weapp/dispatch/delImportList`,
            data: [loginInfo,
              {
                'importlistid': data[id].importlistid,
              }],
            method: 'POST',
            header: { 'content-type': 'application/json' },
            success: function (result) {
              if (result.data.affectedRows == 1){
                data.splice(id, 1);
                that.setData({
                  list: data,
                });
              }else{
                wx.showModal({
                  title: '删除失败',
                  content: '可能的远因：进货单不为空。\n细节:' + result.data.error,
                  showCancel: false
                })
              }
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
      url: `${config.service.host}/weapp/dispatch/addImportList`,
      data: [loginInfo,
        { 
          tenantid: that.data.tenantIDList[that.data.index],
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
