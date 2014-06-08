---
title: 国内项目天坑记
subtitle: 大型官方网站中的前端选型
date: 2014-06-05 21:08 +08:00
tags: Backbone.js
---

一年多的时间没有写博客了，这段时间一直在加班加点的赶一个国内官方网站项目，基本12*6的工作时间让博客荒废了这么久，现在终于有些时间总结整理一下这个项目中的一些坑和经验。之所以叫做天坑记而不是填坑记，是因为该坑连绵不绝，是一个堪称有生之年的坑……

项目开始的初期，面临着很多许多技术选型，选的好可以让后面的开发事半功倍，选的不好……就只能自己埋的坑自己填了。

### 选型的注意事项

现在回过头来看，做技术选型有下面几个要点：

1. 不要选择团队不熟悉的技术。即使一些新的技术看起来非常诱人又具有挑战性，除非团队中有牛人签了卖身契和军令状保证可以搞定因为新技术所产生的问题。实在逼不得已也要选一个学习成本低，文档和社区资源丰富的。我们团队的很多加班就是因为选择了一个我们不熟悉又没什么文档和社区资源的CMS系统……所以技术选型一定要根据团队成员已有的技术来考虑。
2. 前期做好充足的技术调研。项目风险的最大爆发点，就在于未知，只有前期花功夫做好了技术调研，才可以控制好项目风险，做到心中有底，特别在有其他系统需要集成或者有老系统需要改造的情况下，更要了解好已有的系统接口和数据库是否可以满足新的业务需求。
3. 在需求上与客户达成基本一致。我们所有的技术选型都是基于需求的，如果基本需求没有理解好，或者没有与客户达成一致，那么中后期很有能有整个技术架构无法满足业务需求的情况，这个时候如果要推翻已有架构重新开发，那将是一个巨大的风险，甚至可能项目失败。

在做技术选型的过程中，团队可以快速开发一些demo让客户试用，来验证我们选择的技术是否可以满足客户的需求，同时验证一些技术难点是否可以解决，还可以让团队成员先预热一下。

### 前端框架的选型

这个项目的主要需求包括三部分：

1. 由于是官网网站，所以肯定会有针对新闻公告、活动促销、业务介绍等的内容管理和发布系统。
2. 客户希望在官方网站上，提供几个核心业务的自助功能，方便用户也降低自己人力的成本。
3. 兼容性需求：完全兼容IE8及以上的IE浏览器，和Chrome, Firefox, Safari等现代浏览器，对于IE6, IE7可以样式不一致，但是功能要可用。

由此可以引申出下面的一些前端技术要求：

* 网站的自助查询部分要求可以根据API返回的数据，动态渲染页面。
* 前端框架不能够太新，否则会导致IE6, IE7上功能不可用。
* 由于是官方网站，对于网站的样式有很高的要求，所以样式代码肯定会很多，需要有一个很好的管理方式。
* 网站中可能会有很多重复的部分，需要我们选择的框架可以方便的写可复用的组件。
* 官网网站的访问量很大，同时国内的带宽有限，需要选择体积较小的框架。
* 出于ThoughtWorks的传统，我们需要选择一个利于自动化和测试的框架。

根据上面的要求以及我们团队成员的已有技能，我们选择了下面的架构：

* JS MVC: Backbone.js。在比较过Angular.js, Ember.js等框架以后，选择了小巧、学习曲线平滑的Backbone.js
* CSS: SASS & Compass。由于SASS框架上有Compass的支持，所以我在选择CSS框架时不会有其他的想法。
* Automation: Grunt。虽然现在Gulp很火，但是由于yeoman的主要generator还是用的Grunt，所以最我们还是选了Grunt。
* Dependency Manager: Require.js。有了一个Dependency Manager可以比较方便的看到依赖的情况，但是也给重构带来了一定的阻碍。
* Test: jasmine。选择jasmine也是因为团队比较熟悉，出来的时间比较长。

### 我们的问题和优化

每个技术都有自身的一些问题，下面就是基于我们已有的选型和问题，所做的一些优化。也有一些问题暂时无解……

#### Gruntfile模块化

在大型项目中用过Grunt的都知道，当自动化的配置和task多了一个，一个Gruntfile.js文件可能有好几百行，这样维护非常困难，于是对Gruntfile的模块化势在必行。感谢[墨磊](http://zhuanlan.zhihu.com/tla42)同学帮助我们做了模块化！以下内容都是他的实践。

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

#### Requirejs的鸡肋

#### i18n

#### Font Icon
