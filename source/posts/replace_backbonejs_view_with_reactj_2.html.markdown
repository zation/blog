---
title: 用React.js替换Backbone.js的View（二）
subtitle: Todo MVC示例
date: 2015-01-16 07:54 +08:00
tags: Javascript, Backbone.js, React.js
---

Backbone.js和React.js在设计思想上都借鉴了[Reactive Programming](http://en.wikipedia.org/wiki/Reactive_programming)，即：当Model修改时，这种变更可以反向传播到View，使得View同时被更改，也就是双向绑定。但Backbone.js需要你自己来写如何修改View，而在React.js中，你只需要关心如何根据Model来显示View，如何修改可以完全交给React.js。也就是说他们都在做一种简化，而React.js做的更加彻底，这也是它的核心思想和优点。

真正的学习还是需要写代码，所以这里用经典的[Todo MVC](https://github.com/tastejs/todomvc)作为示例。所有的代码可以在我的[Github](https://github.com/zation/backbone-to-react)上找到。#READMORE#

###环境准备

React.js推荐使用[JSX](http://facebook.github.io/react/docs/displaying-data.html)来写View，所以我们需要准备一下JSX的环境。按照最简单的做法，我们只需要将in-browser JSX transformer引入即可：

```bash
$ bower install --save react
```

然后在`index.html`中，加入一下的代码，作为script标签的第一个：

```html
<script src="bower_components/react/react-with-addons.js"></script>
<script src="bower_components/react/JSXTransformer.js"></script>
```

这样我们的JSX代码就可以在运行时编译了。

###替换的方式

这里我们实际上是做的一个重构（虽然没有测试），为了尽量使得每一步都比较容易验证，我们每次commit的修改都会尽量很小，而且每次commit的代码都要保证是工作的，不会破坏原有的功能。所以我们会在原有的代码的基础上增加React.js的代码，完成一部分再删除一部分Backbone.js View的代码，最后再完成整个替换。

一般来说我推荐先替换Template，再替换DOM事件的绑定和处理，最后再整体用某个Component替换掉Backbone.js View。下面我会用TodoItem View替换过程的开始部分作为示例，讲解一下如何重构，同时也讲解一些React.js的基本概念。

###Template

我们之前提到过，React.js的Component其实就是View + Template的结合。那么我们应该怎样来划分Component呢？这里React.js官方给出的意见是：遵从[单一职责的原则](http://en.wikipedia.org/wiki/Single_responsibility_principle)，也就是一个Component只做一件事。具体如何划分就要看你的Domain和团队自己的规则了。

现在我们新建TodoItem Component，新建`todo-item.jsx`文件，将原来template中的内容挪过来，并且用React.js的方式来render：

```javascript
var app = app || {};

(function () {
    'use strict';

    app.TodoItem = React.createClass({

        render: function() {
            var todoData = this.props.todo.toJSON();
            return (
                <div>
                    <div className="view">
                        <input className="toggle" type="checkbox" checked={todoData.completed} />
                        <label>{todoData.title}</label>
                        <button className="destroy"></button>
                    </div>
                    <input className="edit" defaultValue={todoData.title} />
                </div>
            );
        }
    });
})();
```

替换`todo-view.js`中的template：

```diff
@@ -12,9 +12,6 @@
                //... is a list tag.
                tagName:  'li',

-               // Cache the template function for a single item.
-               template: _.template($('#item-template').html()),
-
                // The DOM events specific to an item.
                events: {
                        'click .toggle': 'toggleCompleted',
@@ -48,7 +45,9 @@
                                return;
                        }

-                       this.$el.html(this.template(this.model.toJSON()));
+                       React.render(React.createElement(app.TodoItem, {
+                               todo: this.model
+                       }), this.$el[0]);
                        this.$el.toggleClass('completed', this.model.get('completed'));
                        this.toggleVisible();
                        this.$input = this.$('.edit');
```

这里我们用到了React.js Component的`props`属性，这个属性是由父Component传下来的数据，`props`本身是不可以由子Component自己去改变的，后面我们会讲到，对用户操作会改变的数据，应该使用`state`。

在`index.html`中删除原有的模板，引入`todo-item.jsx`，同时用JSXTransformer来管理所有View的加载：

```diff
@@ -23,16 +23,6 @@
            <p>Written by <a href="https://github.com/addyosmani">Addy Osmani</a></p>
            <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
        </footer>
-       <script type="text/template" id="item-template">
-           <div>
-               <div class="view">
-                   <input class="toggle" type="checkbox" <%= completed ? 'checked' : '' %>>
-                   <label><%- title %></label>
-                   <button class="destroy"></button>
-               </div>
-               <input class="edit" value="<%- title %>">
-           </div>
-       </script>
        <script type="text/template" id="stats-template">
            <span id="todo-count"><strong><%= remaining %></strong> <%= remaining === 1 ? 'item' : 'items' %> left</span>
            <ul id="filters">

@@ -52,16 +42,16 @@
        <script src="js/models/todo.js"></script>
        <script src="js/collections/todos.js"></script>
-       <script src="js/views/todo-view.js"></script>
-       <script src="js/views/app-view.js"></script>
-       <script src="js/routers/router.js"></script>
-       <script src="js/app.js"></script>
+       <script type="text/jsx" src="js/components/todo-item.jsx"></script>
+       <script type="text/jsx" src="js/views/todo-view.js"></script>
+       <script type="text/jsx" src="js/views/app-view.js"></script>
+       <script type="text/jsx" src="js/routers/router.js"></script>
+       <script type="text/jsx" src="js/app.js"></script>
    </body>
 </html>
```

到这里，替换就告一段落了。这个时候我们可以看到原有的功能都是可工作的，现在就可以做一个提交了。

###DOM事件

下面我们开始把DOM事件的处理挪到`todo-item.jsx`中，并且以React.js的方式来做。以toggle为例：

```diff
index js/components/todo-item.jsx
@@ -5,12 +5,28 @@
    app.TodoItem = React.createClass({
 
+       getInitialState: function() {
+           return {
+               completed: this.props.todo.get('completed')
+           };
+       },
+
+       // Toggle the `"completed"` state of the model.
+       toggleCompleted: function () {
+           this.setState({
+               completed: this.props.todo.toggle()
+           });
+       },
+
        render: function() {
            var todoData = this.props.todo.toJSON();
            return (
                <div>
                    <div className="view">
-                       <input className="toggle" type="checkbox" checked={todoData.completed} />
+                       <input className="toggle"
+                           type="checkbox"
+                           checked={this.state.completed}
+                           onChange={this.toggleCompleted}/>
                        <label>{todoData.title}</label>
                        <button className="destroy"></button>
                    </div>
```

```diff
index js/models/todo.js
@@ -18,9 +18,11 @@
        // Toggle the `completed` state of this todo item.
        toggle: function () {
+           var completed = !this.get('completed');
            this.save({
-               completed: !this.get('completed')
+               completed: completed
            });
+           return completed;
        }
    });
 })();
```

```diff
index js/views/todo-view.js
@@ -14,7 +14,6 @@
        // The DOM events specific to an item.
        events: {
-           'click .toggle': 'toggleCompleted',
            'dblclick label': 'edit',
            'click .destroy': 'clear',
            'keypress .edit': 'updateOnEnter',
@@ -64,11 +63,6 @@
                app.TodoFilter === 'completed';
        },
 
-       // Toggle the `"completed"` state of the model.
-       toggleCompleted: function () {
-           this.model.toggle();
-       },
-
        // Switch this view into `"editing"` mode, displaying the input field.
        edit: function () {
            this.$el.addClass('editing');
```

到这里toggle事件就被重构完成了。我们引入了一个新的概念，就是`state`。我们之前提到过，`state`是用来表示Component中，用户通过操作可能改变的数据。关于`state`和`props`的详细区别，这里有一篇文章（[props vs state](https://github.com/uberVU/react-guide/blob/master/props-vs-state.md)）介绍得很好，这里把最关键的部分转载并翻译一下：

| - | _props_ | _state_ | 
|--- | --- | --- 
|能否从**父**Component获取初始值? | Yes | Yes
|**父**Component中的值改变，是否会影响自身的值? | Yes | No
|能否在自身中设置默认值?^ | Yes | Yes
|能否在自身中改变值? | No | Yes
|能否给子Component设置默认值? | Yes | Yes
|自身的值改变，是否会影响传给子Component中的值? | Yes | No

^ 注意：props和state的默认值，都会被父Component传过来的默认值覆盖。

###DOM操作

在View这一层，我们常常会有针对某个Element进行操作的需求，以前我们可能会通过Class、ID或Tag来获取到这个Element，然后调用DOM方法来操作它。而React.js提供了`refs`来完成这个功能：

```diff
index js/components/todo-item.jsx
@@ -18,6 +18,11 @@
            });
        },
 
+       // Switch this view into `"editing"` mode, displaying the input field.
+       edit: function () {
+           this.refs.editInput.getDOMNode().focus();
+       },
+
        render: function() {
            var todoData = this.props.todo.toJSON();
            return (
@@ -27,10 +32,10 @@
                            type="checkbox"
                            checked={this.state.completed}
                            onChange={this.toggleCompleted}/>
-                       <label>{todoData.title}</label>
+                       <label onDoubleClick={this.edit}>{todoData.title}</label>
                        <button className="destroy"></button>
                    </div>
-                   <input className="edit" defaultValue={todoData.title} />
+                   <input ref="editInput" className="edit" defaultValue={todoData.title} />
                </div>
            );
        }
```

```diff
index js/views/todo-view.js
@@ -66,7 +66,6 @@
        // Switch this view into `"editing"` mode, displaying the input field.
        edit: function () {
            this.$el.addClass('editing');
-           this.$input.focus();
        },
 
        // Close the `"editing"` mode, saving changes to the todo.
```

这里之所以React.js专门提供了refs，而没有推荐使用传统方式，我觉得是因为：

1. 避免多余的class或ID，这样我们可以将class只用于样式上，将ID只用于form中，让他们的使用更加符合原始的设计；
2. refs返回的其实不单是DOM对象，而是一个称为“backing instance”的东西，这个我没有查到具体含义是什么，猜测应该是React.js中Virtual DOM中的实例。

###总结

此间省略N步，我们得到了最后的[重构成果](https://github.com/zation/backbone-to-react)，如果希望看中间过程的，可以查看中间的commit diff。

在替换前后之间，我们可以比较一下监听事件的不同，首先来看看替换前我们监听了哪些事件：

```javascript
//todo-view.js
...
initialize: function () {
    this.listenTo(this.model, 'change', this.render);
    this.listenTo(this.model, 'destroy', this.remove);
    this.listenTo(this.model, 'visible', this.toggleVisible);
}
...
```

```javascript
//app-view.js
...
initialize: function () {
...
    this.listenTo(app.todos, 'add', this.addOne);
    this.listenTo(app.todos, 'reset', this.addAll);
    this.listenTo(app.todos, 'change:completed', this.filterOne);
    this.listenTo(app.todos, 'filter', this.filterAll);
    this.listenTo(app.todos, 'all', this.render);
...
}
...
```

然后我们可以全文搜索一下替换后的事件监听，只剩下一个：

```javascript
//app.js
...
app.todos.on('all', render);
...
```

也就是说，不管数据如何变化，不管哪些数据变化了，我都直接拿我关心的数据来render就完了。由于Virtual DOM帮我做了增量式的DOM修改，这一部分就不用我来操心了，那么之前的一大堆事件监听以及相应的事件处理回调都可以省略了，这样代码逻辑的复杂度会降低很多，可维护和可读性会提高很多，同时也没有性能的担忧。React.js真是处理Tempate和View的一大神器啊！

而且重构到最后我发现，如果不是因为Backbone.js的router依赖于jQuery，连jQuery我都可以直接删了。






