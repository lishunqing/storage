var config = require('../../config')

// importList.js
Page({

  data: {
    dispatchListID: 0,
    tenantID: 0,
    existedModel: false,
    model: {},
    styleValue: [],
    modelNameList: ['上衣', '衬衫', '裤子'],
    styleValue: [],
    styleList: [[], ['红', '黄', '绿'], ['s', 'm', 'l']],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    if ((options.id != undefined) && (options.tenant != undefined)) {
      var tenantStyle = wx.getStorageSync('tenantStyle')[options.tenant];
      that.setData({
        dispatchListID: options.id,
        tenantID: options.tenant,
        style: tenantStyle,
      });
    }
    //获取已有订单列表
    wx.request({
      url: `${config.service.host}/weapp/storage/queryDispatchList`,
      data: [],
      method: 'GET',
      success: function (result) {
        that.setData({ list: result.data })
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },

  codeInput: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');

    if (!e.detail.value) {
      that.setData({
        model: {},
        existedModel: false,
      })
      return;
    }
    //获取已有订单列表
    wx.request({
      url: `${config.service.host}/weapp/storage/getModel`,
      data: {
        openid: loginInfo.openid,
        tenant: that.data.tenantID,
        model: e.detail.value,
      },
      method: 'GET',
      success: function (result) {
        if (result.data.length > 0) {
          var m = result.data[0];
          m.price = parseFloat(m.price).toFixed(2);
          m.cost = parseFloat(m.cost).toFixed(2);
          that.setData({
            model: m,
            existedModel: true,
          })
        }
        else {
          that.setData({
            model: { modelcode: e.detail.value },
            existedModel: false,
          })
        }
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },
  nameInput: function (e) {
    var that = this;
    if (e.target.id == "p") {
      that.setData({
        modelName: that.data.modelNameList[e.detail.value],
      })
    } else {
      that.setData({
        modelName: e.detail.value,
      })
    }
  },
  priceInput: function (e) {
    var that = this;
    if (e.detail.value) {
      var price = parseFloat(e.detail.value).toFixed(2);
      if (price == 'NaN') {
        price = '';
      }
      that.setData({
        modelPrice: price,
      })
    }
  },
  costInput: function (e) {
    var that = this;
    if (e.detail.value) {
      var cost = parseFloat(e.detail.value).toFixed(2);
      if (cost == 'NaN') {
        cost = '';
      }
      that.setData({
        modelCost: cost
      })
    }
  },
  amountInput: function (e) {
    var that = this;
    if (e.detail.value) {
      that.setData({
        amount: parseInt(e.detail.value),
      })
    }
  },
  styleInput: function (e) {
    var that = this;
    var s = that.data.styleValue;
    s[e.target.id] = e.detail.value;
    that.setData({
      styleValue: s,
    })
  },
  stylePicker: function (e) {
    var that = this;
    var s = that.data.styleValue;
    s[e.target.id] = that.data.styleList[e.target.id][e.detail.value];
    that.setData({
      styleValue: s,
    })
  },

  addDetail: function (e) {
    var that = this;
    var err;
    if (that.data.existedModel) {
      err = that.createDetail(that.data.model.modelid);
    } else {
      err = that.createModel(createDetail);
    }

    if (err) {
      wx.showModal({
        title: '错误',
        content: err,
        showCancel: false
      })
      return;
    }
  },

  createDetail: function (id) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    //校验数量
    if ((that.data.amount == undefined) || (that.data.amount == "")) {
      return '数量不能为空';
    }
    //提交新的款式
    wx.request({
      url: `${config.service.host}/weapp/storage/addDispatchDetail`,
      data: [loginInfo, {
        dispatchlistid: that.data.dispatchListID,
        modelid: id,
        amount: that.data.amount,
      }],
      method: 'POST',
      header: { 'content-type': 'application/json' },
      success: function (result) {
        console.log(result)
        return;
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },

  createModel: function (next) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');

    var opt = { 'tenantid': that.data.tenantID };
    //校验modecode不为空
    if (that.data.model.modelcode == undefined) {
      return '款号不能为空';
    }
    opt.modelcode = that.data.model.modelcode;
    //校验name
    if ((that.data.modelName == undefined) || (that.data.modelName == "")) {
      return '名称不能为空';
    }
    opt.name = that.data.modelName;
    //校验价格
    if ((that.data.modelPrice == undefined) || (that.data.modelPrice == "")) {
      return '价格不能为空';
    }
    opt.price = that.data.modelPrice;
    //校验各个style
    for (var x in that.data.style) {
      var s = that.data.style[x];
      if ((that.data.styleValue[s.styleid] == undefined) || (that.data.styleValue[s.styleid] == "")) {
        return s.stylename + '不能为空';
      }
      opt["style" + s.styleid] = that.data.styleValue[s.styleid];
    }
    if (that.data.modelCost) {
      opt.cost = that.data.modelCost;
    } else {
      opt.cost = 0;
    }

    //提交新的款式
    wx.request({
      url: `${config.service.host}/weapp/storage/addModel`,
      data: [loginInfo, opt],
      method: 'POST',
      header: { 'content-type': 'application/json' },
      success: function (result) {
        console.log(result)
        return next(result);
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },
})
