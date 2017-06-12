module.exports = {
	// 是否开启es6语法
	es6         : false,
	/**
	 * 需要合并成雪碧图的文件夹列表 路径为(src/images/*)
	 * 雪碧图排列属性
	 *     -> algorithm 默认为 "binary-tree"
	 *         -> [top-down left-right diagonal alt-diagonal binary-tree]
	 */
	sprites     : [
		{
	        folderName: 'sprite',     // 文件夹名
	        algorithm : ''            // 雪碧图排列方式 默认为 binary-tree
	    }
	],

	// 图片文件大小小于该参数时自动转成base64(以字节为单位)
	limitBase64 : '10000',

	// 用到什么公共lib（例如React.js），就把它加进vender去，目的是将公用库单独提取打包
	vender      : ['zepto']
}
