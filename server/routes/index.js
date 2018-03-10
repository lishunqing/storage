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

router.post('/store/query', controllers.store.query)
router.post('/store/addsell', controllers.store.addsell)
router.post('/store/querysell', controllers.store.querysell)

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


router.post('/storage/queryImportList', controllers.dispatch.queryImportList)
router.post('/storage/addImportList', controllers.dispatch.addImportList)
router.post('/storage/delImportList', controllers.dispatch.delImportList)
router.post('/storage/addImportDetail', controllers.dispatch.addImportDetail)
router.post('/storage/delImportDetail', controllers.dispatch.delImportDetail)
router.post('/storage/queryImportDetail', controllers.dispatch.queryImportDetail)
router.post('/storage/finishImport', controllers.dispatch.finishImport)
router.post('/storage/addArrive', controllers.store.addArrive)


router.post('/storage/queryDispatchList', controllers.dispatch.queryDispatchList)
router.get('/storage/queryInstoreList', controllers.dispatch.queryInstoreList)
router.post('/storage/addDispatchList', controllers.dispatch.add)
router.post('/storage/delDispatchList', controllers.dispatch.del)
router.post('/storage/addDispatchDetail', controllers.dispatch.addDetail)
router.post('/storage/delDispatchDetail', controllers.dispatch.delDetail)
router.post('/storage/finishDispatch', controllers.dispatch.finishDispatch)
router.post('/storage/instore', controllers.dispatch.instore)
router.post('/storage/outstore', controllers.dispatch.outstore)
router.post('/storage/queryDispatchDetail', controllers.dispatch.queryDetail)
module.exports = router
