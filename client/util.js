const getTime = date => {
  function N(n) {
    n = n.toString()
    return n[1] ? n : '0' + n
  };
  return date.getFullYear() + '-' + N(date.getMonth() + 1) + '-' + N(date.getDate()) + ' ' + N(date.getHours()) + ':' + N(date.getMinutes()) + ':' + (date.getSeconds());
}

const getDate = date => {
  function N(n) {
    n = n.toString()
    return n[1] ? n : '0' + n
  };
  return date.getFullYear() + '-' + N(date.getMonth() + 1) + '-' + N(date.getDate());
}

const getMinute = date => {
  function N(n) {
    n = n.toString()
    return n[1] ? n : '0' + n
  };
  return N(date.getHours()) + ':' + N(date.getMinutes());
}

// 显示繁忙提示 
var showBusy = text => wx.showToast({ 
  title: (text)?text:'工作中...',
  icon: 'loading',
  duration: 10000
}) 
// 显示关闭提示 
var stopBusy = () => {
  wx.hideToast();
}
// 显示成功提示 
var showSuccess = text => wx.showToast({ 
  title: (text) ? text : '成功！',
  icon: 'success'
}) 
// 显示失败提示 
var showError = (title, content) => {
  wx.hideToast();
  wx.showModal({
    title,
    content: content,
    showCancel: false
  }) 
}
// 显示失败提示 
var showModel = (title, content) => {
  wx.hideToast();
  wx.showModal({ 
    title,
    content: JSON.stringify(content),
    showCancel: false
  }) 
} 
module.exports = { getTime, getDate, getMinute, showBusy, stopBusy, showSuccess, showError, showModel } 