'use strict';

const path = require('path');
const fs = require('fs');

const webpack = require('webpack');
const _ = require('lodash');
const glob = require('glob');
const SpritesmithPlugin = require('webpack-spritesmith');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
const CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
const DefinePlugin = webpack.DefinePlugin;

const pkg = require('../package.json');
const srcDir = path.resolve(process.cwd(), 'src');
const assets = path.resolve(process.cwd(), 'dist');
const nodeModPath = path.resolve(__dirname, '../node_modules');
const pathMap = require('../src/pathmap.json');



/**
 * 需要合并成雪碧图的文件夹列表 路径为(src/images/*)
 * 雪碧图排列属性
 *     -> algorithm 默认为 "binary-tree"
 *         -> [top-down left-right diagonal alt-diagonal binary-tree]
 */
const sprites = [
    {
        folderName: 'sprite',     // 文件夹名
        algorithm : ''            // 雪碧图排列方式 默认为 binary-tree
    },

    {
        folderName: 'mc',         // 文件夹名
        algorithm : 'left-right'  // 雪碧图排列方式
    }
];


let entries = (() => {
    let jsDir = path.resolve(srcDir, 'js')
    let entryFiles = glob.sync(jsDir + '/*.{js,jsx}')
    let map = {}

    entryFiles.forEach((filePath) => {
        let filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'))
        map[filename] = filePath
    })

    return map
})();
let chunks = Object.keys(entries);

module.exports = (options) => {
    // 获取参数
    let env = process.argv[2] || process.env.NODE_ENV
    options = options || {}

    let dev = options.dev !== undefined ? options.dev : true
    // 这里publicPath要使用绝对路径，不然scss/css最终生成的css图片引用路径是错误的，应该是scss-loader的bug
    let publicPath = '/'
    let extractCSS
    let cssLoader
    let sassLoader

    // generate entry html files
    // 自动生成入口文件，入口js名必须和入口文件名相同
    // 例如，a页的入口文件是a.html，那么在js目录下必须有一个a.js作为入口文件
    let plugins = (() => {
        let entryHtml = glob.sync(srcDir + '/*.html')
        let r = []

        entryHtml.forEach((filePath) => {
            let filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'))
            let conf = {
                template: 'html!' + filePath,
                filename: filename + '.html'
            }

            if(filename in entries) {
                conf.inject = 'body'
                conf.chunks = ['vender', 'common', filename]
            }

            if('b' === filename || 'c' === filename) conf.chunks.splice(2, 0, 'common-b-c')
            // dll打包过的库，只能通过script标签引入？？
            // if('react-demo' === filename) conf.chunks.splice(2, 0, 'reactStuff')

            r.push(new HtmlWebpackPlugin(conf))
        })

        return r
    })()

    // 没有真正引用也会加载到runtime，如果没安装这些模块会导致报错，有点坑
    /*plugins.push(
        new webpack.ProvidePlugin({
            React: 'react',
            ReactDOM: 'react-dom',
            _: 'lodash', 按需引用
            $: 'jquery'
        })
    )*/

    if(dev) {
        extractCSS = new ExtractTextPlugin('css/[name].css?[contenthash]')
        cssLoader = extractCSS.extract('style', ['css'])
        sassLoader = extractCSS.extract('style', ['css', 'sass'])
        plugins.push(extractCSS, new webpack.HotModuleReplacementPlugin())
    } else {
        extractCSS = new ExtractTextPlugin('css/[name].min.css?[contenthash:8]', {
            // 当allChunks指定为false时，css loader必须指定怎么处理
            // additional chunk所依赖的css，即指定`ExtractTextPlugin.extract()`
            // 第一个参数`notExtractLoader`，一般是使用style-loader
            // @see https://github.com/webpack/extract-text-webpack-plugin
            allChunks: false
        })
        cssLoader = extractCSS.extract('style', ['css?minimize'])
        sassLoader = extractCSS.extract('style', ['css?minimize', 'sass'])

        plugins.push(
            extractCSS,
            new UglifyJsPlugin({
                compress: {
                    warnings: false
                },
                output: {
                    comments: false
                },
                mangle: {
                    except: ['$', 'exports', 'require']
                }
            }),
            // use `production` mode
            new DefinePlugin({'process.env': {'NODE_ENV': JSON.stringify('production')}}),
            // new AssetsPlugin({
            //     filename: path.resolve(assets, 'source-map.json')
            // }),
            new webpack.optimize.DedupePlugin(),
            new webpack.NoErrorsPlugin()
        )
    }

    // 为雪碧图生成时间戳
    var _timestamp = Math.round(new Date().getTime()/1000);
    // 添加生成雪碧图的插件
    for (var i = 0; i < sprites.length; i++) {
        var _sprite = sprites[i];
        plugins.push(// 合成雪碧图
            new SpritesmithPlugin({
                // 目标小图标
                src: {
                    cwd: './src/images/'+ _sprite.folderName,
                    glob: '*.png'
                },
                // 输出雪碧图文件及样式文件
                /*target: {
                    image: './src/images/'+ _sprite.folderName +'.png',
                    css  : './src/css/'+ _sprite.folderName +'.css'
                },*/
                target: {
                    image: './src/images/'+ _sprite.folderName +'.png',
                    css  : [['./src/scss/sprites/'+ _sprite.folderName +'.scss', {
                        format: 'handlebars_based_template'
                    }]]
                },

                // 样式文件中调用雪碧图地址写法
                apiOptions: {
                    cssImageRef: '../../images/'+ _sprite.folderName +'.png',
                    generateSpriteName :function(fileName){
                        var parsed = path.parse(fileName);
                        var dir = parsed.dir.split(path.sep);
                        var moduleName = dir[dir.length - 1];
                        return moduleName + '-' + parsed.name;
                    }
                },
                spritesmithOptions: {
                    algorithm : _sprite.algorithm || 'binary-tree',//top-down left-right diagonal alt-diagonal binary-tree
                    padding   : 3
                },
                customTemplates:{
                    handlebars_based_template : path.resolve(__dirname, './sprite_template/pxscss.template.mustache')
                }
            }))
    }

    // webpack loaders
    let _loaders = [
        {
            test: /\.((woff2?|svg)(\?v=[0-9]\.[0-9]\.[0-9]))|(woff2?|svg|jpe?g|png|gif|ico|es6)$/,
            loaders: [
                // url-loader更好用，小于10KB的图片会自动转成dataUrl，
                // 否则则调用file-loader，参数直接传入
                'url?limit=10000&name=img/[name].[ext]?[hash:8]',
                'image?{bypassOnDebug:true, progressive:true,optimizationLevel:3,pngquant:{quality:"65-80",speed:4}}'
            ],
        },
        // 文件小于10KB 转成base64
        {
            test: /\.((ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9]))|(ttf|eot)$/,
            loader: 'url?limit=10000&name=fonts/[name].[ext]?[hash:8]'
        },
        //{test: /\.(tpl|ejs)$/, loader: 'ejs'},
        {test: /\.css$/, loader: cssLoader},
        {test: /\.scss$/, loader: sassLoader},
        /*{
          test: /\.(jpg|png|svg)$/,
          loader: 'file-loader',
          options: {
            name: '[path][name].[hash].[ext]',
          },
        },*/
        /*{test: /\.png$/, loaders: [
            'file-loader?name=i/[hash].[ext]'
        ]}*/
    ]

    // 是否要支持es6语法
    if(env === 'es6') _loaders.push({test: /\.js$/, loader: 'babel'});

    let config = {
        entry: Object.assign(entries, {
            // 用到什么公共lib（例如React.js），就把它加进vender去，目的是将公用库单独提取打包
            'vender': ['zepto'],
            // 'reactStuff': 'assets/dll/js/reactStuff.js'
        }),

        output: {
            path: assets,
            filename: dev ? '[name].js' : 'js/[name].min.js?[chunkhash:8]',
            chunkFilename: dev ? 'chunk.js?[chunkhash:8]' : 'js/chunk.min.js?[chunkhash:8]',
            hotUpdateChunkFilename: dev ? '[id].js' : 'js/[id].min.js?[chunkhash:8]',
            publicPath: publicPath
        },

        resolve: {
            root: [srcDir, nodeModPath],
            alias: pathMap,
            extensions: ['', '.js', '.css', '.scss', '.tpl', '.png', '.jpg'],
            //webpack 1:
            modulesDirectories: ["node_modules", "spritesmith-generated"],
            //webpack 2:
            modules: ["node_modules", "spritesmith-generated"]
        },

        module: {
            loaders: _loaders
        },

        plugins: [
            // 提取公共代码
            new CommonsChunkPlugin({
                name: 'common-b-c',// 注意不要.js后缀
                chunks: ['b', 'c']
            }),
            new CommonsChunkPlugin({
                name: 'common',// 注意不要.js后缀
                chunks: ['common-b-c', 'a']
            }),
            new CommonsChunkPlugin({
                name: 'vender',// 注意不要.js后缀
                chunks: ['common']
            })
        ].concat(plugins),

        devServer: {
            // hot: true,
            noInfo: false,
            inline: true,
            publicPath: publicPath,
            stats: {
                cached: false,
                colors: true
            }
        }
    }

    if(dev) {
        // 为实现webpack-hot-middleware做相关配置
        // @see https://github.com/glenjamin/webpack-hot-middleware
        ((entry) => {
            for (let key of Object.keys(entry)) {
                if (! Array.isArray(entry[key])) {
                    entry[key] = Array.of(entry[key])
                }
                entry[key].push('webpack-hot-middleware/client?reload=true')
            }
        })(config.entry)

        config.plugins.push(new webpack.HotModuleReplacementPlugin())
        config.plugins.push(new webpack.NoErrorsPlugin())
    } else {
        // @see https://github.com/th0r/webpack-bundle-analyzer
        // config.plugins.push(new BundleAnalyzerPlugin(pkg.bundleAnalyzerConf))
    }

    return config;
}
