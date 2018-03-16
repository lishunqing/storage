var config = require('../../config')
var util = require('../../util')
 
// importList.js
Page({

  data: {
    id: 0,
    existedModel: false,
    modelInList: false,
    model: {},
    modelNameList: [],
    styleValueList: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    if (options.id == undefined){
      wx.redirectTo({
        url: "/pages/menu/menu",
      });
    }
    that.setData({
      id: options.id,
    })
    that.loadList();
  },

  loadList:function(){
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    util.showBusy();
    wx.request({
      url: `${config.service.host}/weapp/dispatch/queryImportDetail`,
      data: [loginInfo, {
        importlistid: that.data.id,
      }],
      method: 'POST',
      success: function (result) {
        var modelnamelist = wx.getStorageSync('modelNameList.' + result.data[0].tenantid);
        if ((modelnamelist == undefined) || (modelnamelist == '')) {
          var tenantlist = wx.getStorageSync('tenantList');
          for (var x in tenantlist) {
            if (tenantlist[x].tenantid == result.data[0].tenantid) {
              modelnamelist = tenantlist[x].namelist.split(',');
            }
          }
        }
        var tenantStyle = wx.getStorageSync('tenantStyle')[result.data[0].tenantid];
        var stylevaluelist = [];
        for (var x in tenantStyle) {
          var itemlist = wx.getStorageSync('styleValueList.' + result.data[0].tenantid + '.' + tenantStyle[x].styleid);
          if ((itemlist == undefined) || (itemlist == '')) {
            itemlist = tenantStyle[x].stylelist.split(',');
          }
          stylevaluelist[tenantStyle[x].styleid] = itemlist;
        }
        that.setData({
          modelNameList: modelnamelist,
          styleValueList: stylevaluelist,
          style: tenantStyle,
          importList: result.data[0],
          list: result.data[1],
        })
        util.stopBusy();
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })
  },

  codeInput: function (e) {
    var that = this;

    if (!e.detail.value) {
      that.setData({
        model: {},
        existedModel: false,
      })
      return;
    }
    that.queryCode(e.detail.value);
  },
  queryCode:function(code,next){
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    //尝试获取款号
    util.showBusy();
    wx.request({
      url: `${config.service.host}/weapp/storage/getModel`,
      data: [loginInfo, {
        tenant: that.data.importList.tenantid,
        model: code,
        exactly: true,
      }],
      method: 'POST',
      success: function (result) {
        if (result.data[0].length > 0) {
          var m = result.data[0];
          m[0].price = parseFloat(m[0].price).toFixed(2);
          m[0].cost = parseFloat(m[0].cost).toFixed(2);
          that.setData({
            model: m[0],
            modellist: m,
            existedModel: true,
            modelInList: false,
          })
        }
        else {
          that.setData({
            model: { modelcode: code },
            existedModel: false,
            modelInList: false,
            modellist: [],
          })
        }
        if (next){
          var id = that.getModelID();
          return that.createDetail(id);
        }
        util.stopBusy();
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })
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

  getModelID: function(){
    //尝试从modellist中获取model的modelid
    var that = this;
    for(var x in that.data.modellist){
      if (that.data.model.modelcode != that.data.modellist[x].modelcode){
        continue;
      }
      var matched = true;
      for(var y in that.data.style){
        var s = "style" + that.data.style[y].styleid;
        if (that.data.model[s] != that.data.modellist[x][s]) {
          matched = false;
          break;
        }
      }
      if (matched){
        return that.data.modellist[x].modelid;
      }
    }
    return undefined;
  },

  addDetail: function (e) {
    var that = this;
    var err;

    var id = that.getModelID();
    if (id) {
      err = that.createDetail(id);
    } else {
      err = that.createModel(that.createDetail);
    }

    if (err) {
      util.showModel('错误', err);
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
    util.showBusy();
    wx.request({
      url: `${config.service.host}/weapp/dispatch/addImportDetail`,
      data: [loginInfo, {
        importlistid: that.data.id,
        modelid: id,
        amount: that.data.amount,
        cost: that.data.model.cost,
      }],
      method: 'POST',
      header: { 'content-type': 'application/json' },
      success: function (result) {
        that.loadList();
        util.stopBusy();
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })
  },

  createModel: function (next) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');

    var opt = { 'tenantid': that.data.importList.tenantid };
    //校验modecode不为空
    if (that.data.model.modelcode == undefined) {
      return '款号不能为空';
    }
    opt.modelcode = that.data.model.modelcode;
    //校验name
    if ((that.data.model.name == undefined) || (that.data.model.name == "")) {
      return '名称不能为空';
    }
    opt.name = that.data.model.name;
    //校验价格
    if ((that.data.model.price == undefined) || (that.data.model.price == "")) {
      return '价格不能为空';
    }
    opt.price = that.data.model.price;
    //校验各个style
    for (var x in that.data.style) {
      var s = "style" + that.data.style[x].styleid;
      if ((that.data.model[s] == undefined) || (that.data.model[s] == "")) {
        return that.data.style[x].stylename + '不能为空';
      }
      opt[s] = that.data.model[s];
    }
    if (that.data.model.cost) {
      opt.cost = that.data.model.cost;
    } else {
      opt.cost = 0;
    }

    //提交新的款式
    util.showBusy();
    wx.request({
      url: `${config.service.host}/weapp/storage/addModel`,
      data: [loginInfo, opt],
      method: 'POST',
      header: { 'content-type': 'application/json' },
      success: function (result) {
        //提交款式成功以后重新查询款式
        that.updateStyle();
        return that.queryCode(opt.modelcode,next);
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })
  },
  choose: function (e) {
    var that = this;
    for (var x in that.data.list) {
      var t = that.data.list[x];
      if (that.data.list[x].modelid == e.currentTarget.id) {
        that.setData({
          existedModel: true,
          modelInList: true,
          model: that.data.list[x],
          amount: that.data.list[x].totalamount,
        });
      }
    }
  },
  delDetail: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    //删除条目
    wx.showModal({
      title: '提示',
      content: '确定要删除这个进货条目吗？\r\n款号：' + that.data.model.modelcode,
      success: function (sm) {
        if (sm.confirm) {
          //确认删除条目
          util.showBusy();
          wx.request({
            url: `${config.service.host}/weapp/dispatch/delImportDetail`,
            data: [loginInfo,
              {
                importlistid: that.data.id,
                modelid: that.data.model.modelid,
              }],
            method: 'POST',
            header: { 'content-type': 'application/json' },
            success: function (result) {
              var data = that.data.list;
              for (var x in data) {
                if (data[x].modelid == that.data.model.modelid) {
                  data.splice(x, 1);
                  break;
                }
              }
              that.setData({
                list: data,
                model: {},
                existedModel: false,
                modelInList: false,
                amount: "",
              });
              util.stopBusy();
            },
            fail: function (err) {
              util.showModel('网络异常', err);
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
    wx.setStorageSync('modelNameList.' + that.data.importList.tenantid, itemlist);

    itemlist = that.data.styleValueList;
    for(var x in that.data.style){
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

      wx.setStorageSync('styleValueList.' + that.data.importList.tenantid + '.' + that.data.style[x].styleid, stylelist);
    }
    that.setData({
      styleValueList: itemlist,
    });
  },
})
