var config = require('../../config')

// importList.js
Page({

  data: {
    choosed: false,
    model: {},
    modellist:[],
    modelNameList: [],
    styleValueList: [],
    tenantNameList:[],
    tenantIDList:[],
    tenantIdx:0,
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
    for(var x in permission){
      if (permission[x].privilegeid != 1){
        continue;
      }
      var newTenant = true;
      for (var y in tenantIDList){
        if (permission[x].tenantid == tenantIDList[y]){
          newTenant = false;
          break;
        }
      }
      if (newTenant){
        tenantIDList.push(permission[x].tenantid);
        tenantNameList.push(permission[x].tenantname);
      }
    }
    that.setData({
      tenantIDList: tenantIDList,
      tenantNameList: tenantNameList,
    })
    var e = {detail:{value:0}};
    that.tenantInput(e);
  },
  getDevice: function (id) {
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
      },
      fail: function (err) {
        console.log(err);
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
      fail: (res) => {
        console.log(res);
        wx.showToast({
          title: '没有二维码',
          icon: 'success',
          duration: 2000
        })
      },
      complete: (res) => {
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
        model:model,
      })
      return;
    }
    //尝试获取款号
    wx.request({
      url: `${config.service.host}/weapp/storage/getModel`,
      data: [loginInfo,{
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
          })
        }
        else {
          that.setData({
            modellist: [],
            choosed: false,
            model: model,
          })
        }
      },
      fail: function (err) {
        console.log(err);
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
  nameInput: function (e) {
    var that = this;
    var m = that.data.model;
    if (e.target.id == "p") {
      m.name = that.data.modelNameList[e.detail.value];
    } else {
      m.name = e.detail.value;
    }
    that.setData({
      model: m
    })
  },
  priceInput: function (e) {
    var that = this;
    var m = that.data.model;
    if (e.detail.value) {
      m.price = parseFloat(e.detail.value).toFixed(2);
      if (m.price == 'NaN') {
        m.price = '';
      }
      that.setData({
        model: m,
      })
    }
  },
  costInput: function (e) {
    var that = this;
    var m = that.data.model;
    if (e.detail.value) {
      m.cost = parseFloat(e.detail.value).toFixed(2);
      if (m.cost == 'NaN') {
        m.cost = '';
      }
      that.setData({
        model: m,
      })
    }
  },
  styleInput: function (e) {
    var that = this;
    var m = that.data.model;
    m["style" + e.target.id] = e.detail.value;
    that.setData({
      model: m,
    })
  },
  stylePicker: function (e) {
    var that = this;
    var m = that.data.model;
    m["style" + e.target.id] = that.data.styleValueList[e.target.id][e.detail.value];

    that.setData({
      model: m,
    })
  },
  amountInput: function (e) {
    var that = this;
    if (e.detail.value) {
      that.setData({
        amount: parseInt(e.detail.value),
      })
    }
  },
  updateModel: function () {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');

    var opt = { 'modelid': that.data.model.modelid };
    //校验name
    if ((that.data.model.name == undefined) || (that.data.model.name == "")) {
      wx.showModal({
        title: '错误',
        content: '名称不能为空',
        showCancel: false
      })
      return;
    }
    opt.name = that.data.model.name;
    //校验价格
    if ((that.data.model.price == undefined) || (that.data.model.price == "")) {
      wx.showModal({
        title: '错误',
        content: '价格不能为空',
        showCancel: false
      })
      return;
    }
    opt.price = that.data.model.price;
    //校验各个style
    for (var x in that.data.style) {
      var s = "style" + that.data.style[x].styleid;
      if ((that.data.model[s] == undefined) || (that.data.model[s] == "")) {
        wx.showModal({
          title: '错误',
          content: that.data.style[x].stylename + '不能为空',
          showCancel: false
        })
        return;
      }
      opt[s] = that.data.model[s];
    }
    if (that.data.model.cost) {
      opt.cost = that.data.model.cost;
    } else {
      opt.cost = 0;
    }

    //提交新的款式
    wx.request({
      url: `${config.service.host}/weapp/storage/modModel`,
      data: [loginInfo, opt],
      method: 'POST',
      header: { 'content-type': 'application/json' },
      success: function (result) {
        that.updateStyle();
        //重新尝试获取款号
        that.codeInput({ detail: { value: that.data.model.modelcode}});
        wx.showToast({
          title: '更新成功!',
          icon: 'success'
        })
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },
  deleteModel: function () {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    wx.showModal({
      title: '提示',
      content: '确定要删除这个款式吗？\n注意：只有没有被使用（进货/销售）过的款式才能被删除。',
      success: function (sm) {
        if (sm.confirm) {
          //确认删除货单
          wx.request({
            url: `${config.service.host}/weapp/storage/delModel`,
            data: [loginInfo,
              {
                modelid: that.data.model.modelid,
              }],
            method: 'POST',
            header: { 'content-type': 'application/json' },
            success: function (result) {
              //重新尝试获取款号
              if (result.data.code == -1) {
                wx.showModal({
                  title: '删除失败！',
                  content: '可能该款式已经被使用过。\n' + result.data.error,
                  showCancel: false
                })
              } else {
                that.codeInput({ detail: { value: that.data.model.modelcode } });
                wx.showToast({
                  title: '删除成功!',
                  icon: 'success'
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
  updateStyle: function () {
    var that = this;
    var item = that.data.model.name;
    var itemlist = that.data.modelNameList;
    for (var x in itemlist) {
      if (itemlist[x] == item) {
        itemlist.splice(x, 1);
        break;
      }
    }
    itemlist.unshift(item);
    itemlist.splice(20);
    that.setData({
      modelNameList: itemlist,
    });
    wx.setStorageSync('modelNameList.' + that.data.tenantIDList[that.data.tenantIdx], itemlist);

    itemlist = that.data.styleValueList;
    for (var x in that.data.style) {
      var stylelist = itemlist[that.data.style[x].styleid];
      var style = that.data.model["style" + that.data.style[x].styleid];

      for (var y in stylelist) {
        if (stylelist[y] == style) {
          stylelist.splice(y, 1);
          break;
        }
      }
      stylelist.unshift(style);
      stylelist.splice(20);

      itemlist[that.data.style[x].styleid] = stylelist;

      wx.setStorageSync('styleValueList.' + that.data.tenantIDList[that.data.tenantIdx] + '.' + that.data.style[x].styleid, stylelist);
    }
    that.setData({
      styleValueList: itemlist,
    });
  },
})
