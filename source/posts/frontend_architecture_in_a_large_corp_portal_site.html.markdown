---
title: 国内项目天坑记（一）
subtitle: 大型官方网站中的前端选型
date: 2014-06-05 21:08 +08:00
tags: Backbone.js
---

一年多的时间没有写博客了，这段时间一直在加班加点的赶一个国内官方网站项目，基本12*6的工作时间让博客荒废了这么久，现在终于有些时间总结整理一下这个项目中的一些坑和经验。之所以叫做天坑记而不是填坑记，是因为该坑连绵不绝，是一个堪称有生之年的坑……

项目开始的初期，面临着很多许多技术选型，选的好可以让后面的开发事半功倍，选的不好……就只能自己埋的坑自己填了。#READMORE#

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

根据上面的要求，我们确定我们需要以下类型的架构：

* JS MVC Framework: 负责与API交互，并动态选软页面。
* CSS Framework: 帮助我们快速搭建网站，并且很好的管理CSS代码。
* Automation Framework: 自动化的打包、压缩代码，启动开发环境，运行测试。
* Dependency Manager: 管理各种依赖，包括我们自身代码的以及第三方库的。
* Test Framework: 可以与Automation Framework方便的集成，运行我们的测试代码，并且可以方便的mock API。

#### JS MVC Framework

我们考虑的选项有：[Backbone.js](http://backbonejs.org/)，[Angular.js](http://angularjs.org/)。其他还有更多的选项可以在[TodoMVC](http://todomvc.com/)找到，由于其他的框架都不是团队所熟悉的，所以我们不予考虑。

Backbone.js的特点是：

* 非常小巧，加上[Underscore.js](http://underscorejs.org/)也才11.5kb。
* 学习曲线平滑，所有的代码加注释也只有1000多行，通过他自己的[Annotated Source](http://backbonejs.org/docs/backbone.html)，半天就能看完所有的代码。他本身的概念也没有那么多，掌握好Event, Model, Collection, View四个概念就够了。
* 兼容性好，由于没有太多特殊的功能，所以他可以兼容更多的浏览器。
* 项目越大越复杂会导致代码越难维护。由于Backbone.js中的View做了非常多的事情，包括绑定数据、绑定交互事件、与Model交互、管理sub view等等，所以往往view会越来越膨胀；同时因为Backbone.js的简单，意味着我们自己要写更多的代码，越大的项目中Backbone.js与Angular.js的差距越大。

Angular.js的特点是：

* 从2009年就已经诞生，发展到现在功能和社区都非常强大，已经形成了一套从开发理念、配套工具到各种第三方工具都比较完善的生态圈。
* 由于功能强大和独特的开发理念，导致学习曲线非常陡峭。我们需要掌握他的DI, scope, directive等等各种概念，其中特别是由于自有directive导致的scope问题往往让熟手都摸不着头脑。
* 文件比较大，minify以后还是有100多kb。
* 基本不支持IE6, IE7.

综上所述，Backbone.js比较适合兼容性要求比较高的中小型项目，而Angular.js比较适合全站Single Page Application的大型项目，同时兼容性要求不高。最后我们选择了Backbone.js。

#### CSS Framework

我们考虑的选项有：[SASS](http://sass-lang.com/)，[LESS](http://lesscss.org/)。其他的选择还有[Stylus](http://learnboost.github.io/stylus/)。

总的来说这两者本身没有太大区别，虽然LESS号称更加简单，但SASS也没有复杂难用多少，而LESS也具有了所有的关键功能。重要的区别在于SASS有Compass这个工具，可以解决不同浏览器的某些CSS写法不同的问题，可以帮助我们生成Sprites（可以参考我的[这篇博客](http://www.zation.me/2013/01/13/sass_compass_best_practices_3.html)）。

由于SASS有更好的社区支持（[Compass](http://compass-style.org/), [Gravity](https://github.com/owainlewis/gravity), and [Susy](])），所以我们最后选择了SASS。

#### Automation

这里我们只有一个考虑，就是Grunt，当然还有其他选择，比如[Gulp](http://gulpjs.com/)，但是由于Yeoman的主要generator还是使用的Grunt，并且使用新工具也有一定的熟悉时间和风险，所以我们最终还是选择了Yeoman + Grunt。

#### Dependency Manager

前端第三方插件的管理工具现在除了[bower](http://bower.io/)，我不知道有其他的选择了。

对于自身代码的依赖管理工具，并不是选择哪一个框架的问题，基本都是选择[require.js](http://requirejs.org/)，问题在于要不要用这个工具。由于Backbone.js并没有提供模块化和依赖管理的功能，所以我们还是尝试了使用require.js来管理自身依赖，但是实际情况是我们只把require.js用作一个打包代码的工具，而不是加载代码的工具，同时在修改文件名称或路径的时候非常麻烦，因为require.js的依赖是由文件的路径和名称确定的。解决这个问题的方式是使用模块名来定义模块，例如：

    //Explicitly defines the "foo/title" module:
    define("foo/title",
        ["my/cart", "my/inventory"],
        function(cart, inventory) {
            //Define foo/title object in here.
       }
    );

这样不管如何移动或重命名文件都不会有问题了。

#### Test Framework

我们考虑的选项有：[Jasmine](http://jasmine.github.io/)，[Mocha](http://visionmedia.github.io/mocha/) + [Chai](http://chaijs.com/) + [Sinon](http://sinonjs.org/)。

关于Jasmine和Mocha的优缺点，曾经在Yeoman从Jasmine切换到Mocha的时候引发过[讨论](https://github.com/yeoman/yeoman/issues/117)，包括：

* String diffs
* Test coverage reporting
* Simpler async test interface
* ……

所以最终我们的选择是Mocha + Chai + Sinon。

在这些选型完成以后，我们还遇到了不少问题，有一些解决了，成为了项目的亮点，有一些没有解决，就变成了项目天坑的一部分。后面我们会逐个介绍我们遇到的问题和优化，希望对别人能够有所帮助。

