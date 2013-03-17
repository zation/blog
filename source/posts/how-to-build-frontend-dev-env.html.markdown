---
title: 如何构建自动化的前端开发流程
date: 2013-03-15 16:21 +08:00
tags: grunt, bower
---

如今的前端开发中，已经不再只是一些简单的静态文件了，对于很多Web App来说，前端代码甚至比后端代码要更加复杂，更加难于管理，例如：

* 我们有许多的第三方库的依赖需要管理；
* 我们有独立的前端测试需要自动运行；
* 我们还有很多代码需要在发布时进行打包压缩；
* ⋯⋯

所以构建一个自动化的前端开发流程是非常必要的，但现在前端开发流程的构建是百花齐放，没有一个统一的标准，还有很多依赖于后端的架构来做前端开发管理。例如在Rails开发中，就有各种前端库的gem包。但是这种依赖于后端框架的管理方式有许多问题：

* 许多gem包的维护者并不是前端库的维护者，所以更新不一定即时；
* 不利于前端代码与后端代码做分离；
* 增加了前端开发者的学习和使用成本；
* ⋯⋯

于是现在出现了一些不依赖于后端代码（虽然还是要依赖Node.js⋯⋯）的管理工具，对于前端开发者非常友好，例如：[YEMAN](http://yeoman.io/)、[Jam](http://jamjs.org/)、[volo](http://volojs.org/)、[component](https://github.com/component/component)、[Brunch](http://brunch.io/)⋯⋯但是这些工具都或多或少有自己的一些问题，所以我决定用一些更轻量的工具（[bower](http://twitter.github.com/bower/)、[grunt](http://gruntjs.com/)）来搭建自己的前端开发流程。 #READMORE#

###什么是开发流程？

在我看来一个完整的开发流程应该包括：

* 本地开发环境的初始化
* 第三方依赖的管理
* 源文件编译
* 自动化测试
* 发布到pipeline和各个环境

而现代的开发流程，就是要使上面的各个部分都可以自动化，一个命令就可以使这些流程都自动走完，并且快速的得到错误或通过的反馈，让我们可以方便快速的修复错误和release。

###本地开发环境的初始化

这里我使用的工具是[Node.js](http://nodejs.org/)和[NPM](https://npmjs.org/)，它们都基于JavaScript，使用Json来配置，对于前端开发人员非常友好。

安装完成Node.js和NPM后，在项目根目录下创建NPM的配置文件`package.json`：

	{
		"name": "Project Name",
		"version": "0.0.1",
		"description": "Project Description",
		"repository": {
			"type": "git",
			"url": "git://github.com/path/to/your_project"
		},
		"author": "Author Name",
		"license": "BSD",
		"readmeFilename": "README.md",
		"gitHead": "git head",
		"devDependencies": {
			"grunt": "latest",
			"grunt-contrib-connect": "latest",
			"grunt-contrib-concat": "latest",
			"grunt-contrib-jasmine": "latest",
			"grunt-contrib-watch": "latest",
			"grunt-contrib-compass": "latest"
		}
	}

其中最重要的一个配置项是**devDependencies**，这是用于开发的依赖，例如：自动化测试、源文件编译等等，其中各个依赖的作用和用法将会在后面讲到。而前端生产代码的依赖会使用另一个工具来管理，也在后面讲到。创建完成以后运行`npm install`，NPM就会将这些依赖都安装到项目根目录的`node_modules`文件夹中。

###第三方依赖的管理

这里我使用的工具是[bower](http://twitter.github.com/bower/)。其实NPM也可以管理，但是NPM并不是读取第三方依赖原始的repository，而是读取自己管理的一个repository，所以更新可能会慢点，并且它使用CommonJS的接口方便Node.js项目的开发，并不是针对纯前端开发的项目；而bower是读取原始的github repository，没有更新延迟的问题，所有包都是针对纯前端开发项目的。

要使用bower只需要简单的三步：

1. 安装：`npm install bower -g`
2. 在项目根目录中创建配置文件`.bowerrc`
3. 在项目根目录中创建依赖配置文件`components.json`

我们首先来看看`.bowerrc`的内容：

	{
		"directory" : "components",
		"json"      : "component.json",
		"endpoint"  : "https://bower.herokuapp.com"
	}

其中**directory**指定了所有的依赖会被安装到哪里；**json**指定了依赖配置文件的路径；**endpoint**制定了依赖的repository的寻址服务器，你可以替换为自己的寻址服务器。

然后我们来看看`components.json`的内容：

	{
		"name": "Project Name",
		"version": "0.0.1",
		"dependencies": {
		  "jquery": "latest",
		  "underscore": "latest",
		  "backbone": "latest",
		  "jasmine-jquery": "latest",
		  "jasmine-ajax": "git@github.com:pivotal/jasmine-ajax.git"
		}
	}

其中最重要的就是**dependencies**，它指定了所有前端开发依赖的包。所有bower包含的依赖都可以在[这里](http://sindresorhus.com/bower-components/)查到，对于bower没有包含的依赖也可以直接指定github的repository，例如：`"jasmine-ajax": "git@github.com:pivotal/jasmine-ajax.git"`。

最后运行`bower install`就可以在components文件夹中看到所有第三方依赖的文件了。但是bower有一个问题，就是它将所有github repository中的文件都下载下来了，其中有许多是我们不需要的文件。下面我们会将我们需要的文件提取出来打包放到我们指定的目录中。

###源文件编译

这里我使用的工具是[grunt](http://gruntjs.com/)，他本身主要是基于Node.js的文件操作包，其中有许多插件可以让我们完成js文件的compile和compress、sass到css的转换等等操作。要使用它需要先安装命令行工具：`npm install grunt-cli -g`，然后在项目根目录中创建文件`Gruntfile.js`，这个文件用于定义各种task，我们首先定义一个task将从bower下载的第三方依赖都打包到文件`app/js/lib.js`中：

	module.exports = function(grunt) {

		var dependencies = [
		    'components/jquery/jquery.js',
		    'components/underscore/underscore.js',
		    'components/backbone/backbone.js'];
		
		grunt.initConfig({
			concat: {
				js: {
					src: dependencies,
					dest: 'app/js/lib.js'
				}
			}
		});
			
		grunt.loadNpmTasks('grunt-contrib-concat');
	};

这里的grunt-contrib-concat就是grunt的一个插件，用于文件的合并操作，我们已经在前面的`package.json`中引入了。`js`是task name；`src`指定了合并的源文件地址；`dest`指定了合并的目标文件。这样当我们运行`grunt concat:js`后，所有的依赖文件都会被合并为`app/js/lib.js`。这样做的好处是我们可以控制每个依赖的引入顺序，但是麻烦的是每次引入新的依赖都需要手动加入到`dependencies`数组中。这个暂时没有更好的解决方案，因为不是所有的包都在自己的`components.js`中声明了main文件，很多时候必须自己手动指定。

JavaScript文件编译完成以后就是CSS文件，在现代的前端开发中，我们已经很少直接写CSS文件了，一般都使用SASS或者LESS。grunt也提供了这种支持，这里我使用的是[grunt-contrib-compass](https://github.com/gruntjs/grunt-contrib-compass)：

	module.exports = function(grunt) {

		var sasses = 'sass';
		
		grunt.initConfig({
			compass: {
				development: {
					options: {
						sassDir: sasses,
						cssDir: 'app/css'
					}
				}
			}
		});
			
		grunt.loadNpmTasks('grunt-contrib-compass');
	};

然后运行`grunt compass:development`就可以完成CSS文件的编译了。

###自动化测试

这里我使用的自动化测试工具是[Jasmine](http://pivotal.github.com/jasmine/)，它grunt中同样有一个插件：[grunt-contrib-jasmine](https://github.com/gruntjs/grunt-contrib-jasmine)。下面我们来看看如何在`Gruntfile.js`中定义测试的task：

	module.exports = function(grunt) {

		var sources = 'app/js/**/*.js',
			specs = 'spec/**/*Spec.js';
		
		grunt.initConfig({
			jasmine: {
				test: {
					src: [sources],
					options: {
						specs: specs,
						helpers: ['spec/helper/**/*.js'],
						vendor: 'app/js/lib.js'
					}
				}
			}
		});
			
		grunt.loadNpmTasks('grunt-contrib-jasmine');
	};

配置完成以后就可以运行`grunt jasmine:test`来跑测试，但问题是每次写完代码都要手动执行一次非常麻烦，最好可以每次代码有更改都自动跑一次，让我们可以更快的得到反馈。grunt的[watch插件](https://github.com/gruntjs/grunt-contrib-watch)就提供了这种支持：

	module.exports = function(grunt) {

		var sources = 'app/js/**/*.js',
			specs = 'spec/**/*Spec.js';
		
		grunt.initConfig({
			jasmine: {
				test: {
					src: [sources],
					options: {
						specs: specs,
						helpers: ['spec/helper/**/*.js'],
						vendor: 'app/js/lib.js'
					}
				}
			},
			watch: {
				test: {
					files: [sources, specs],
					tasks: ['jasmine:test']
				}
			}
		});
			
		grunt.loadNpmTasks('grunt-contrib-jasmine');
		grunt.loadNpmTasks('grunt-contrib-watch');
	};

`files`指定了需要监听变动的文件；`tasks`指定了修改后自动触发的task。现在只要我们运行`grunt watch:test`，那么有任何源文件、测试文件的改动，Jasmine测试都会自动运行了。有时候我们也希望测试的结果显示在网页上，便于我们做js的调试。那么可以将`tasks: ['jasmine:test']`改为`tasks: ['jasmine:test:build']`，然后打开根目录下的`_SpecRunner.html`文件，就可以在网页中看到测试结果了，再加上一些Chrome的[Livereload插件](https://chrome.google.com/webstore/detail/live-reload/pccddenngcbofbojodpghgpbheckgddn)，就可以不用刷新实时的看到测试结果，效率非常之高。虽然grunt插件中也有[livereload](https://github.com/gruntjs/grunt-contrib-livereload)，但是与grunt-contrib-watch无法很好的集成，所以我没有使用这种方式。

###CI Pipeline

由于我的项目是host在github上，所以我选择[travis-ci](https://travis-ci.org/)作为我的CI服务器。要启用travis-ci需要以下几步：

1. 在[travis-ci](https://travis-ci.org/)中注册一个账号，获取一个token；
2. 在你的github项目的Settings-->Service Hooks中找到Travis，填入token并且启用；
3. 回到[travis-ci](https://travis-ci.org/)，在Accounts-->Repositories中打开你的项目的service hook
4. Push一个`.travis.yml`到github，触发第一次build。
5. 修改`package.json`的`scripts`项，指定运行测试的命令

下面我们来看看如何配置`.travis.yml`：

	language: node_js
	node_js:
	  - "0.8"
	before_script:
	  - npm install -g grunt-cli

由于我们的环境是基于Node.js搭建的，所以在**language**设置了node_js；而**node_js**指定了Node.js的版本；**before_script**指定了在测试运行前需要执行的命令，由于我们的脚本都是基于grunt的，所以需要先安装grunt的命令行包。

然后再修改`package.json`：

	{
		⋯⋯
		"scripts": {
			"test": "grunt jasmine:test"
		}
		⋯⋯
	}

将修改以后的`package.json`push到github上，再次触发一个新的build，你可以看到你之前错误的build已经绿了。

这里还有一个小提示：如何让build状态显示在项目的readme中？很简单，只需要在README.md中加入以下代码就可以了：

	[![Build Status](https://travis-ci.org/path/to/your_repository.png?branch=master)](http://travis-ci.org/path/to/your_repository)

到这里基本的环境搭建就完成了，当然我们还可以使用grund的`registerTask`来定义一个任务序列，还可以加入template的编译⋯⋯这些都可以通过grunt来灵活设置。最重要的是现在别人拿到一个项目的代码以后，可以通过一些命令来快速的搭建本地环境，方便的进行测试和开发，而且没有依赖与后端的开发环境，只要定义好接口，前端开发可以完全独立开了。虽然这其中还有很多问题没有解决，例如：

* 如何让第三方依赖自申明main文件
* `package.json`与`components.json`其实有些重复
* Live Reload还需要Chrome插件才能完成
* ⋯⋯

这正是由于现在前端开发环境还没有后端开发的那种标准化，也正是挑战和机遇之所在！