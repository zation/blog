---
title: 聊一聊基于Flux的前端系统
subtitle: 基础架构以及演进
date: 2015-04-09 22:46 +08:00
tags: Javascript, React.js, Flux
---

在最近的一个项目中，我们团队尝试了Flux + React.js的架构，在这种架构中我们获得了很多的好处：

* 数据流更加清晰和简单，使得我们的开发和debug也可以按照一个清晰和标准的方式进行；
* 数据处理这一层的职责更加清晰，使得我们可以更容易的进行数据维护、缓存的处理；
* 在界面的处理上只用关心界面的最终状态，不需要维护中间过程；
* ……

下面我们就来聊一聊我们团队在这种架构中的一些实践，希望可以对大家有用。#READMORE#

### 基础架构以及Why

在这个项目中我们采用的基础架构是reflux.js + react.js + 一些小的liberay，例如：director.js，jquery.js，lodash.js。

#### reflux.js
选用reflux.js作为Flux的实现，是因为现在reflux.js是Github上最受欢迎的一个实现，并且提供了非常实际的便捷。它和Facebook Flux主要的不同在于：

* 没有了dispatcher这一层，actions直接是listenable的；
* stores可以直接listen actions，而不需要用swtich去区分一大堆Action types；
* stores提供了很多方便的方法使得view可以很方便的监听；
* 提供了一种比较好的思路来处理API请求这种异步actions。

下面是一个例子：

```js
var Reflux = require('reflux');
var React = require('react');

var UserAction = Reflux.createActions({
    'login': {children: ['success', 'failed']}
});

UsersAction.login.listen(function(data) {
    $.post('/api/users/Action/login', data).then(this.success, this.failed);
});

var UserStore = Reflux.createStore({
    listenables: UserAction,
    onLoginSuccess: function(payload) {
        this.trigger(payload);
    },
    onLoginFailed: function(payload) {
        this.trigger(payload);
    }
});

var UserComponent = React.createClass({
    mixins: [Reflux.connect(UserStore, 'user')],
    render: function() {
        return <span>{this.state.user.name}</span>;
    }
});
```

在我看来最大的好处就是，少写了很多代码，并且代码的可读性还挺好的。

#### liberaies

在这个项目中我们选用了很多小而专的liberay，而不是选用一个大而全的framework（例如：Angular.js，Ember.js），是因为选用那样的framework风险比较大，替换成本很高，一旦出现了像Angular.js 2.0这样的升级，对团队来说比较痛苦。而选用小liberay的集合，要替换其中某一部分是很容易的。并且不会被framework的principle和DSL所绑架，比较好行程适用于自己项目domain的principle和DSL。

下面来介绍一下我们用到的liberay：

* director.js是一个Server端和Client端通用的router工具。
* jquery.js就不用介绍了。选这个主要是用来做来项目中的Ajax call、promise工具，原因也是被逼无奈，我们用到的很多插件都基于它，为了不增加额外的加载量，也就只有将就用它了。
* lodash.js这个也不用介绍了，比underscore.js性能更高，功能更强。

### 架构的演进

前面介绍了我们项目的基础架构，由于我们是用了各种小liberay，并且都是我们自己选的，那么就没有一个现成的架构来告诉我们这样架构的最佳实践是什么，一切都需要我们自己去探索和演进。下面我就来介绍一下项目各个部分的演进路线是什么样的，以及为什么会出现这样的演进。

#### 页面render的lifecircle

项目开始时是非常简单的render方式，就是当route改变时，router根据最新的route去选择某个component render到页面中：

```js
var Router = require('director').Router;
var $ = require('jquery');

var router = new Router({
    '/login': function() {
        React.render(React.createElement(LoginComponent), $('.container').get(0));
    }
}).configure();
```

然后我发现在很多时候我需要在程序中去控制页面跳转，例如：登录成功以后跳转到首页。于是我就在登录后用 `window.location.hash = '/'` 去做跳转。后来我发现程序中到处都是 `window.location.hash = 'xxx'`，到处修改这种全局变量不是一个好的实践，并且这样在未来做isomophic也会很难。于是我决定用Flux的方式来处理这一部分逻辑。很显然，这里的Store存储的是当前的route，Action所触发的是route的改变，于是我们增加了RouteStore和RouteAction：

```js
var RouteAction = Reflux.createActions(['navigateTo']);

var RouteStore = Reflux.createStore({
    listenables: RouteActions,

    onNavigateTo: function(newRoute) {
        this.trigger(newRoute);
    }
});

RouteStore.listen(function(newRoute) {
  router.setRoute(newRoute);
});
```

这样所有的 `window.location.hash = 'xxx'` 都被替换成了 `RouteAction.navigateTo('xxx')`。

后来当页面增加，我发现在route配置中出现了很多重复的代码，例如：

```js
var router = new Router({
    '/login': function() {
        React.render(React.createElement(HeaderComponent), $('.header').get(0));
        React.render(React.createElement(LoginComponent), $('.container').get(0));
    },
    '/register': function() {
        React.render(React.createElement(HeaderComponent), $('.header').get(0));
        React.render(React.createElement(RegisterComponent), $('.container').get(0));
    },
    '/profile': function() {
        React.render(React.createElement(HeaderComponent), $('.header').get(0));
        React.render(React.createElement(ProfileComponent), $('.container').get(0));
    }
}).configure();
```

同样，我希望把这种layout和page的render也用Flux的方式来进行管理。那么这里Store所存储的就是页面的component，Action所触发的就是页面component的改变，于是我增加了PageStore和PageAction，同时把各种layout放到PageComponent中管理：

```js
var PageAction = Reflux.createActions(['render']);

var PageStore = Reflux.createStore({
    listenables: PageActions,

    onRender: function(component, props) {
        this.trigger({
            component: component,
            props: props
        });
    }
});

var PageComponent = React.createClass({
    mixins: [Reflux.connect(PageStore, 'page')],

    render: function() {
        return (
            <div>
                <HeaderComponent />
                <PageComponent {...this.state.page.props} />
            </div>
        );
    }
});
```

然后我们route的配置就可以很简单了：

```js
var router = new Router({
    '/login': function() {
        PageAction.render(LoginComponent);
    },
    '/register': function() {
        PageAction.render(RegisterComponent);
    },
    '/profile': function() {
        PageAction.render(ProfileComponent);
    }
}).configure();
```


最近我们还加上了一个需求，就是对于profile页面，只能让登录的用户进入，对于这种需求在这种架构下就很好添加了，只需要修改PageAction:

```js
var PageAction = Reflux.createActions(['render', 'renderIfLogin']);

PageAction.renderIfLogin.preEmit = function(component, props) {
    if (userIsLogin) {
        PageAction.render(component, props);
    } else {
        RouteAction.navigateTo('/login');
    }
}
```

然后在profile页面，我们调用`PageAction.renderIfLogin(ProfileComponent)`这样如果用户没有登录，就会被自动跳转到登录页面。

现在我们来总结一下当前的页面render lifecircle：

```
    URL  ===trigger===>  Router  ===call===> PageAction.render 
     /\                                            ||
     ||                                          trigger         
  tirgger                                          ||
     ||                                            \/
    界面 <==render== PageComponent <==trigger== PageStore
```

整个就是一个基于事件的单向数据流了！

#### Store与Action

这里用UsersStore和UsersAction作为示例。其实最开始的时候，它们是UserStore以及UserAction，因为系统中最开始只需要记录和操作当前登录的user：

```js
var UserAction = Reflux.createActions({
    asyncResult: true,
    children: ['login', 'register']
});

UserAction.login.listen(function(data) {
    $.post('/api/users/Action/login', data).then(this.loginCompleted);
});

UserAction.register.listen(function(data) {
    $.post('/api/users', data).then(this.registerCompleted);
});

var UserStore = Reflux.createStore({
    listenables: UserAction,
    onLoginCompleted: function(payload) {
        this.trigger(payload);
    },
    onRegisterCompleted: function(payload) {
        this.trigger(payload);
    }
});
```

当时的UserStore非常简单，没有任何逻辑，只是把API返回的数据trigger给View就完了。但是当我们增加了显示当前所有user list的需求，我们就必须又增加一个UsersStore和UsersAction：

```js
var UsersAction = Reflux.createActions({
    asyncResult: true,
    children: ['fetch']
});

UsersAction.fetch.listen(function(data) {
    $.get('/api/users', data).then(this.fetchCompleted);
});

var UsersStore = Reflux.createStore({
    listenables: UsersAction,
    onFetchCompleted: function(payload) {
        this.trigger(payload);
    }
});
```

但是如果只是简单的这么写，就会有一个陷阱，因为UsersStore其实是包含了UserStore的，也就是说当前user的数据需要在两个地方维护；并且同样一个Domain，被分成了两个Action + 两个Store，也非常奇怪。基于以上两点，我决定针对同一个Domain，只会有一个Action和一个Store与之对应，这样概念上更好理解，并且不会出样同一份数据，要在两处维护的麻烦。于是UserAction和UserStore就被合并到了UsersAction和UsersStore中：

```js
var UsersAction = Reflux.createActions({
    asyncResult: true,
    children: ['fetchAll', 'login', 'register']
});

UsersAction.fetchAll.listen(function(data) {
    $.get('/api/users', data).then(this.fetchCompleted);
});

UsersAction.login.listen(function(data) {
    $.post('/api/users/Action/login', data).then(this.loginCompleted);
});

UsersAction.register.listen(function(data) {
    $.post('/api/users', data).then(this.registerCompleted);
});

var users = [];
var UsersStore = Reflux.createStore({
    listenables: UsersAction,
    onFetchAllCompleted: function(payload) {
        users = payload;
        this.trigger(users);
    },
    onLoginCompleted: function(payload) {
        var index = users.findIndx({id: payload.id});
        if (index < 0) {
            users.push(payload);
        } else {
            users[index] = payload;
        }
        this.trigger(users);
    },
    onRegisterCompleted: function(payload) {
        users.push(payload);
        this.trigger(users);
    }
});
```

这样的架构我们使用了很长一段时间，但是当Domain的数量增加以后，我们发现每个Store做的事情其实都一样：把API返回的数据，根据ID merge进他自己的list里面。对于这种重复性很高，通用性有很强的逻辑，我们把它抽出来做成了一个Node Package，叫做[traction](https://github.com/zation/traction)。它可以根据一个指定的key，将两个数据进行merge，可以是从Object到Array，也可以是Array到Array，具体说明可以参考它的README。

于是我们的Store代码就可以进一步简化为：

```js
var traction = require('traction');

var users = [];
var UsersStore = Reflux.createStore({
    listenables: UsersAction,
    onFetchAllCompleted: function(payload) {
        users = traction.merge(payload).to(users).basedOn('id');
        this.trigger(users);
    },
    onLoginCompleted: function(payload) {
        users = traction.merge(payload).to(users).basedOn('id');
        this.trigger(users);
    },
    onRegisterCompleted: function(payload) {
        users = traction.merge(payload).to(users).basedOn('id');
        this.trigger(users);
    }
});
```

然后我们发现其实Store里面监听不同的Action所做的事情都是一样的，那么我们可以进一步简化：

```js
var UsersAction = Reflux.createActions(['fetchAll', 'login', 'register', 'save']);

UsersAction.fetchAll.listen(function(data) {
    $.get('/api/users', data).then(this.save);
});

UsersAction.login.listen(function(data) {
    $.post('/api/users/Action/login', data).then(this.save);
});

UsersAction.register.listen(function(data) {
    $.post('/api/users', data).then(this.save);
});

var users = [];
var UsersStore = Reflux.createStore({
    listenables: UsersAction,
    onSave: function(payload) {
        users = traction.merge(payload).to(users).basedOn('id');
        this.trigger(users);
    }
});
```

然后我们又遇到新的问题了，就是在很多地方我要拿到当前的user，而在上面那样统一处理以后我就没有办法拿到了。针对这个问题有两种解决方案：

1. 添加一个CurrentUserStore，要那当前user，就可以监听这个Store。但是这样就会又导致同一份数据在两个地方维护的问题，所以这并不是一个推荐的解决方案。
2. 在UsersStore中，针对当前user的那一条数据添加一个flag，例如：isLogin，然后我在其他地方就可以使用 `users.find('isLogin')` 来拿到当前登录的那个user了。

要使用第二个解决方案，我们需要对login的action和UsersStore都进行一些改造，下面是一个示例：

```js
UsersAction.login.listen(function(data) {
    $.post('/api/users/Action/login', data).then(function(data) {
        this.save(data, true);
    });
});

var users = [];
var UsersStore = Reflux.createStore({
    listenables: UsersAction,
    onSave: function(payload, isLogin) {
        if (isLogin) {
            payload.isLogin = true;
        }
        users = traction.merge(payload).to(users).basedOn('id');
        this.trigger(users);
    }
});
```

看到这里好像还少了点什么？对，就是错误处理。很多时候我们需要显示Server端的错误，或者是当401的时候跳转到登录页面。针对这个我们的处理方式是有一个全局的ExceptionAction和ExceptionStore：

```js
var ExceptionAction = Reflux.createActions(['serverError']);

ExceptionAction.serverError.preEmit = function(error) {
    if (error.status === 401) {
        RouteActions.navigateTo('/login');
    }
}

var ExceptionStore = Reflux.createStore({
    listenables: ExceptionActions,

    onServerError: function(payload) {
        this.trigger(payload);
    }
});
```

需要显示Server端错误信息的Component就可以监听ExceptionStore了。

到这里为之就是我们Action和Store的当前形态了。其实现在可以看出来，当merge数据的逻辑被抽出来以后，Store就是一个缓存了，后面要做的一件事情可能就是，Action需要根据Store的状态来决定到底是从API去读数据，还是从某个Client缓存（例如：LocalStorage）读数据。

最后我们来总结一下关于Action和Store的一些最佳实践：

* 不要在Action做任何针对数据的逻辑处理，把最纯粹的数据交给Store来处理；
* 针对同一个Domain只能有一个Store与之对应，对Action同理；
* Store在维护自身数据的时候需要考虑到很多情况，例如：单个数据的添加/修改、多个数据的添加/修改。推荐使用[traction](https://github.com/zation/traction)来进行处理；
* 对于Store中需要特殊存储的数据，建议使用一个flag来标识，而不是再增加一个Store。

### 遗留的一些问题

#### 重复的数据请求

由于我们现在项目中，fetchAction的触发都是由需要那个数据的Component自己触发的，这样就有可能导致一个页面中重复发出同一个请求。例如：每个页面都会有一个header，header中会显示用户名，那么header就会去调用 `UsersAction.fetchCurrent`；在profile页面，显示profile信息的component肯定也需要user信息，那么他也会去调用 `UsersAction.fetchCurrent`。这样在profile页面就会有两个同样的请求发出。

#### 如何做数据缓存？

对于数据缓存我们已经有了一些方向，例如：对于缓存的操作，是由Store来进行；对于是从缓存来读取数据，还是从API读取数据，是由Action来决定。但问题是如果要由Action来决定，那么Action又需要知道Store的状态，现在能想到的方法就是Store上有个 `getData` 的接口让Action来获取数据，然后Action就可以做判断了。不过我们希望可以有更好的方式，也许Action可以不用持有Store就可以完成这个判断？

大家对于这两个问题有什么看法，欢迎大家在评论中与我讨论，也欢迎来信讨论，我的电子邮件是 <zation1@gmail.com>。谢谢！








