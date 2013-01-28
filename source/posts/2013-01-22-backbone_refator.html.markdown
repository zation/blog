---
title: 利用Backbone.js重构项目代码
date: 2013-01-22 22:28 +08:00
tags: JavaScript, Backbone.js
---

进入现在这个项目已经一年多了，这是我呆过时间最长的一个项目，见证了项目的前端从简单的一些效果到有了复杂的逻辑，最后需要借助JavaScript的MVC框架来重构前端代码，以避免前端代码爆炸失控。具体来说我们的前端代码在增长过程中遇到了以下问题：

* 多个页面组件根据同一数据来源做更新显示时，会有不少逻辑上重复的代码，或者过多的回调嵌套；
* 由于缺乏一个消息传递机制，导致全局变量很多；
* 组件之间耦合太深，单个组件很难被重用；
* 数据被写在DOM元素的属性中，当显示需求改变时很难只修改DOM而不破坏功能；
* 测试代码中需要准备大量的html fixture，每个测试都是很大的集成测试，难以重构、相当耗时。

当你遇到其中一个或几个问题时，请开始考虑用[Backbone.js](http://backbonejs.org/)来重构吧，越是问题严重的时候重构的风险越大，花费的时间和精力也越多，最后可能是遗留一大堆垃圾代码而草草了结项目。#READMORE#

###Backbone.js是一种怎样的框架？

很多人看到JavaScript MVC框架，就觉得这是一个很重的框架，其实它是非常轻量级的框架。你可以只使用你需要的核心部分，其余的功能可以等到需要的时候再使用，而不必完全按照某种编码风格或方式。我们可以分离开来的几个核心部分有：

* 事件机制：主要用于Model和View或者View之间传递消息。
* Model：主要用于数据处理，或者与后台交互。
* View：使用Backbone.js的View可以比较方便的封装组件，但是也完全可以延用自己的组件代码，绑定Model。
* Collection：提供了很多复杂逻辑操作的方法，对于成组的数据操作很方便，但实际上这些逻辑操作的方法都是来自[Underscore.js](http://underscorejs.org/)的，它们都可以独立使用。

其他还有Route、History、Sync等部分，基本都是用于大型前端应用了，可以按需使用。下面我们来看看具体如何利用Backbone.js做重构。

###使用Model封装数据

当我们面临一个复杂的Web项目，首先要做的就是尽量将其中的数据逻辑和显示逻辑分开。Backbone.js中使用Model来封装数据逻辑，并且提供了`fectch`、`save`、`sync`一系列与后台交互的辅助方法，不过我们也可以使用自定义的方式来灵活处理后台交互。

当我们有一些图书的数据需要与后台交互，如果是使用Backbone.js自带的方法的话，会有类似以下代码的写法：

	var Book = Backbone.Model.extend({
		urlRoot: 'books'
	});
	
	var book = new Book({
		id: 1,
		name: 'a book'
	});
	
	book.save();
	book.fetch();

可能对这段代码做了什么大家不是很了解，下面是自定义的写法，就可以看的很清楚：

	var Book = Backbone.Model.extend({
		save: function() {
			$.ajax({
				url: 'books',
				method: 'POST',
				data: {
					id: this.id,
					name: this.name
				}
			});
		},
		
		fetch: function() {
			$.ajax({
				url: 'books/' + this.id,
				method: 'get',
				success: function(data) {
					this.id = data.id;
					this.name = data.name;
				}
			});
		}
	});
	
	var book = new Book({
		id: 1,
		name: 'a book'
	});
	
	book.save();
	book.fetch();

这两段代码的执行结果都是一样的，不同的是在第二段中我复写了Backbone.js的两个默认方法，让大家可以看到实际执行的操作是什么样的。

第一段代码的写法是很简洁，但是他需要后台提供完善、标准的RESTful接口，而这在重构的初期几乎是不可能的。所以我们可以先像第二段代码那样重写Backbone.js的默认方法，使之符合我们的前后端交互规则，来抽离出数据逻辑。并且在我们一步一步抽离出数据逻辑的同时，也可以补齐这部分的单元测试，推荐使用[jasmine测试框架](https://github.com/pivotal/jasmine)来写JavaScript单元测试，以及使用[jasmine-ajax](https://github.com/pivotal/jasmine-ajax)来mock ajax请求。

###利用事件机制解耦代码

前端代码的复杂性在于依赖，JavaScript依赖于DOM，DOM之间又有很强的层级结构，而DOM之间的消息传递机制就只有由用户触发的交互事件，如：click、change、hover等等，不能由DOM主动触发并且传递给其他DOM元素。于是我们的组件内部就非常多的持有了其他组件，造成了依赖复杂，难以解耦和复用。这个问题的处理方法是自己写一套事件机制，或者使用框架的事件机制，而Backbone.js就提供了一套很好的事件机制。

**基于Model的事件**

很多时候我们需要根据数据的变化来更新组件的显示，Backbone.js的Model就提供了这种事件机制。假如我们现在的页面中有一个View是用于显示书本的信息，那么当书本数据变更时可以这样更新View的显示：

	var BookView = Backbone.View.extend({
		initialize: function() {
			this.model.on('change', this.render, this);
		},
		
		render: function() {
			this.$('.name').text(this.model.get('name'));
			this.$('.author').text(this.model.get('author'));
		}
	});

当`BookView`所绑定的Model变更时，就会自动调用`render`来更新显示，其中消息传递和触发的机制已经由Backbone.js实现了，我们只需要使用就可以了。

**View之间的消息传递**

还有很多时候我们需要在View之间传递消息，这些消息是与数据无关的，典型的例子就是弹出通知框。假如我们现在需要在书本信息更新完毕以后，弹出一个通知框告诉用户书本信息已经更新成功了，以前的做法是将通知框的实例作为一个全局的变量，让每个需要用到它的地方都可以直接调用它的某个弹出方法。但是我们现在可以用`Backbone.Events`来做解耦：

	var CustomEvent = {showNotification: 'showNotification'};
	_.extend(CustomEvent, Backbone.Events);
	
	var NotificationView = Backbone.View.extend({
		initialize: function() {
			CustomEvent.on(CustomEvent.showNotification, this.showNotification);
		},
		
		showNotification: function() {
			this.$el.show();
		}
	});
	
	var BookView = Backbone.View.extend({
		initialize: function() {
			this.model.on('change', this.render, this);
		},
		
		render: function() {
			this.$('.name').text(this.model.get('name'));
			this.$('.author').text(this.model.get('author'));
			CustomEvent.trigger(CustomEvent.showNotification);
		}
	});

这样就可以将两个View之间的耦合解开了。当然，这里从实现上来讲也可以使用Model来传递消息，但是这样并不符合Model的语义，而且也没有用到Model真正的功能，太重了一些，所以推荐还是用自己的事件对象，通过继承`Backbone.Events`来实现。

###一些Tips

**关于测试的优化**

当我们利用Backbone.js的View和Model将我们的前端代码组件化，并且分离了显示逻辑和数据逻辑之后，我们的测试代码也变得好些多了，可以更加靠近单元测试。我们可以将以前的集成测试分拆为小的单元测试，并且在准备fixture的时候也尽量小，同时注意不要将fixture真的append到DOM中，那样会减慢测试的运行速度。

但是这里也有例外，如果你是使用[jasmine-jquery](https://github.com/velesin/jasmine-jquery)来测试DOM元素，那么针对元素的显示/隐藏逻辑的测试，必须要将fixture真的append到DOM才能得到正确的结果。这是由于jasmine-jquery的`toBeVisible`使用了jQuery的`is(':visible')`来验证元素的显示/隐藏，它要求元素必须存在于DOM中才可能是隐藏的。

**关于View内部元素的获取**

我们常常需要在View中选取它内部的元素，这个时候如果直接使用`$(selector)`可能或选取到View外部拥有同样selector的元素。Backbone.js已经提供了一个很好的解决方案，就是`this.$(selector)`，它只会选取该View内部的元素，从而将外部DOM元素隔离的很干净。

**关于View的DOM事件绑定**

View的DOM事件绑定是以如下方式进行的：

	var BookView = Backbone.View.extend({
		events: {
			'click .delete', 'deleteBook'
		},
		
		deleteBook: function() {
			...
		}
	});

可能大家会觉得这里的事件绑定等同于

	$('.delete').on('click', function() {…})

但是实际上Backbone.js会把每个View的事件都delegate到它的根元素上，假如我们是这样创建View的：

	var bookView = BookView({el: '.book'})

那么它的事件绑定就等同于

	$('.book').on('click', '.delete', function() {…})

也就是说，即使`.delete`是动态创建的，事件能绑定上。