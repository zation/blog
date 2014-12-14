---
title: 国内项目天坑记（二）
subtitle: Gruntfile的模块化
date: 2014-06-09 23:31 +08:00
tags: Grunt
---

在大型项目中用过Grunt的都知道，当自动化的配置和task多了一个，一个Gruntfile.js文件可能有好几百行，这样维护非常困难，于是对Gruntfile的模块化势在必行。感谢[墨磊](http://zhuanlan.zhihu.com/tla42)同学帮助我们做了模块化！以下内容都是他的实践。#READMORE#

本质上Gruntfile.js就是一个node.js代码文件，所以我们可以很方便的用[CommonJS](http://www.commonjs.org)的规范将Gruntfile.js模块化。下面我们首先来看看模块化以后的grunt目录结构：

	Gruntfile.js
	grunt/
		compile/
			compass.js
			concat.js
			uglify.js
			...
		dev/
			jshint.js
			connect.js
			...
		config.js
		tasks.js

这里要提一下grunt模块划分，一般是根据task的不同来划分的。而[gulp](http://gulpjs.com/)是根据处理的文件类型的不同来划分的。

Gruntfile.js所做的事情就很简单了，只是加载tasks.js：

	'use strict';
	
	module.exports = function (grunt) {
		// load tasks
		require('./grunt/tasks.js')(grunt);
	};

tasks.js负责加载和注册所有的tasks和config.js：

	module.exports = function (grunt) {
	
		require('./config.js')(grunt);
	
		grunt.loadTasks('./grunt/compile');
		grunt.loadTasks('./grunt/dev');
		
		grunt.registerTask('some tasks', function () {
			//...
		});
		
		return grunt;
	};

**注意：**这里`grunt.loadTasks()`方法的路径是相对于Gruntfile.js的。

config.js负责配置项目相关的属性：

	module.exports = function (grunt) {
		grunt.initConfig({
			// configurable paths
			server: {
				hostname: '0.0.0.0',
				hostport: '9000'
			},
			testServer: {
				hostname: 'localhost',
				hostport: '9001'
			},
			yeoman: {
				app: 'app',
				dist: 'dist',
				test: 'test',
				tmp: '.tmp'
			}
		});
		
		return grunt;
	};

compile文件夹下的tasks是在build production package的时候用到的，dev文件夹下的tasks是在开发环境中用到的，这里也可以根据项目的实际情况进行分类。

这里我认为还可以做优化的地方在于：

* 使用.json配置文件代替.js配置文件，并且预先设订好对于不同环境的配置文件，例如：config.json.development, config.json.production, config.json.staging, config.json.test... 不同的环境中就使用不同的配置文件，这样让所有的配置文件都可以做版本管理，而且也更加统一。
* 使用npm将这些配置代码都打包，放到另一个独立的github repo中，这样可以简化项目结构和代码，同时也利于这些代码在其他项目中的共用。

这些优化我已经在新的项目中进行过尝试了，效果挺不错的，后面会写一篇更加详细的文章来进行介绍。