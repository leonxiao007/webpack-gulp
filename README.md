# webpack-gulp

基于webpack搭建纯静态页面型前端工程解决方案模板。支持es6

### 拷贝项目模板
	$ git clone https://github.com/leonxiao007/webpack-gulp.git

### 安装软件
	Node.js：v4.0+

### 安装依赖模块

``` bash
$ npm install -g gulp webpack
$ npm install -g node-dev # 推荐这个工具，代码改动会自动重启node进程
$ cd webpack-gulp && npm install
```

### 启动本地开发服务器
  $ npm run start


### 自定义配置
##### ./configs/custom.config.js
``` js
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

```



### 业务开发

##### 目录结构

``` js
.
├── gulpfile.js                          # gulp任务配置
├── mock/                                # 假数据文件
├── package.json                         # 项目配置
├── README.md                            # 项目说明
├── .babelrc                             # babel配置
├── server                               # 本地server
│   ├── app.js                           # 本地server入口
│   ├── home.html                        # 列出项目所有入口文件
│   └── routes.js                        # 本地路由配置
├── src                                  # 源码目录
│   ├── index.html                       # 入口文件index
│   ├── images/                          # 图片资源
│   ├── css/                             # css资源
│   ├── scss/                            # scss资源
│   ├── js                               # js&jsx资源
│   │   ├── index.js                     # index页面入口
│   │   ├── components/                  # 组件
│   │   ├── lib/                         # 没有存放在npm的第三方库或者下载存放到本地的基础库，如jQuery、Zepto、React等
│   │   └── utils/                       # 业务无关的辅助工具
│   └── pathmap.json                     # 手动配置某些模块的路径，可以加快webpack的编译速度
├── configs                              # webpack 配置
└── ├── custom.config.js                 # 自定义参数
    ├── webpack.base.config.js           # 基本配置
    ├── webpack.dev.config.js            # 开发环境
    └── webpack.prod.config.js           # 生产环境
        ├── pxscss.template.mustache.js  # 图片精灵css 单位为px
        └── remscss.template.mustache.js # 图片精灵css 单位为rem

```

##### 单/多页面支持

约定`/src/*.html`为应用的入口文件，在`/src/js/`一级目录下有一个同名的js文件作为该入口文件的逻辑入口（即entry）。

在编译时会扫描入口html文件并且根据webpack配置项解决entry的路径依赖，同时还会对html文件进行压缩、字符替换等处理。

这样可以做到同时支持SPA和多页面型的项目。

### 编译

``` bash
$ npm run build
```

### 模拟生产环境 需 先 build

``` bash
$ npm run start-release
```

### 部署&发布

纯静态页面型的应用，最简单的做法是直接把`dist`文件夹部署到指定机器即可（先配置好机器ip、密码、上传路径等信息【如果是OSS则省略】）：

``` js
$ npm run deploy # or run `gulp deploy`
```

如果需要将生成的js、css、图片等发布到cdn，修改下`publicPath`项为目标cdn地址即可：

``` js
...
output: {
  ...
  publicPath: debug ? '' : 'http://cdn.site.com/'
}
...
```
