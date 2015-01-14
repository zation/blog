—
title: 用React.js替换Backbone.js的View（一）
subtitle: Backbone.js View的陷阱以及React.js的优点
date: 2015-01-13 22:25 +08:00
tags: Javascript, Backbone.js, React.js
—

最近终于找到时间，学习了一下Facebook出品的[React.js](http://facebook.github.io/react/)，发现虽然没有很深的体会到性能上的好处，但是这种编程方式带来的好处确实是很大的。这里我准备跟Backbone.js的View做一下对比，同时下一篇文章中提供一个示例说明一下如何用React.js替换Backbone.js的View。#READMORE#

###Backbone.js中View的陷阱
这里用陷阱这个词，是因为下面这些其实并不是Backbone.js本身所引发的问题，但却是使用Backbone.js的View时，常常会犯的错误。

####绑定的事件没有解绑而造成的内存泄露
对于某个View，如果在它内部绑定事件的方式不正确，会造成`remove`的时候没有解绑，最后造成内存泄露。例如：

    var SomeModelView = Backbone.View.extend({
        initialize: function() {
            this.model.on('change', this.render, this);
        },
        render: function() {
            // render a template
        }
    });

有两种方式可以解决这个问题，第一个是使用`listenTo`：

    var SomeModelView = Backbone.View.extend({
        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
        },
        render: function() {
            // render a template
        }
    });

第二个是显式的在`close`方法中解绑：

    var SomeModelView = Backbone.View.extend({
        initialize: function() {
            this.model.on('change', this.render, this);
        },
        close: function() {
            this.model.off('change', this.render);
        },
        render: function() {
            // render a template
        }
    });

**注：**如果没有特殊情况，都推荐使用第一种解决方案。

其实以上的问题还不是真正的麻烦，真正的麻烦在于所有的View都需要以调用`remove`的方式来删除，否则不仅是model或collection上面的事件无法解绑，DOM事件都会没有解绑，从而造成事件重复绑定或内存泄露的问题。而对于一个Backbone.js的应用来说，一个View有十多个内嵌了N层的SubView是很正常的情况，如何保证这些SubView都被remove掉了是非常大的问题，例如在切换页面的时候，需要首先删除一个页面级别的View再插入另一个。[这里](http://mikeygee.com/blog/backbone.html)有一篇文章详细叙述了如何解决这个问题，我这里就不复述了。

####DOM的render可能效率很低
如果多次使用append来插入SubView，由于每次都会导致浏览器重新计算Element的位置和大小，所以可能效率会很低，例如：

    var SomeCollectionView = Backbone.View.extend({
        initialize: function() {
            var self = this;
            this._views = [];
            // create a sub view for every model in the collection
            this.collection.each(function(model) {
                self._views.push(new SomeModelView({
                    model: model
                }));
            });
        },
        render: function() {
            var self = this;
            this.$el.empty();
            // render each subview, appending to our root element
            _.each(this._views, function(subview) {
                self.$el.append(subview.render().el);
            });
        }
    });

这个时候我们可以使用`documentFragment`来在内存中先把我们要插入的DOM组织好，再一次性的完成append操作：

    render: function() {
        this.$el.empty();
        var container = document.createDocumentFragment();
        // render each subview, appending to our root element
        _.each(this._views, function(subview) {
            container.appendChild(subview.render().el)
        });
        this.$el.append(container);
    }

看起来这也不是真正麻烦的问题，至少我们还有解决方案，但是如果是一个大量数据的collection需要render，那么就需要我们自己在render的时候做增量式的操作，否则效率无论如何都提高不起来，这往往在老的浏览器或者移动端是无法接受的。

###React.js的优点
如果我们有一个跟Backbone.js同样轻量级，并且又自己解决了以上问题的框架，我们为什么不试试看呢？

####Virtual DOM
是的，所有的问题都可以使用一个Virtual DOM来解决。这个Virtual DOM由React.js来维护，每次对于DOM的修改都是增量式的，效率会非常高。并且对于删除的DOM，它上面的DOM事件会自动删除，不需要我们显式的调用一次，并且对于DOM的删除操作不需要显示的调用`remove`，一切有React.js来搞定。

这样就避免了很多内存泄露的可能性，也大大提高了性能。也就是同时解决了之前的两个问题。

####Template与View不再分离
在大多数人的观念中，Template和View是完全不同的两种事物：一个是显示的内容，一个是显示的逻辑；一个是HTML，一个是JS。但是我们在实际开发的过程中，往往是开了两个窗口，左边是Template，右边是View，我们会非常欢快的在两边频繁切换。我们会做这样的操作，就是因为View的逻辑，就是Template的逻辑；Template的内容，其实也是View的内容。这两者没有大家想想的那么大的区别，分开以后反而是导致了代码不易读的问题，我常常会为了了解Template中的一个显示是如何得到的，而在各种View中找半天。

Template与View的合并带来了代码可读性的提高，但是可能也有人会觉得把这两种合并到一起会让代码变得更加臃肿。这里就要提到React.js的Component这个概念了，有了Component的细化，其实每一个Component的代码是很独立，并且也很少的。

####Component
Compnent这个概念的出现，就是为了使得页面组件可以更加容易的被重用。在React.js给出的官方[示例中](http://facebook.github.io/react/docs/thinking-in-react.html)，我们可以看到Component的粒度可以非常细，同时可以利用[Props](http://facebook.github.io/react/docs/transferring-props.html)来保证Component之间的解耦。

###总结
有了Virtual DOM，JSX（合并Template与View），Component这三大利器，React.js现在已经成为了Template和View这一层的不二框架了。再加上它本身的轻量级，还有Facebook来维护，采用它的风险可以说非常低。由于以上种种原因，是的一个两年不到的项目，在Github上有了13,120的Star数量，社区也提供了相当的热情




