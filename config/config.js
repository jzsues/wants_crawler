var path = require('path');
module.exports = {
	server : 'wants crawler',
	poweredBy : 'harold jiang',
	// 监听端口
	listenPort : 1234,
	// 绝对目录地址，下面的目录配置都是根据这个目录的相对地址，这里是根据config文件进行配置地址
	baseDir : path.join(__dirname, '/..'),
	autoRouter : true,// 自动路由
	controllerFolderPath : "/controller",// 自动路由匹配controller相对于baseDir的目录名称
	connectTimeout : 30000,
	charset : 'utf-8',
	favicon : '/favicon.ico', // favicon存放地址
	autoCreateFolders : true,
	isMongodb : true, // 是否开启mongodb支持，注意：如果使用数据库存储session，这里必须开启
	MongodbIp : '127.0.0.1', // mongodb地址
	MongodbPort : 27017, // mongodb端口
	MongodbConnectString : false, // 是否使用字符串连接，日入nae的连接方法，这个优先级高于地址+端口
	MongodbConnectTimeout : 1000 * 30,// 连接超时
	MongodbMaxConnect : 100,// 连接池连接数
	MongodbDefaultDbName : 'crawler',// 默认使用的数据库名
	poolLogger : false,// 是否记录连接池的日志，建议关闭
	isLog : false, // 是否开启日志，过多的记录日志会影响性能，但是能记录系统运行情况
	logLevel : 'debug',// ['trace','debug','info','warn','error', 'fatal'] 日志等级
	logPath : '/mylogs/console.log', // "/mylogs/console.log" 日志存放目录
	logMaxSize : 1024 * 1024 * 10, // 单个日志文件大小
	logFileNum : 10,// 当单个日志文件大小达标时，自动切分
	// session配置
	isSession : true, // 是否开启session，开启会影响性能。
	syncSession : false,// 当多进程时是否开启session同步，开启会影响性能。
	sessionName : 'wantsSid', // 保存session id 的cookie 的name
	sessionExpire : false, // false表示会话session，否则填入1000*60，表示session有效1分钟
	clearSessionSetInteval : 1000 * 60 * 60, // 自动清理垃圾session时间，建设设置为1小时
	clearSessionTime : 1000 * 60 * 60 * 24 * 7,// 会话session超时，建议设置为1天
	// 是否使用mongodb数据库存储session，如果设置为true，则不需要同步session
	sessionDbStore : true,
	// 自动响应静态文件的uri，比如 http://rrestjs.com/static/rrest.jpg
	// 将会自动响应给客户端，为了加速这里只能设置一级目录
	autoStatic : '/static',
	// 自动响应静态文件的根目录，比如 http://rrestjs.com/static/rrest.jpg 将返回
	// baseDir+'/example/static/rrest.jpg'
	staticFolderPath : '/view/static',
	// 是否开启静态文件压缩整合功能
	staticParse : true,
	// 压缩整合功能的名称，例如用户可以'/static/?parse=/index.body.css|/index.user.css|/user.face.css'压缩整合成一个css响应给客户端
	staticParseName : 'parse',
	// 压缩整合缓存时间，1小时
	staticParseCacheTime : 1000 * 60 * 60,
	// 缓存整合功能的缓存文件夹
	staticParseCacheFolder : '/tmp/static',
	// 整合压缩css或js文件的最大上限，建议不要超过15
	staticParseMaxNumber : 10,
	// 文件上传的临时目录
	uploadFolderPath : '/tmp/upload',
	// 限制上传的postbody大小，单位byte
	postLimit : 1024 * 1024 * 1,
	// 是否开启delate和gizp压缩，大并发压缩虽然可以减少传输字节数，但是会影响性能
	isZlib : true,
	// 只压缩数组中的content-type响应
	ZlibArray : [ 'text/plain', 'application/javascript', 'text/css', 'application/xml', 'text/html' ],
	// 最大并发http连接数
	httpConnectPoolSize : 25,
	// 最大db并发连接数
	dbConnectPoolSize : 10

}