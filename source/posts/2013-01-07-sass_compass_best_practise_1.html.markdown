---
title: Sass & Compass Best Practise 1
subtitle: 组织结构
date: 2013-01-07 16:22 +08:00
---

在CSS开发中你有没有遇到以下问题：

* 一个CSS文件几百上千行，要修改一个样式要找半天；
* 为了不同浏览器的兼容性，同样的样式要写好几行代码；
* 为了防止背景图片被缓存，每次更改背景图片都要修改图片名称和代码；
* 当sprites修改以后，在代码中需要调试半天background-position才能适应新的sprites；
* ⋯⋯

当你遇到其中一个或多个问题的时候，说明在CSS代码的管理和维护上出了问题。而这个时候，传统的CSS开发方式已经无法满足这些需求了，我们需要新的开发框架和工具，也就是：[Sass](http://sass-lang.com/)、[Compass](http://compass-style.org/)！#READMORE#

关于Sass和Compass的基本用法，阮一峰有两片写的很好的简介：[SASS用法指南](http://www.ruanyifeng.com/blog/2012/06/sass.html)、[Compass用法指南](http://www.ruanyifeng.com/blog/2012/11/compass.html)。这里就不再赘述了，下面我想介绍一系列我们在使用Sass和Compass方面的最佳实践，本文为第一篇：如何模块化CSS代码，使我们的样式也有一个良好的组织结构。

###CSS代码组织的问题

我们在写程序的时候，总是希望可以清楚的了解模块之间的依赖，这样可以方便程序人员理解代码，也方便监控我们的依赖不要过多。假设我们页面的CSS代码已经根据组件和功能划分为不同的模块和CSS文件，其中还有一些第三方的CSS库（reset）：

	style/
		reset.css
		layout.css
		menu.css
		document.css
		form/
			form.css
			button.css
			input.css

相对应的页面`header`就会有如下的引用：

	<header>
		<link rel="stylesheet" href="style/reset.css"/>
		<link rel="stylesheet" href="style/layout.css"/>
		<link rel="stylesheet" href="style/menu.css"/>
		<link rel="stylesheet" href="style/document.css"/>
		<link rel="stylesheet" href="style/form/form.css"/>
		<link rel="stylesheet" href="style/form/button.css"/>
		<link rel="stylesheet" href="style/form/input.css"/>
	</header>

这样我们所有的依赖都在HTML中，不利于我们快速的看到样式之间的依赖，也会产生很多额外的HTTP请求，降低页面性能。我们也可以使用`@import`在CSS文件内部管理引用，但这同样会产生额外的HTTP请求。

###利用`@import`管理代码

当我们希望在CSS代码中就管理所有依赖，并且不会产生额外的request时，就应该用到Sass了。
下面我们看看如果使用了Sass应该是什么样子的：

	style/
		screen.scss
		_reset.scss
		_layout.scss
		_menu.scss
		_document.scss
		form/
			_form.scss
			_button.scss
			_input.scss

在`_form.scss`中，我们将管理所有的表单及表单控件的样式：

	@import "button";
	@import "input";
	
	form {
		⋯⋯
	}

在`screen.scss`中，我们将管理所有页面样式的依赖：

	@import "reset";
	@import "layout";
	@import "menu";
	@import "document";
	@import "form";

其中文件名前面的下划线是告诉Sass该文件只是一个模块，不用单独生成css文件，所以最后生成的css文件只有一个：`screen.css`，于是我们只需要一个request就可以引入所有的css文件，写起来也非常方便：

	<header>
		<link rel="stylesheet" href="style/screen.css"/>
	</header>

可能有人会担心这样调试起来会不会很麻烦？但其实如果我们使用Chrome的inspection，我们根本不必接触源代码就可以很好的调试了。

同时，Compass已经提供了丰富的CSS库，其中包括了rese，所以我们可以直接删除`_reset.scss`，只在`screen.scss`中引入就可以了。

###最佳实践和注意

下面我们来总结一下在使用Sass帮助我们组织代码结构的时候应该注意的地方：

* 将CSS代码按照功能和组件划分为不同的模块，每个模块为一个文件，模块的文件名都以下划线开头，避免Sass生成额外的CSS文件
* 当一个模块的代码过多的时候，将之拆分为不同的子模块，并且在一个主模块中管理所有依赖，如：`_form.scss`
* 不要有太多的层级，那样会影响代码的可读性，通常三层已经是极限了
* 讲所有第三方引用的库都放在一个文件管理，例如：`screen.scss`，即使只有一个模块用到了它。因为重复的引用会在最后生成额外的CSS代码，而在众多的子模块中查找是否已经引入了某个库会非常麻烦，也不便于管理

这样既模块化了CSS代码，相互之间的依赖又非常清晰，而且还没有增加额外的request，不失为一个最佳实践。