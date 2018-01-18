var config = require('../../config')

Page({

  /**
   * 页面的初始数据
   */
  data: {
  
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    if (options.id == undefined) {
      wx.redirectTo({
        url: "/pages/menu/menu",
      });
    }
    //获取已有权限列表
    wx.request({
      url: `${config.service.host}/weapp/storage/queryPrivilege`,
      data: [loginInfo, {
        userid: options.id,
      }],
      method: 'POST',
      success: function (result) {
        var s = 0;
        var r = result.data[0];
        var l = [];
        var y = -1;
        for(var x in r){
          if (s != r[x].storeid){
            l.push([r[x]]);
            s = r[x].storeid;
          }else{
            l[l.length - 1].push(r[x]);
          }
        }
        that.setData({
          list: l,
          user: result.data[1],
        })
      },
      fail: function (err) {
        console.log(err);
      }
    })  
  },
  disable: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    //获取已有订单列表
    wx.request({
      url: `${config.service.host}/weapp/storage/disable`,
      data: [loginInfo, {
        userid: that.data.user.userid,
      }],
      method: 'POST',
      success: function (result) {
        if (result.data[0].affectedRows == 1) {
          var u = that.data.user;
          u.disabled = 1 - u.disabled;
          that.setData({ user: u });
        }
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },
  permissionChange: function(e){
    console.log(e);
    var that = this;
    var u = that.data.list;
    
    for(var x in u[e.target.id]){
      u[e.target.id][x].permission = 0;
    }
    for(var x in e.detail.value){
      u[e.target.id][e.detail.value[x]].permission = 1;
    }

    that.setData({
      list:u,
    });
  },
  save: function (e) {
    var del = [];
    var ins = [];
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    for(var x in that.data.list){
      for(var y in that.data.list[x]){
        if (that.data.list[x][y].permission){
          ins.push({
            userid: that.data.user.userid,
            privilegeid: that.data.list[x][y].privilegeid,
            storeid: that.data.list[x][y].storeid,
          });
        }
          del.push({
            userid: that.data.user.userid,
            privilegeid: that.data.list[x][y].privilegeid,
            storeid: that.data.list[x][y].storeid,
          });
        
      }
    }

   //获取已有订单列表
    wx.request({
      url: `${config.service.host}/weapp/storage/savePrivilege`,
      data: [loginInfo, del, ins],
      method: 'POST',
      success: function (result) {
        console.log(result);
        if (result.data.code == 0){
          wx.showToast({
            title: '保存成功!',
            icon: 'success'
          })
        }
      },
      fail: function (err) {
        console.log(err);
      }
    })
    
  }
})

