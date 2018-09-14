
const gulp=require('gulp')//引入gulp

const config=require('./config') //取出index，省略index
const htmlmin=require('gulp-htmlmin')//压缩HTML
const connect=require('gulp-connect')//热更新服务器
const concat=require('gulp-concat')//合并文件
const minifycss=require('gulp-minify-css')//压缩css
const autoprefixer=require('gulp-autoprefixer')//给css加前缀
const rename=require('gulp-rename')//重命名
const merge=require('merge-stream')//合并文件操作流
const webpack=require('webpack-stream')//小型webpack
const inject=require('gulp-inject')//自动引入依赖文件
const sass=require('gulp-sass')


//处理html，将src中的html文件输出到dist中
gulp.task('handle:html', function () {     
	gulp.src('./src/views/*/*.html')
//		.pipe(htmlmin(config.htmloptions))
		.pipe(gulp.dest('./dist'))
})

//处理、合并、压缩，前缀，输出css
gulp.task('handle:css',function(){//合并多个css
	let streams=[]//存放下面多个文件流的数组	
	for(const page in config.cssoptions){//遍历多个页面
		for(const file in config.cssoptions[page]){//遍历各个页面中的多个打包css文件配置
			let stream=gulp.src(config.cssoptions[page][file])
        		.pipe(sass())
        		.pipe(autoprefixer({//自动加前缀
            		browsers: ['last 2 versions','Safari >0', 'Explorer >0', 'Edge >0', 'Opera >0', 'Firefox >=20'],//last 2 versions- 主流浏览器的最新两个版本
            		cascade: false, //是否美化属性值 默认：true 像这样：
            		//-webkit-transform: rotate(45deg);
            		//        transform: rotate(45deg);
            		remove:true //是否去掉不必要的前缀 默认：true 
        		}))
        	.pipe(concat(file+'.css'))//合并文件
        	.pipe(minifycss())//压缩文件
        	.pipe(rename({suffix:'.min'}))//重命名
        	.pipe(gulp.dest('./dist/'+ page +'/css'))//输出对应的目录中
		
		streams.push(stream)//把当前文件流存放到数组中
		}
	}
	return merge(...streams)//合并多个文件流
})
//处理js es6->es5 合并 压缩	
gulp.task('handle:js',function(){
/*	return gulp.src('src/entry.js')//自定义
		//处理js
		.pipe(webpack({
			mode:'production',//设置打包模式：none development production
		*/	//单入口 单出口
//			entry:'./src/views/index/javascripts/index.js',//入口
//			output:{
//				filename:'index.js'
//			}
			//多入口 单出口 数组中，谁在前面，打包时也在前面
//			entry:['./src/views/index/javascripts/index.js','./src/views/index/javascripts/vendor.js'],//入口
//			output:{
//				filename:'index.js'
//			}
//
//			//多入口多出口
//			entry:{
//				index:'./src/views/index/javascripts/index.js',
//				vendor:'./src/views/index/javascripts/vendor.js'
//				},//入口
//			output:{
//				filename:'[name].min.js' //[name]代表在entry 中键名是什么，打包出来就是什么
//			}	
//		}))
//		.pipe(gulp.dest('./dist/index/js'))
	let streams=[]
	for(const page in config.jsoptions){
		//判断如果入口是数组或字符串的话就是单出口，否则为多出口
		let entry=config.jsoptions[page]
		let filename=Array.isArray(entry)||((typeof entry)==='string')? page:'[name]'
		let stream=gulp.src('src/entry.js')
			.pipe(webpack({
				mode:'production',
				entry:entry,
				output:{filename:filename+'.min.js'},
				module:{
					rules:[//webpack中在这里使用各种loader对代码进行各种编译
						{
							test:/\.js$/, //对js文件进行处理
							loader:'babel-loader', //使用babel-loader对其进行处理
							query:{
								presets:['es2015'] //将es6编译一下
							}
						}
					]
				}
			}))
			.pipe(gulp.dest('./dist/'+page+'/js'))
		streams.push(stream)	
	}
	return merge(...streams)
})
	
gulp.task('inject', function () {
  setTimeout(()=>{  		
  	config.pages.forEach(page=>{
  		var target = gulp.src('./dist/'+page+'/index.html');
  		// It's not necessary to read the files (will speed up things), we're only after their paths:
  		var sources = gulp.src(['./dist/'+page+'/js/*.js', './dist/'+page+'/css/*.css'], {read: false});
 
  		target.pipe(inject(sources,{ignorePath:'/dist'}))
  		  .pipe(gulp.dest('./dist/'+page+''));
  	})
  },1000)
});	


//监听函数
gulp.task('watch',function(){
	gulp.watch('./src/views/*/*.html',['handle:html','inject','reload'])	
	gulp.watch('./src/**/*.scss',['handle:css','inject','reload'])
	gulp.watch('./src/**/*.js',['handle:js','inject','reload'])	
	//通配符中*所指的是儿子这一代，**指的是所有的后代
})

//创建热更新服务器
gulp.task('server',function(){
	connect.server(config.serveroptions);
})

//服务器刷新任务
gulp.task("reload",function(){
	return gulp.src("./dist/**/*.html")//让所有的html文件都重新加载一下
		.pipe(connect.reload());
})


//默认任务
gulp.task('default',['server','handle:html','handle:css','handle:js','inject','watch'])
