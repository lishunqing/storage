/**
 * ajax 服务路由集合
 */
const router = require('koa-router')({
    prefix: '/weapp'
})
const controllers = require('../controllers')

// 从 sdk 中取出中间件
// 这里展示如何使用 Koa 中间件完成登录态的颁发与验证
//const { auth: { authorizationMiddleware, validationMiddleware } } = require('../qcloud')

// --- 登录与授权 Demo --- //
// 登录接口
//router.get('/login', authorizationMiddleware, controllers.login)
// 用户信息接口（可以用来验证登录态）
//router.get('/user', validationMiddleware, controllers.user)

// --- 图片上传 Demo --- //
// 图片上传接口，小程序端可以直接将 url 填入 wx.uploadFile 中
//router.post('/upload', controllers.upload)

// --- 信道服务接口 Demo --- //
// GET  用来响应请求信道地址的
//router.get('/tunnel', controllers.tunnel.get)
// POST 用来处理信道传递过来的消息
//router.post('/tunnel', controllers.tunnel.post)

// --- 客服消息接口 Demo --- //
// GET  用来响应小程序后台配置时发送的验证请求
//router.get('/message', controllers.message.get)
// POST 用来处理微信转发过来的客服消息
//router.post('/message', controllers.message.post)


// --业务消息
router.get('/print/task', controllers.print.getPrintTask)
router.post('/print/device', controllers.print.getPrintDevice)
router.post('/print/queryImportList', controllers.print.queryImportList)
router.post('/print/addTagTask', controllers.print.addTagTask)

router.post('/store/queryItem', controllers.store.queryItem)
router.post('/store/query', controllers.store.query)
router.post('/store/addsell', controllers.store.addsell)
router.post('/store/querysell', controllers.store.querysell)
router.post('/store/queryrefund', controllers.store.queryrefund)

router.post('/item/add', controllers.item.add)
router.post('/item/queryRec', controllers.item.queryRec)

router.get('/storage/login', controllers.user.getLogin)
router.post('/storage/saveUser', controllers.user.save)
router.post('/storage/userList', controllers.user.queryList)
router.post('/storage/disable', controllers.user.disable)
router.post('/storage/queryPrivilege', controllers.user.queryPrivilege)
router.post('/storage/savePrivilege', controllers.user.savePrivilege)


router.post('/storage/getModel', controllers.model.query)
router.post('/storage/addModel', controllers.model.add)
router.post('/storage/delModel', controllers.model.del)
router.post('/storage/modModel', controllers.model.mod)

router.post('/report/storereport', controllers.report.storereport)
router.post('/report/sellreport', controllers.report.sellreport)
router.post('/report/sellmodel', controllers.report.sellmodel)


router.post('/dispatch/queryImportList', controllers.dispatch.queryImportList)
router.post('/dispatch/addImportList', controllers.dispatch.addImportList)
router.post('/dispatch/delImportList', controllers.dispatch.delImportList)
router.post('/dispatch/addImportDetail', controllers.dispatch.addImportDetail)
router.post('/dispatch/modImportDetail', controllers.dispatch.modImportDetail)
router.post('/dispatch/delImportDetail', controllers.dispatch.delImportDetail)
router.post('/dispatch/queryImportDetail', controllers.dispatch.queryImportDetail)
router.post('/dispatch/queryArriveDetail', controllers.dispatch.queryArriveDetail)

module.exports = router
