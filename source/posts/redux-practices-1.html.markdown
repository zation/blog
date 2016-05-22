---
title: Redux架构实践（一）
subtitle: Single Source of Truth
date: 2016-05-04 23:09 +08:00
tags: Javascript, React, Redux
---

在现代前后端分离的系统架构中，后端负责数据处理，前端负责数据展示。这种架构能够有效的分离数据处理和数据展示的逻辑，让同一套数据处理逻辑可以被不同的数据展示逻辑复用。这里的复用现在大部分是基于Restful的API协议。

理想是很丰满的，现实缺很残酷。在有复杂的业务数据结构的情况下，我们常常会遇到不同的API返回了同样的数据，如果不同的component的显示直接依赖于API数据的返回，很有可能就会有不同的component对于同样的数据所显示的结果不一样的bug。再加上缓存、用户修改数据等等复杂情况，显示不一致的问题可能更加严重，所以为了解决这个问题，Single source of truth（以下使用中文名称：单一数据源）的概念被提出来了。下面我们就来看看如何在Redux的架构中实现单一数据源的。#READMORE#

### 多数据来源的问题

我们首先来想象一个书单应用：用户可以创建多个书单，然后将书籍添加到各种书单中。那么会有下面几个API：

**获取书单列表**，GET /api/booklists

```js
[{
    id: 1,
    name: '第一个书单',
    books: [{
        id: 1,
        name: '西游记',
    }, {
        id: 2,
        name: '红楼梦',
    }]
}]
```

**获取书籍列表**，GET /api/books

```js
[{
    id: 1,
    name: '西游记',
}, {
    id: 2,
    name: '红楼梦',
}, {
    id: 3,
    name: '水浒传',
}, {
    id: 4,
    name: '三国演义',
}]
```

**编辑书籍名称**，PUT /api/books/:id

```js
{
    id: 1,
    name: '新西游记',
}
```

作为redux应用，我们的store中就会有两个节点`booklists`和`books`来存储这两个数据，并且会有两个container `BooklistsContainer`和`BooksContainer`分别显示书单中的数据和所有书籍的信息。

假设书单的显示和书籍的编辑都在同一个页面，我们修改了书籍的名字，那么`BooklistsContainer`中书籍的名字还是显示了以前的名称，要修复这个问题，我们只能让`booklists`的reducer也监听编辑书籍名称的action，同时修改`booklists`中嵌套的书籍名称。这种处理方式在数据简单的时候没有问题，但是如果我们在很多其他的地方也使用了书籍的信息，或者书籍的信息不光是名称，还有价格、作者等等更加复杂，嵌套层次更加深的数据，那么这样的数据维护是非常困难的。总结起来主要问题有下面几个：

* 每个涉及到书籍信息的reducer都需要监听书籍信息的任何修改（编辑、删除等），这样会造成很多重复逻辑，并且散落在很多reducer中，维护困难，对于新人来说也容易犯错。
* 书籍信息的修改会触发很多reducer的重新计算和store的大范围更新，性能很低。
* 同样的书籍信息被做成了多个拷贝，放在store的不同节点中，浪费内存空间，如果对这些数据做缓存，那还会浪费存储空间。

### 如何解决多数据来源的问题

我们可以看到产生问题的根本原因，就是书籍信息保存在`books`的情况下，`booklists`中就含有了冗余信息。那么要解决这个问题的办法就是要去掉这些冗余信息，让每个信息都只有单一的数据来源，所有书籍信息都从`books`来，`booklists`中只需要存储与之相关的`books`主键信息。

具体做法可以是在`booklists`的reducer中，将数据结构变成下面这样：

```js
[{
    id: 1,
    name: '第一个书单',
    books: [1, 2],
}]
```

然后在`BooklistsContainer`的state mapper中，将`books`与`booklists`的数据merge到一起。这样最后显示的数据一定是正确并且最新的书籍信息。

但是这样如果在每个reducer里面都做这种map，还是会有很多重复的逻辑，而且API返回的数据可能是array，可能是object，要把这些逻辑统一起来还是挺复杂的。[normalizr](https://github.com/paularmstrong/normalizr)就是redux的作者，为了解决这两个问题开发的开源库。它只需要你有最简单的schema定义，就可以帮你做到一样的数据转换。

下面是针对我们实例的schema定义：

```js
import { arrayOf, Schema } from 'normalizr';

const booklist = new Schema('booklists');
const book = new Schema('books');
booklist.define({ books: arrayOf(book) });
```

在reducer中，只需要调用`normalize`方法，就可以得到我们希望的数据结构：

```js
import { normalize, arrayOf } from 'normalizr';

const finalResponse = normalize(response, arrayOf(booklist));
```

`finalResponse`的数据结构就会变成这样：

```js
{
    result: 1,
    entities: {
        booklists: {
            1: {
                id: 1,
                name: '第一个书单',
                books: [1, 2],
            }
        },
        books: {
            1: {
                id: 1,
                name: '西游记',
            }, 
            2: {
                id: 2,
                name: '红楼梦',
            }
        }
    }
}
```

这样我们就可以有一个统一的entities节点，来存储所有API数据，每次API请求都统一在entities的reducer里面做merge就可以了。这样做还有一个好处，就是我们在读取单个数据的时候，就不需要根据id去遍历所有数据了，只需要通过`booklists[id]`就能得到。

### 实际使用中会有什么样的坑

理想很丰满，现实很残酷，虽然我用很简单的实例介绍了单一数据源和normalizr这种方案的好处，但是实际使用中还是会有很多情况是需要特殊处理的。

#### 临时数据

是不是所有的API请求都适用于这套处理方式呢？的确，理想中所有API都这样处理以后，数据会非常干净，但是实际中我们不可能一次就把所有的书籍信息都读取到客户端，因为世上所有的书籍信息是一个超级庞大的数据，所以我们更多的时候是有一个搜索书籍的功能。

搜索的结果其实就是临时的数据，搜索条件变更或者添加到书单中以后，这些搜索结果就没有用处了，需要被清理掉。他的实时性非常高，所以你不用担心数据是否不是最新的；同时他被使用以后就会清除，是一种一次性的数据。对于这种数据就可以不放在entities节点中。entities节点中存放的应该是在app的大部分生命周期都会重复使用的数据。

#### normalizr不能处理的数据

normalizr毕竟只是一个简单的数据处理，还有一些情况是处理不了的，比如说booklist中的每个book都有备注：

```js
[{
    id: 1,
    name: '第一个书单',
    books: [{
        id: 1,
        name: '西游记',
        remark: '好看',
    }]
}, {
    id: 2,
    name: '第二个书单',
    books: [{
        id: 1,
        name: '西游记',
        remark: '很好看',
    }]
}]
```

这样就造成了同一个book，在不同的booklist中，有不同的属性，在normalizr做处理时，就会出现warning，并且只保留最后一个数据：

```js
{
    result: 1,
    entities: {
        booklists: {
            1: {
                id: 1,
                name: '第一个书单',
                books: [1],
            },
            2: {
                id: 2,
                name: '第二个书单',
                books: [1],
            }
        },
        books: {
            1: {
                id: 1,
                name: '西游记',
                remark: '很好看'
            },
        }
    }
}
```

所以这样的数据直接交给normalizr就会造成数据丢失。这个问题有两种处理方式：

##### 中间表

我们可以认为remark并不是book这个domain独有的属性，而是与book和booklist都有关，在数据库设计的时候，我们会用一个中间表来记录这样的数据，这里我们也可以借鉴这样的中间表，在entities中新建一个节点叫做booklistBook，所有同时与booklist和book相关的数据，都放在这里面：

```js
// booklistBook
[{
    booklistId: 1,
    bookId: 1,
    remark: '好看',
}, {
    booklistId: 2,
    bookId: 1,
    remark: '很好看',
}]
```

但是这种处理方式，需要我们在normalizr处理之前，自己先处理一次数据，并且在state mapper部分merge数据的时候比较麻烦。它的好处是让数据结构很清晰。

##### 保留在booklist中

如果这个remark只在会使用booklist的上下文中使用的话，那么把remark信息放在booklist上会让我们使用的时候非常方便。

```js
{
    result: 1,
    entities: {
        booklists: {
            1: {
                id: 1,
                name: '第一个书单',
                books: [{
                    id: 1,
                    remark: '好看',
                }],
            },
            2: {
                id: 2,
                name: '第二个书单',
                books: [{
                    id: 1,
                    remark: '很好看',
                }],
            }
        },
        books: {
            1: {
                id: 1,
                name: '西游记',
            },
        }
    }
}
```

这里就需要自定义normalizr的merge function了，通过配置`mergeIntoEntity`可以到达这个目的。这样做会让数据格式出现不统一的情况，有些关联数据我们就简单的用一个array保存id，有些关联数据的array中除了id还有其他数据。

这两种方式各有优劣，暂时还没有一个很完美的解决方案。如果小伙伴们有什么建议，欢迎讨论~

最后怀念一下和[大招](https://github.com/morlay)还有其他小伙伴一起捣鼓redux的日子，很多好的想法和架构都是从他们身上学习到的。





