---
title: 使用CSS3制作一个有趣的搜索框
date: 2013-02-04 13:29 +08:00
tags: css3, animation
---

![CSS3](CSS3.png)

动画效果在交互设计中占据着一个非常重要的位置，因为当我们在设计一个产品的时候，我们不仅仅是在设计它的外观，更是在设计它的行为。举例来说，一个好的演员可以利用他的动作、肢体语言使观众感受到角色的内心与特点，甚至将观众带入到相同的内心中，感同身受。同理，一系列好的动画设计，可以让使用者更容易了解产品的用法，感受到产品的特点，从而提升用户体验，甚至是让用户发出“Awesome! I love it！”的感叹。（关于动画到底是如何提升用户体验的，请看Alfredo Aponte的PPT：[UX: Enhancing Experiences with Animation](http://www.slideshare.net/findfado/ux-enhancing-experiences)。）

如今CSS3的日趋成熟，使我们制作网页中动画效果的方式更加的方便和多样，下面让我们来看看使用CSS3如何制作一个有趣的搜索框，所使用到的属性包括**tansform**、**animation**、**keyframes**。最终效果情况本站右上角。#READMORE#

###使用transform绘制搜索框的“尾巴”

通常的搜索框图标都由一个圆圈加一个“尾巴”组成，例如下面的图片：

![Search Box](search_box.png)

一般我们都使用图片来完成这个效果，但是图片会给我们的动画效果造成很大的限制，所以这里我们使用CSS3来实现它。首先是HTML结构：

	<div class="search-container">
		<input placeholder="Search for article title or tags" class="search" type="text">
		<div class="search-qualifier"></div>
	</div>

这里其实我希望只有一个`<input>`就可以实现，尾巴就在`input:after`中实现，这样可以避免无意义的HTML标签。但是`:before`和`:after`这种伪类是将内容插入到某个容器中，但是如果这个容器是自闭和标签（例如：`<img>`、`<input>`），则这些伪类是不起效果的。所以这里我只能加入一个无意义的`<div>`，仅仅用于显示“尾巴”了。

下面我们来看看如何将`<input>`变成一个圆圈（这里我就省略不同浏览器的前缀了）：

	.search {
		height: 18px;
		width: 18px;
		border-radius: 18px;
		background: white;
		border: 3px solid #999999;
		outline: none;
		padding: 3px;
		font-size: 0;
		box-shadow: inset 0 0 2px #999999, 0 0 2px #999999;
	}

只要将`border-radius`设置为边长，或者大于边长，`<input>`就会变成一个圆圈了。

下面我们将`<div class="search-qualifier"></div>`设置为一个短横条，然后再将他以左边中心为原点顺时针旋转45度，一个搜索框的“尾巴”就出现了。来看看具体的代码：

	.search-qualifier {
		 display: block;
		 height: 8px;
		 width: 0;
		 border: 3px solid #999;
		 border-radius: 3px;
		 content: "";
		 position: absolute;
		 top: 24px;
		 right: 2px;
		 transform: rotate(-45deg);
		 transform-origin: 50% 0;
	}

这里要解释一下CSS3的新属性：**transform**。它是用于对元素做2D或者3D变换的，包括旋转、缩放、移动和倾斜等等。`transform: rotate(-45deg)`使`search-qualifier`顺时针旋转45度，然后使用`transform-origin: 50% 0`指定旋转的原点为左边的中心。具体可以参考[w3schools](http://www.w3schools.com/cssref/css3_pr_transform.asp)上面的详细说明。

###使用animation和keyframe让“尾巴”动起来

如果只是使用CSS3绘制这样的图形其实意义不大，与图片相比只是方便程序员调整大小，但是如果我们加入一些动画就不一样了，如果是好的动画效果，它会给用户心理上的惊喜，提高用户体验。下面我们就让“尾巴”可以左右摆动起来！

	@keyframes qualifier-shaking {
		0% {
		  transform: rotate(-75deg);
		}
		100% {
		  transform: rotate(-30deg);
		}
	}

	.search-qualifier {
		...
		animation: qualifier-shaking 1s infinite alternate;
	}

这里要解释一下CSS3的新属性：**keyframes**和**animation**。前者用于定义动画过程，后者用于调用动画。具体定义可以参考w3shcools：[keyframes](http://www.w3schools.com/cssref/css3_pr_keyframes.asp)、[animation](http://www.w3schools.com/cssref/css3_pr_animation.asp)。

我们首先利用`keyframes`定义了一个名为“qualifier-shaking”的动画：在动画开始的时候，“尾巴”的旋转角度为75度，然后顺时针旋转到30度，动画结束。动画定义完成后，就是调用动画了，我们使用`animation`来调用动画：“qualifier-shaking”表明了要调用的动画名称；“1s”是动画执行时间；“infinite”是动画执行次数，这里是执行无限次；“alternate”表明在动画多次执行过程中每次都是从头开始执行，还是以往复执行的方式。

仅仅是左右摇摆还是太单调了一点，我们希望这个“尾巴”可以动得更调皮一些。首先他会隐藏起来，然后每隔一段时间冒个头，摇摆一下再缩回去。

	@keyframes qualifier-shaking {
		0% {
		    height: 0;
		    border-width: 0;
		}
		40% {
			height: 0;
			border-width: 0;
		}
		43% {
			transform: rotate(-45deg);
			height: 8px;
			border-width: 3px;
		}
		46% {
			transform: rotate(-75deg);
		}
		49% {
			transform: rotate(-30deg);
		}
		52% {
			transform: rotate(-45deg);
			height: 8px;
			border-width: 3px;
		}
		57% {
			transform: rotate(-45deg);
			height: 8px;
			border-width: 3px;
		}
		60% {
			height: 0;
			border-width: 0;
		}
		100% {
			height: 0;
			border-width: 0;
		}
	}
	
	.search-qualifier {
		...
		animation: qualifier-shaking 6s infinite;
	}

这里我们设置更多的动画段，首尾两端都让“尾巴”隐藏，然后利用`height`和`border-width`的改变让“尾巴”冒头和缩回，其余都跟上一个例子相同。这里的animation也设置了更长的执行时间。

到此为止，一个有趣的CSS3搜索框就做好了。在现代的前端开发中，CSS已经可以完成动画的操作了，那么我们就尽量用CSS来完成，js最多就只用作改变class来触发动画。因为现在js负责的前端逻辑处理已经很多了，再给js加上动画处理的代码很容易导致项目js代码的爆炸。同时CSS3动画有来自浏览器自身的支持，效率和效果上都会 更好一些。