---
title: Sass & Compass Best Practise 2
subtitle: 简化代码
date: 2013-01-09 15:39 +08:00
---

[前一篇文章](/2013/01/07/sass_compass_best_practise_1.html)中我们介绍了如何利用Sass来组织我们的代码结构，本文中将会介绍如何利用Compass来简化我们的CSS代码，并且提高CSS代码的复用性。

在我们的CSS开发中，你是否遇到过以下的问题：

* 为了浏览器的兼容性，同样的效果要写很多行，维护起来很麻烦；
* CSS Selector需要有层级关系，但重复的写同样的父元素使代码看起来很冗余；
* 不同的组件拥有同样的样式，但由于有一些细微的差别，导致很难复用，而一旦复用，由于CSS的特性，又不易阅读和维护。

这个时候就应该用到Sass的nest和`@extend`以及Compass的一些内建mixin了。#READMORE#

###简化兼容性代码

当我们在用CSS实现渐变效果时，为了浏览器的兼容性，我们常常会用以下写法：

	/* FF3.6+ */
	background: -moz-linear-gradient(top, #1e5799 0%, #2989d8 50%, #207cca 51%, #7db9e8 100%);
	/* Chrome,Safari4+ */ 
	background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#1e5799), color-stop(50%,#2989d8), color-stop(51%,#207cca), color-stop(100%,#7db9e8)); 
	/* Chrome10+,Safari5.1+ */
	background: -webkit-linear-gradient(top, #1e5799 0%,#2989d8 50%,#207cca 51%,#7db9e8 100%); 
	/* Opera 11.10+ */
	background: -o-linear-gradient(top, #1e5799 0%,#2989d8 50%,#207cca 51%,#7db9e8 100%); 
	/* IE10+ */
	background: -ms-linear-gradient(top, #1e5799 0%,#2989d8 50%,#207cca 51%,#7db9e8 100%); 
	/* W3C */
	background: linear-gradient(to bottom, #1e5799 0%,#2989d8 50%,#207cca 51%,#7db9e8 100%); 
	/* IE6-9 */
	filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#1e5799', endColorstr='#7db9e8',GradientType=0 ); 

一个简单的渐变，就为了兼容性，变成了超过10行的CSS代码，并且让我们维护起来非常麻烦，一旦有任何修改，我们都必须改7个地方⋯⋯好在Compass为我们提供了解决方案，我们只需要一行代码就可以：

	@include background-image(linear-gradient(top, #1e5799 0%,#2989d8 50%,#207cca 51%,#7db9e8 100%)); 

类似的功能可以用在box-shadow：`@include box-shadow(red 2px 2px 10px);`、inline-block：`@include inline-block`、border-radius：`@include border-radius(25px);`⋯⋯等等

###适当的使用nest

在CSS中我们常常需要限制样式的作用范围，例如：

	.container {
		⋯⋯
	}
	.container .article {
		⋯⋯
	}
	.container .article .content {
		⋯⋯
	}
	.container .article .paragraph {
		⋯⋯
	}
	.container .article .link {
		⋯⋯
	}

这样书写在CSS中没有问题，但是重复的书写`.container`和`.article`总会让人感到厌倦，并且使同一部分的样式很容易散落在各处，不容易管理。这时候我们就可以使用nest了，它可以帮助我们：

* 将同一部分的样式归总到一起，方便阅读和维护
* 消除重复的selector，特别是父元素的selector

下面我们来看看使用nest以后的代码：

	.container {
		⋯⋯
		.article {
			⋯⋯
			.content {
				⋯⋯
			}
			.paragraph {
				⋯⋯
			}
			.link {
				⋯⋯
			}
		}
	}

但是切忌不要过分的使用nest，如下：

	.container {
		⋯⋯
		.article {
			⋯⋯
			.content {
				⋯⋯
				.paragraph {
					⋯⋯
					.link {
						⋯⋯
					}
				}
			}		
		}
	}

它会使最后生成出这样的CSS：

	.container {
		⋯⋯
	}
	.container .article {
		⋯⋯
	}
	.container .article .content {
		⋯⋯
	}
	.container .article .content .paragraph {
		⋯⋯
	}
	.container .article .content .paragraph .link {
		⋯⋯
	}

我们看到最后生成的CSS甚至出现了5层selector，一般CSS中出现3层selector已经是比较多了，因为太多的selector会使CSS文件变得冗余，可读性也会变差，而且很难被复用。当你真的需要这么多selector才能完成需求的话，那么你应该反思你的HTML结构是否出现了问题？

###谨慎的使用@extend

`@extend`可以使我们很方便的复用其他元素的样式，假如我们现在有如下的CSS：

	h1, h2 {
		font-family: Arial;
		font-size: 38px;
		color: #222;
	}
	h2 {
		font-size: 24px;
	}

我们可以使用`@extend`使代码看起来依赖关系更清晰，并且稍微简单一些（但它实际生成的CSS代码与前相同）：

	h1 {
		font-family: Arial;
		font-size: 38px;
		color: #222;
	}
	h2 {
		@extend h1;
		font-size: 24px;
	}

它有些类似于`@mixin`，不同在于它自身也是CSS，会被页面直接用到。它的目的在于消除重复，并且使依赖关系更加清晰。但是在使用的时候一定要谨慎，因为一个`@extend`可以很方便的复用代码，人们往往直接这么一用，也不管是否被复用的所有样式都是需要的，也不管最终生成的CSS是否有冗余。所以我们在使用它的时候请先想想一下问题：

* 是否所有的CSS属性都是我所需要的，否则的话复制粘贴其中一部分也不会花太多功夫，不要为了消除重复反而造成冗余
* 我所继承的样式中是否还继承了其他样式，不要有多重继承的情况，这样会导致代码理解变得困难
* 最终生成的CSS代码是否有selector过长的情况，不要写到最后写成了一个reset⋯⋯

鉴于`@extend`有这样那样的问题，虽然它还是有一定的作用，但是建议用之前一定要谨慎。

