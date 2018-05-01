var config = require('../../config')
var util = require('../../util')
  
// importList.js
Page({

  data: {
    id: 0,
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

  importInput: function (e) {
    var that = this;
    var i = that.data.importList;
    if (e.target.id == 'perfix'){
      i.perfix = e.detail.value;
      that.queryCode(i.perfix + i.code);
    } else if (e.target.id == 'name') {
      i.name = e.detail.value;
    } else if (e.target.id == 'code') {
      i.code = e.detail.value;
      that.queryCode(i.perfix + i.code);
    }

    that.setData({
      importList:i,
    });
  },
  codeInput: function (e) {
    var that = this;
    that.queryCode(e.detail.value);
  },
  queryCode:function(code,e){
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
          })
          if (e) {
            var modelid = that.getModelID(e,m);
            if (modelid){
              that.createDetail(modelid,e);
            }
          }
        }
        else {
          that.setData({
            model: { modelcode: code },
          })
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
    } else if (e.detail.value){
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
    var m = that.data.model;
    m.totalamount = parseInt(e.detail.value);
    if (e.detail.value) {
      that.setData({
        model: m,
      })
    }
  },
  styleInput: function (e) {
    var that = this;
    var m = that.data.model;
    m["style" + e.target.id] = e.detail.value;
    m.id = null;
    that.setData({
      model: m,
    })
  },
  stylePicker: function (e) {
    var that = this;
    var m = that.data.model;
    m["style" + e.target.id] = that.data.styleValueList[e.target.id][e.detail.value];
    m.id = null;
    that.setData({
      model: m,
    })
  },

  getModelID: function(model,modellist){
    //尝试从modellist中获取model的modelid
    var that = this;
    for(var x in modellist){
      var matched = true;
      for(var y in that.data.style){
        var s = "style" + that.data.style[y].styleid;
        if (model[s] != modellist[x][s]) {
          matched = false;
          break;
        }
      }
      if (matched){
        return modellist[x].modelid;
      }
    }
    return undefined;
  },

  addDetail: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');

    //校验数量
    if (e.detail.value.totalamount == "") {
      return util.showError('错误', '数量不能为空');
    }

    if (that.data.model.id){
      //更新进货条目
      util.showBusy();
      wx.request({
        url: `${config.service.host}/weapp/dispatch/modImportDetail`,
        data: [loginInfo, {
          totalamount: e.detail.value.totalamount,
          id: that.data.model.id,
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
    }else{
      that.createModel(e.detail.value);
    }

  },

  createDetail: function (id,e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');

    //提交新的款式
    util.showBusy();
    wx.request({
      url: `${config.service.host}/weapp/dispatch/addImportDetail`,
      data: [loginInfo, {
        importlistid: that.data.id,
        importname:e.importname,
        importperfix:e.importperfix,
      },{
        importlistid: that.data.id,
        modelid: id,
        totalamount: e.totalamount,
        cost: e.cost,
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

  createModel: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');

    var opt = { 'tenantid': that.data.importList.tenantid };
    //校验modecode不为空
    if ((!e.importperfix) && (!e.importcode) && (!e.modelcode)) {
      return util.showError('错误', '款号不能为空');
    }
    if (e.modelcode){
      opt.modelcode = e.modelcode;
    }else{
      opt.modelcode = e.importperfix + e.importcode;
    }

    if (!that.data.model.modelid){
      //校验name
      if (!e.name) {
        return util.showError('错误', '名称不能为空');
      }
      opt.name = e.name;
      //校验价格
      if (!e.price) {
        return util.showError('错误', '价格不能为空');
      }
      opt.price = e.price;
    }else{
      opt.name = that.data.model.name;
      opt.price = that.data.model.price;
    }

    //校验各个style
    for (var x in that.data.style) {
      var s = "style" + that.data.style[x].styleid;
      if (!e[s]) {
        return util.showError('错误', that.data.style[x].stylename + '不能为空');
      }
      opt[s] = e[s];
    }
    opt.cost = parseFloat(e.cost).toFixed(2);
    if (opt.cost == 'NaN') {
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
        return that.queryCode(opt.modelcode,e);
      },
      fail: function (err) {
        util.showModel('网络异常', err);
      }
    })
  },
  choose: function (e) {
    var that = this;
    that.setData({
      model: that.data.list[e.currentTarget.id],
    })
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
                id: that.data.model.id,
              }],
            method: 'POST',
            header: { 'content-type': 'application/json' },
            success: function (result) {
              var data = that.data.list;
              for (var x in data) {
                if (data[x].id == that.data.model.id) {
                  data.splice(x, 1);
                  break;
                }
              }
              that.setData({
                list: data,
                model: {},
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
