---
title: 打造离线使用的Mobile Web App
date: 2013-05-28 14:28 +08:00
tags: Mobile, HTML5, AppCache
---

![HTML5](appcache/html5.png "HTML5")

最近公司举办技术大赛，我和同事一起制作了一个叫做[10K Hours](http://10khours.me)的Mobile Web App，可以帮助你通过一万小时的努力，成为某个领域的专家。正好前段时间翻译了一本书[《HTML5 Mobile Development Cookbook》](http://book.douban.com/subject/10580867/)，中文译本[在此](http://book.douban.com/subject/24706036/)。其中讲到了不少移动端Web开发的Best Practices，正好就用到了10K Hours这个应用上。其中我觉得非常有用但是又让人头痛的一个功能就是AppCache：它可以让用户在访问一次网页以后，下次再来时不能访问网络的情况下，也可以使用这个Web App；但是当页面资源被缓存以后，非常难去更新它们⋯⋯下面就是App Cache的详细介绍和使用技巧： #READMORE#

### 什么是AppCache

下面是来自[W3C](http://www.w3.org/TR/2011/WD-html5-20110525/offline.html)的解释：

> In order to enable users to continue interacting with Web applications and documents even when their network connection is unavailable — for instance, because they are traveling outside of their ISP's coverage area — authors can provide a manifest which lists the files that are needed for the Web application to work offline and which causes the user's browser to keep a copy of the files for use offline.

简单来说就是可以让开发者在网络出问题的情况下，可以部分或全部访问网站的静态资源。

可能有些朋友会疑惑AppCache与浏览器自动缓存和localStorage的区别，这里我简单讲一下：在默认设置下，浏览器会根据request header自动缓存静态文件，但是在请求该文件时还是会发出http request，而一旦被AppCache缓存住的文件就不会发送http request，除非人工触发缓存更新；localStorage也是一种缓存，但是它缓存的是数据，而AppCache缓存的是文件。

### 如何使用AppCache

要引入AppCache一般有三个步骤：

#### 1. 声明manifest文件

manifest可以告诉浏览器网站的cache行为，下面是一个完整的manifest文件示例：

	CACHE MANIFEST
	# Time: Wed May 22 2013 17:07:07 GMT+0800 (CST)

	CACHE:
	index.html
	stylesheet.css
	images/logo.png
	scripts/main.js

	NETWORK:
	myApp/api
	http://api.twitter.com

	FALLBACK:
	images/large/ images/offline.jpg

`CACHE MANIFEST`表明该文件用于AppCache的配置，必须放在第一行

`# Time: Wed May 22 2013 17:07:07 GMT+0800 (CST)`是一个时间戳，用于触发缓存文件的更新，这个会在后面详细讲到。

`CACHE`指定需要被缓存的文件。这些文件会被缓存到AppCache中，以后这些文件都会从AppCache中加载。

`NETWORK`指定不需要被缓存的文件。这些文件不会被缓存到AppCache中，一般用于一些动态的页面或数据。

**注意**：一些浏览器会给缓存容量加入上限，比如Chrome浏览器就是使用一个共有的缓存池，如果超出上限，以前缓存的文件有可能会被清除掉。

`FALLBACK`指定当网络不可用时的替代文件，这些文件在网络可用时不会从AppCache中读取，只有当网络不可用时才会从AppCache中读取。示例中指定当`images/large/`中的任意文件无法访问时，都从AppCache中读取`images/offline.jpg`文件。

我们一般使用`.appcache`作为manifest文件的后缀，这个是WHATWG的建议，同时也获得了更多浏览器的支持。

#### 2. 在页面中引入manifest文件

引入manifest文件需要在html标签中加入manifest属性，其值为manifest文件地址，例如：

	<html manifest="example.appcache">
	  ...
	</html>

**注意**：你需要在每个用到AppCache的页面都加入manifest属性，除非该页面就在缓存列表中，而拥有manifest属性的页面会自动被缓存住，不需要再加入缓存列表了。

#### 3. 修改服务器端的mime-type

为了让服务器端可以正确的处理manifest文件，需要在mine-type中加入`text/cache-manifest`。比如在Apache服务器中，可以添加以下行到配置文件中：

	AddType text/cache-manifest .appcache

### 更新缓存

完成manifest文件的配置以后，你会发现你的页面加载速度暴增，可以算是秒载，但是你也会悲催的发现，任何文件的修改将不会被反应到页面上，那么当我们有文件修改的时候应该怎么办呢？

#### 修改manifest文件

有两种情况可以导致缓存更新：

1. 用户清除缓存数据。
2. manifest文件修改。

所以我们要更新缓存，其实只有一个办法，那就是修改manifest文件。这个时候我们就可以看到在上个例子中那个被注释掉的时间戳（`# Time: Wed May 22 2013 17:07:07 GMT+0800 (CST)`）的作用了，每当任意一个被缓存的文件修改后，我们都应该修改manifest文件的时间戳，让浏览器知道有文件更改，应该更新缓存。

当浏览器检测到manifest文件更改以后，它会发起请求更新所有被缓存的文件，但是这时候还不会马上更新到页面中，还需要用户再次刷新页面，才能看到新的内容。也就是说，当我们有文件修改以后，需要用户刷新两次才能看到新的内容，这个对于用户来说是很奇怪的体验。这个时候我们可以利用AppCache提供的一些接口来解决这个问题。

#### AppCache接口

AppCache提供了以下的事件接口：

* `checking`：客户端正在检查manifest文件的更新，或者尝试下载manifest文件时触发。注意：这个事件总是首先触发的。
* `noupdate`：客户端检查manifest文件，并且manifest文件没有更新时触发。
* `downloading`：客户端发现manifest文件需要更新并开始更新，或者开始下载manifest中列举的缓存文件时触发。
* `progress`：客户端下载manifest中列巨额的缓存文件时触发。
* `cached`：manifest中的文件被下载，并且被缓存以后触发。
* `updateready`：当新的缓存文件下载完成后触发，可以利用swapCache()来应用新的文件。

其中最重要的就是`updateready`这个事件，我们可以利用JavaScript绑定这个事件，在缓存更新的时候自动刷新来应用这些更新，例如：

	// Check if a new cache is available on page load.
	window.addEventListener('load', function(e) {
	
	  window.applicationCache.addEventListener('updateready', function(e) {
	    if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
	      // Browser downloaded a new app cache.
	      // Swap it in and reload the page to get the new hotness.
	      window.applicationCache.swapCache();
	      if (confirm('A new version of this site is available. Load it?')) {
	        window.location.reload();
	      }
	    } else {
	      // Manifest didn't changed. Nothing new to server.
	    }
	  }, false);
	  
	}, false);

### AppCache的Debug

当我们在本地调试的时候，我们如何知道AppCache是否起效果，并缓存了哪些文件呢？Chrome的开发者工具提供了这些信息，打开开发者工具，在Resource => Application Cache中就可以看到缓存了哪些文件，如下图所示：

![AppCache Debug](appcache/debug.png "AppCache Debug")

但是在这里不能对Cache进行删除操作，也不能看到其他网站的Cache。如果想看到所有网站的AppCache信息，并且删除其中某一个的话，可以进入[chrome://appcache-internals/](chrome://appcache-internals/)，这个管理页面会列出所有浏览器中的AppCache信息，包括manifest地址、缓存大小、更新时间、创建时间等等⋯⋯

### 延伸

到这里我们就已经讲解了关于AppCache的基础知识，这里还有一些推荐阅读的资料，同时也是我的参考资料：

* [W3C关于AppCache的标准文档](http://www.w3.org/TR/2011/WD-html5-20110525/offline.html)
* [A Beginner's Guide to Using the Application Cache](http://www.html5rocks.com/en/tutorials/appcache/beginner/)
* [Debugging HTML5 Offline Web applications](http://blog.christian-heindel.de/2011/10/25/debugging-html5-offline-web-applications/)
* [Appcache Facts](http://appcachefacts.info/)