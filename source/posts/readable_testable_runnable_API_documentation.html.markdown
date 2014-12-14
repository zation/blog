---
title: 编写易读、可测试、可运行的API文档
date: 2014-12-09 11:31 +08:00
tags: Document, API Blueprint
---

![Document](document.jpg "Document")

自从开放的API接口在社交媒体以及Web 2.0中运用的越来越广泛，API已经成为了互联网产品的标准配置。并且不光是对外提供API，对于前后端分离的应用，API也是非常重要的一部分。编写一个好的API，不光是代码写得好，最重要的是文档写得好。但是我们在写文档的时候尝尝会遇到下面几个问题：

* 没有统一的编写规范，这样不同的人在维护的时候尝尝会导致文档越来越乱，最终无法继续维护，也无法阅读。
* API修改以后，文档没有跟着改，或者改错了，导致API的使用者无法正常调用。
* 作为前端开发，往往是在API开发完成以前，就要根据API的文档准备一些mock data来帮助开发，如果API文档可以直接生成一个mock server，就会非常方便

下面我们来看看如何构建能够解决以上问题的，完美的文档。#READMORE#

### API Blueprint

所谓没有规矩，不成方圆。现在我要介绍的，就是一个API文档的规范：[API Blueprint](https://apiblueprint.org/)。这个文档规范有以下的特点：

* 基于[Markdown](http://daringfireball.net/projects/markdown/)，所以比较容易上手，同时机器和人都容易理解。
* 由于是纯文本，所以可以进行版本管理。
* 有非常多的相关工具，可以转为HTML，可以测试，可以作为Mock Server运行。

这里是API Blueprint的[格式文档](https://github.com/apiaryio/api-blueprint/blob/master/API%20Blueprint%20Specification.md)，如果觉得字太多了不好理解，这里还有一个[简化的教程](https://github.com/apiaryio/api-blueprint/blob/master/Tutorial.md)。下面是一个简单的实例，包含了基本的元素及其说明：

	# 这里是API的名字
	这里是API的描述

	## 这里是Resource的名字 [/uri/to/resouce]
	这里是Resource的描述
	
	### 这里是Action的名字，后面跟Type [GET]
	这里是Action的描述，下面就是Request与Response的示例了

	+ Response 200
		
		+ Headers
			
			Content-Type: application/json
			
		+ Body
			
			{
				"id": 1
				"name": "some name"
			}
		
现在我们有了一份基本的API文档了，下面我们来介绍如何让这份文档更加可读，并且可以测试和运行。

**注：**下面我会使用一个更加真实的[API文档示例](https://github.com/danielgtaylor/aglio/blob/master/example.md)，并且之后所有的代码都可以在[这里](https://github.com/zation/API-blueprint-demo)下载。

### 转化为更加易读的HTML页面

API Blueprint现在有两个开源工具可以生成静态HTML：[aglio](https://github.com/danielgtaylor/aglio)和[iglo](https://github.com/subosito/iglo)，这里使用aglio作为示例。并且为了我们可以实时的看到修改以后生成的HTML，我们同时引入了gulp作为实时的构建工具。

首先，我们定义一个task，命名为document，用来生成HTML，以及实时刷新页面：

	'use strict';
	
	var gulp = require('gulp');
	var aglio = require('gulp-aglio');
	var connect = require('gulp-connect');
	var watch = require('gulp-watch');
	
	gulp.task('document', function() {
	  return gulp.src(['documents/API.md'])
	    .pipe(watch('documents/API.md'))
	    .pipe(aglio({template: 'default', filename: './.tmp/index.html'}))
	    .pipe(gulp.dest('./.tmp/'))
	    .pipe(connect.reload());
	});

然后，我们创建一个task来启动静态页面服务器：

	gulp.task('server', function() {
	  return connect.server({
	    root: ['./.tmp'],
	    port: 3456,
	    livereload: {
	      port: 35728
	    }
	  });
	});

然后，为了方便，我们加上一个自动打开该静态页面的task：

	var gopen = require('gulp-open');
	
	gulp.task('open', function() {
	  return gulp.src('./gulpfile.js')
	    .pipe(gopen('', {
	      url: 'http://localhost:3456'
	    }));
	});

最后，把上面的task加到默认的gulp task中：

	gulp.task('default', ['server', 'document', 'open']);

现在，可以运行`gulp`来自动生成HTML的task了，并且浏览器会自动打开该页面。

**注：**

* 由于aglio请求了很多外部静态资源，特别是google font，所以可能页面会打不开，我们可以写自己的template修正这个问题。
* 由于aglio的一些依赖的需求，它只能运行在Node 11.10之前，建议使用Node 10.*。

### 模块化的管理API文档

我们看到现在的API.md文件有283行，这还是只包含了三个group的。如果API的数量更多，那么全都写在一个markdown文件中会非常难以维护。这个时候我们就需要把一个markdown文件，拆分成多个，并且gulp脚本也需要一定的处理。

首先，我们将API.md按照group，拆分为notes.md、users.md、tags.md。然后，我们需要在脚本中将这几个文件生成为一个，所以我们需要修改document task：

	var gulp = require('gulp');
	var aglio = require('gulp-aglio');
	var connect = require('gulp-connect');
	var continuousConcat = require('gulp-continuous-concat');
	var watch = require('gulp-watch');
	
	gulp.task('document', function() {
	  return gulp.src(['documents/API.md', 'documents/*.md'])
	    .pipe(watch('documents/*.md'))
	    .pipe(continuousConcat('API.md'))
	    .pipe(aglio({template: 'default', filename: './.tmp/index.html'}))
	    .pipe(gulp.dest('./.tmp/'))
	    .pipe(connect.reload());
	});

**注：**这里使用`gulp-continuous-concat`而没有使用`gulp-concat`，是因为后者只在stream结束的时候才真的进行concat，这样就没有办法跟`gulp-watch`一起用了，因为`gulp-watch`是会让stream永久运行的。而`gulp-continuous-concat`就没有这个限制。

### 将API文档作为Mock Server

作为一个前端开发，可能一个最头痛的问题就是与API的集成了。在实际开发的过程中，前后端会按照相互之间商量好的API分别开发，最后再集成到一起。但是后台API是尝尝会改动的，所以我们会遇到两个问题：后台改动后没有通知前端；后台修改并且通知后，前端没有修改mock的数据。这两种情况的结果都是集成失败，并且有可能前端需要一定的返工。

那么怎么样才可以避免这个问题呢？只要我们保证文档就是Mock Server的数据来源，那么后台对于文档的任何修改，前端在开发过程中肯定会立刻知晓，并且也会反应在Mock Data上面。这也是我选用Api Blueprint的一大原因。下面我们来看看如何将API文档作为Mock Server启动起来。

实际上非常简单，只需要安装`api-mock`，然后运行`api-mock xxx.md`就可以了。但是由于我们之前将文档拆分了，那么在启动之前需要我们先build一份完整的文档出来，所以我们需要在gulp脚本中加入下面这个task：

	var connect = require('gulp-connect');
	
	gulp.task('build', function() {
	  return gulp.src(['documents/API.md', 'documents/*.md'])
	    .pipe(concat('API.md'))
	    .pipe(gulp.dest('./.tmp/'));
	});

然后为了方便运行，可以修改`package.json`的`scrips`：

	"scripts": {
	  "start": "gulp build && api-mock ./.tmp/API.md --port 3457"
	}

然后运行`npm start`就可以启动Mock Server了，你可以访问[http://localhost:3457/notes/1](http://localhost:3457/notes/1)来测试一下。

### 测试你的文档

最后，我们还剩下唯一一个问题，就是如何保证我们的API文档与真实的API是一致的？自动化测试是一个有效的保证，[Dredd](https://github.com/apiaryio/dredd)就是这样一个基于API Blueprint提供自动化测试的工具。

Dredd的使用也很方便，只需要运行`dredd xxx.md http://url/to/api-server`就可以了。为了方便，我们可以把测试脚本放在`package.json`的`scripts`中：

	"scripts": {
	  "test": "gulp build && dredd ./.tmp/API.md http://localhost:3458",
	  "start": "gulp build && api-mock ./.tmp/API.md --port 3457"
	}

同时我用express创建了一个简单的后台，使用`node server.js`就可以启动，然后就可以运行`npm test`查看文档测试的结果了。

### 总结

虽然我们有了一个非常完美的文档系统，但是文档的本质作用是用于沟通，如果团队内部相互沟通的意愿不强烈，那么再好的工具没有办法用好，也不可能使用某个工具就可以建立起沟通的意愿。所以在团队建设的过程中，沟通、优化、负责等等好的意愿的建立是首位的，然后才是寻找到适合团队的工具来帮助解决问题，更好的发挥意愿。








