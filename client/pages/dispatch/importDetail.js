var config = require('../../config')
 
// importList.js
Page({

  data: {
    dispatchListID: 0,
    existedModel: false,
    modelInList: false,
    model: {},
    modelNameList: [],
    styleValue: [],
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
    wx.request({
      url: `${config.service.host}/weapp/storage/queryDispatchDetail`,
      data: {
        dispatchid: options.id,
      },
      method: 'GET',
      success: function (result) {
        var modelnamelist = wx.getStorageSync('modelNameList.' + result.data[0].tenantid);
        var tenantStyle = wx.getStorageSync('tenantStyle')[result.data[0].tenantid];
        var stylevaluelist = [];
        for (var x in tenantStyle) {
          var itemlist = wx.getStorageSync('styleValueList.' + result.data[0].tenantid + '.' + tenantStyle[x].styleid);
          stylevaluelist[tenantStyle[x].styleid] = itemlist;
        }
        that.setData({
          modelNameList: modelnamelist,
          styleValueList: stylevaluelist,
          dispatchListID: options.id,
          style: tenantStyle,
          dispatch: result.data[0], 
          list: result.data[1],
        })
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
    //尝试获取款号
    wx.request({
      url: `${config.service.host}/weapp/storage/getModel`,
      data: {
        openid: loginInfo.openid,
        tenant: that.data.dispatch.tenantid,
        model: e.detail.value,
      },
      method: 'GET',
      success: function (result) {
        if (result.data.length > 0) {
          var m = result.data[0];
          m.price = parseFloat(m.price).toFixed(2);
          m.cost = parseFloat(m.cost).toFixed(2);
          //判断款号是否在货单列表中
          var inlist = false;
          for (var x in that.data.list) {
            if (that.data.list[x].modelid == m.modelid) {
              inlist = true;
            }
          }
          that.setData({
            model: m,
            existedModel: true,
            modelInList: inlist,
          })
        }
        else {
          that.setData({
            model: { modelcode: e.detail.value },
            existedModel: false,
            modelInList: false,
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
    s[e.target.id] = that.data.styleValueList[e.target.id][e.detail.value];
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
      err = that.createModel(that.createDetail);
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
        wx.request({
          url: `${config.service.host}/weapp/storage/queryDispatchDetail`,
          data: {
            dispatchid: that.data.dispatchListID,
          },
          method: 'GET',
          success: function (result) {
            that.setData({
              dispatch: result.data[0],
              list: result.data[1],
            })
            if (that.data.dispatch.finishtime != null){
              wx.redirectTo({
                url: "pages/menu/menu",
              });
            }
          },
          fail: function (err) {
            console.log(err);
          }
        })
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

    var opt = { 'tenantid': that.data.dispatch.tenantid };
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
        //todo:set to existed model,update stylelist and namelist
        that.setData({
          existedModel: true,
          model: opt,
        });
        updateStyle();
        return next(result.data);
      },
      fail: function (err) {
        console.log(err);
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
          amount: that.data.list[x].amount,
        });
      }
    }
  },
  delDetail: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    if (e.currentTarget.id == 'd') {
      //删除条目
      wx.showModal({
        title: '提示',
        content: '确定要删除这个进货条目吗？\r\n款号：' + that.data.model.modelcode,
        success: function (sm) {
          if (sm.confirm) {
            //确认删除条目
            wx.request({
              url: `${config.service.host}/weapp/storage/delDispatchDetail`,
              data: [loginInfo,
                {
                  dispatchlistid: that.data.dispatchListID,
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
                  modelInList: false,
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
    } else {
      //删除款式
      wx.showModal({
        title: '提示',
        content: '确定要删除这个款式吗？\n注意：只有没有被使用（进货/销售）过的款式才能被删除。',
        success: function (sm) {
          if (sm.confirm) {
            var data = that.data.list;
            //确认删除货单
            wx.request({
              url: `${config.service.host}/weapp/storage/delModel`,
              data: [loginInfo,
                {
                  id: that.data.model.modelid,
                }],
              method: 'POST',
              header: { 'content-type': 'application/json' },
              success: function (result) {
                wx.showToast({
                  title: '删除了' + result.data.affectedRows + '行数据。',
                  icon: 'success'
                })
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
    }
  },
  updateStyle: function () {
    var that = this;
    var item = that.data.modelName;
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
    wx.setStorageSync('modelNameList.' + that.data.dispatch.tenantid, itemlist);

    itemlist = that.data.styleValueList;
    for(var x in that.data.style){
      var stylelist = itemlist[that.data.style[x].styleid];
      var style = that.data.styleValue[that.data.style[x].styleid];

      for (var y in stylelist) {
        if (stylelist[y] == style) {
          stylelist.splice(y, 1);
          break;
        }
      }
      stylelist.unshift(style);
      stylelist.splice(20);

      itemlist[that.data.style[x].styleid] = stylelist;

      wx.setStorageSync('styleValueList.' + that.data.dispatch.tenantid + '.' + that.data.style[x].styleid, stylelist);
    }
    that.setData({
      styleValueList: itemlist,
    });
  },
  finish: function () {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    wx.showModal({
      title: '提示',
      content: '确定要完成进货单吗？\n注意：完成进货单后就不能再修改进货单里面的条目和数量了，请再次确认!',
      success: function (sm) {
        if (sm.confirm) {
          //确认删除货单
          wx.request({
            url: `${config.service.host}/weapp/storage/finishDispatch`,
            data: [loginInfo,
              {
                dispatchlistid: that.data.dispatchListID,
              }],
            method: 'POST',
            header: { 'content-type': 'application/json' },
            success: function (result) {
              wx.redirectTo({
                url: "/pages/store/instoreConfirm?id=" + that.data.dispatchListID,
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
})
