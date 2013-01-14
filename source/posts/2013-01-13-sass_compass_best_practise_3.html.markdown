---
title: Sass & Compass Best Practise 3
subtitle: 图片处理
date: 2013-01-13 21:15 +08:00
---

[前一篇文章](/2013/01/13/sass_compass_best_practise_2.html)中我们介绍了如何利用Sass来简化我们的代码，使我们的代码可复用且易维护。本文讲介绍如何使用Compass来管理我们用于样式的图片。

Compass的图片处理主要有以下功能：

* 自动将一系列单个图片拼接生成一个Sprites；
* 根据图片名，自动计算background-position并生成CSS代码；
* 自动给图片加上防缓存机制。

下面我们就来看看如何具体实现这些功能。#READMORE#

###Sprites

Sprites本身在Web开发中就是一个最佳实践，但是他也会带来一些问题，那就是当设计人员将sprites中的一个图标改了哪怕一个像素，只要影响到了其他的图标，开发人员就会吐血的修改所有被影响到的样式代码。而Compass可以使我们的设计人员不用再自己手动拼接图标，前端开发也不用一个像素一个像素的手动寻找图标的位置。

**我们先来看看如何利用Compass来生成Sprites。**

首先我们准备一些图标：

* ![blogger](../stylesheets/images/icons/blogger.png "blogger") images/icons/blogger.png
* ![flickr](../stylesheets/images/icons/flickr.png "flickr") images/icons/flickr.png
* ![linkedin](../stylesheets/images/icons/linkedin.png "linkedin") images/icons/linkedin.png
* ![rss](../stylesheets/images/icons/rss.png "rss") images/icons/rss.png
* ![twitter](../stylesheets/images/icons/twitter.png "twitter") images/icons/twitter.png

将他们放在images/icons中：

	stylesheets/
		images/
			icons/
				blogger.png
				flickr.png
				⋯⋯
		_icons.scss

在`_icons.scss`中只需要很简单的设置，我们就可以使用Compass提供的Sprites功能了：

	@import "images/icons/*.png";
	
	a[title="sprites-example-blogger"] {
		@include icons-sprite(blogger);
	}

	a[title="sprites-example-flickr"] {
		@include icons-sprite(flickr);
	}
	
	⋯⋯

**注意：**这里Compass使用了一种"Magic Import"，就是说我们使用时include的方法名，是根据我们的文件夹名字（import的路径中最后一个文件夹）自动生成的。例如，当我们把图片放在social文件夹时，我们的代码就应该写成这样（感谢NB的Ruby元编程）：

	@import "images/social/*.png";
	
	a[title="sprites-example-blogger"] {
		@include social-sprite(blogger);
	}

	a[title="sprites-example-flickr"] {
		@include social-sprite(flickr);
	}
	
	⋯⋯

最后我们来看看使用Compass Sprites做成的图标链接：

[blogger](http://www.zation.com "sprites-example-blogger")
[flickr](http://www.flickr.com "sprites-example-flickr")
[linkedin](http://www.linkedin.com "sprites-example-linkedin")
[rss](http://www.google.com/reader/ "sprites-example-rss")
[twitter](/feed.xml "sprites-example-twitter")

关于Sprites，Compass还提供了很多自定义功能，具体可以参考[Sprites的教程](http://compass-style.org/help/tutorials/spriting/)

###防止缓存

缓存可以使我们的用户更加快速的访问我们的网站，但是同样也产生了问题：当我们修改了背景图片但是没有修改图片名时，缓存服务器会认为该图片并没有改变，而直接返回之前缓存的，导致样式在用户端出现问题。现在只要我们使用了Compass的images提供的mixin，就可以解决这个问题。

假如我们现在有一个图片foo.png放在images文件夹中：

	stylesheets/
		images/
			foo.png
		backgrond.scss

现在我们在`background.scss`中使用Compass来设置背景图片：

	.comapss {
		@include background(image-url("foo.png"));
	}

那么所生成的CSS将会是：

	.compass {
		background: url(/images/foo.png?1320727111);
	}

如果要使用相对路径，需要在`config.rb`中设置`relative_assets = true`，这里到底是使用绝对路径还是使用相对路径，可以根据项目中是否有context path来决定，如果有的话建议使用相对路径。

默认生成的cache buster是一串数字，根据每次Compass的compile生成。很多项目中已经有了完善的cache buster机制了，这里我们可以在`config.rb`中重写`asset_cache_buster`这个block来集成自己的项目中。在这个block中返回一个hash（`{:path => "path", :query => "query"`）可以设置cache buster为指定的路径或query string；如果返回一个string则自动使用query string。下面是一段来自[Compass Configuration Reference](http://compass-style.org/help/tutorials/configuration-reference/)的示例代码：

	asset_cache_buster do |path, real_path|
		if File.exists?(real_path)
			pathname = Pathname.new(path)
			modified_time = File.mtime(real_path).strftime("%s")
			new_path = "%s/%s-%s%s" % [pathname.dirname, pathname.basename(pathname.extname), modified_time, pathname.extname]

			{:path => new_path, :query => nil}
		end
	end