---
title: 如何在阿里云上部署私有的Docker Registry
date: 2015-05-06 22:41 +08:00
tags: Docker, Ops
---

![Aliyun and Docker](aliyun_docker.png "Aliyun and Docker")

关于什么是Docker，为什么要使用Docker，使用Docker的基础知识这里就先不赘述了，有很多的参考资料都有了详尽的介绍，比如说这本Gitbook：[《
Docker —— 从入门到实践》](https://www.gitbook.com/book/yeasy/docker_practice/details)。

这里先简要介绍一下为什么要在阿里云上部署私有的Docker Registry：

* 使用[Docker Hub](https://registry.hub.docker.com/)来存放Docker Image，经常会出现Push/Pull timeout，你们懂的；
* 我司现在各个Server都是放在阿里云上的，如果我们把Docker Registry也放在阿里云上，那么我们做release的速度就会相当快；

背景介绍完了，下面我们就来看看具体如何部署吧。#READMORE#

### 什么是Docker Registry

也许一些Docker的新人，对于什么是Registry还不太清楚，这里我大概讲解一下，了解的人可以直接略过这一部分了。

Docker Registry就是可以存放很多Docker Repository的服务器。举个例子，比如我们在内网192.168.0.1的5000端口上创建了一个Registry，并且其中有一个ubuntu 12.04的Image，那么我们就可以用下面这个命令来获取它：

```bash
$ docker pull 192.168.0.1:5000/ubuntu:12.04
```

其中**192.168.0.1:5000**就是Registry的服务器地址和端口，**ubuntu**就是Repository的名字，**12.04**指示了版本号，也具体指向了一个Image。所以也可以这么理解：定位一个Image的方式是Registry + Repository + Version。

Docker Registry主要有两种：公开的和私有的。最大的公开Registry就是[Docker Hub](https://registry.hub.docker.com/)，不过他也提供了私有Registry的服务，每个帐号可以有一个免费的Private Image，如果多了就要付费。但是对于国内来说他是基本很难连上的。私有Registry就是个人或者公司搭建的，通过网络隔离或者某种认证手段，只允许内部访问。

### 在阿里云上安装Docker

由于我们的Registry会使用最新的2.0版本，所以安装的Docker也必须是最新的1.6版本，apt-get还是1.5，所以这里我们使用官方的脚本进行安装：

```bash
wget -qO- https://get.docker.com/ | sh
```

安装完成以后你会发现，再启动Docker的时候有报错：

```log
Could not find a free IP address range for xxx
```

没错，这就是阿里云的坑，具体原因和解决方案可以参考[这里](http://hanjianwei.com/2014/07/30/docker-on-aliyun/)，简单来说的话就是：修改`/etc/network/interface`，去掉172那段的路由，然后运行

```bash
$ route del -net 172.16.0.0/12
```

现在运行`$ service docker start`就可以启动Docker了。

### 安装并运行Docker Registry

在服务器上安装Docker Registry主要有两种方式：本地安装；通过Image安装。这里我推荐用Image安装，因为安装最快，启动也方便。

Docker官方已经很贴心的将一个完整的Docker Registry打包成了一个Image，我们只需要把它run起来就“可以了”：

```bash
$ docker run -d -p 5000:5000 registry:2.0
```

然后Docker会检查你本地有没有registry:2.0这个镜像，如果没有的话它就会默认从Docker Hub上面Pull下来，然后就会run起来了。

安装和启动完成以后，可以访问一下[http://localhost:5000/v2/](http://localhost:5000/v2/)，如果看到服务器返回了一个空的JSON`{}`，那么说明运行已经成功了。大家以为大功就要告成了吗？其实征途才刚刚开始啊！

### 从本地把Image Push到Docker Registry中

我是万万没有想到，这临门一脚的一步，却是最难的一步，也是最费时间精力的一步，我为什么要写这篇博客，就是希望大家可以在这一步少走弯路。

假设我们现在本地有一个叫做hello-world的Image，而我们阿里云上的Registry的IP是120.1.1.1，端口是5000。当我们想要把hello-world Push到阿里云的Registry中时，首先我们要指定它的Registry：

```bash
$ docker tag hello-world:latest 120.0.0.1:5000/hello-world:latest
```

然后我们很自然的就会去运行Push命令：

```bash
$ docker push 120.0.0.1:5000/hello-world:latest
```
于是你就看到下面这个错误了：

> FATA[0000] Error response from daemon: v1 ping attempt failed with error: Get https://120.0.0.1:5000/v1/_ping: tls: oversized record received with length 20527. If this private registry supports only HTTP or HTTPS with an unknown CA certificate, please add `--insecure-registry 120.0.0.1:5000` to the daemon's arguments. In the case of HTTPS, if you have access to the registry's CA certificate, no need for the flag; simply place the CA certificate at /etc/docker/certs.d/120.0.0.1:5000/ca.crt

这是由于我们并没有把一个通过认证的安全证书加到Registry服务器中。这里就涉及到如何添加安全证书，以及如何设置安全认证，关于这两点官方都有很详尽的文档，可以参考[Configure TLS on a registry server](https://docs.docker.com/registry/deploying/#configure-tls-on-a-registry-server)，以及[Registry Configuration Reference](https://docs.docker.com/registry/configuration/#auth)。但是还是有一些场景是不需要安全证书以及安全认证的，关于如何绕过这些安全配置，我就没有找到一个很好的教程了。下面就是我自己摸索出来的配置方式，总得来说就是我们要在执行Pull和Push的地方配置好`insecure-registry`这个参数：

#### 对于开发环境（Windows，OSX）
一般我们都使用了boot2docker，所以这里是基于boot2docker的配置。

进入到运行Docker的虚拟机中

```bash
$ boot2docker ssh
```

修改Docker启动配置文件

```bash
$ sudo vi /var/lib/boot2docker/profile
```

添加配置
> DOCKER_OPTS="--insecure-registry 120.0.0.1:5000"

这里的`120.0.0.1:5000`就是你的Registry所在服务器的IP和端口号。如果你需要向多个Registry Push，或者从多个Registry Pull，那么你可以添加多个`insecure-registry`，例如：

> DOCKER_OPTS="--insecure-registry 120.0.0.1:5000 --insecure-registry 120.0.0.2:5000"

退出Docker虚拟机后重启Docker

```bash
$ boot2docker restart
```

现在终于可以在本地环境build镜像，然后往我们搭建起来的Registry Push了。

#### 对于生产环境（Ubuntu，CentOS）
跟开发环境差别不大，目的都是一样的，只是手段不同。

ssh到我们需要部署镜像的生产服务器上，修改Docker启动配置文件

```bash
$ sudo vi /etc/default/docker
```

添加配置

> DOCKER_OPTS="--insecure-registry 120.0.0.1:5000"

重启Docker

```bash
$ service docker restart
```

现在可以在生产服务器上Pull放在我们私有Registry中的Image了。

### 总结

到这里整个配置就完成了，我感觉最坑爹的地方在于，这个`insecure-registry`的配置其实是针对Pull这个操作的，但是Push也需要这个配置，而且这个配置在Push/Pull的时候不能指定，必须在启动Docker的时候指定，每次改了还得重启Docker……社区对于这个丧病的行为已经诸多意见了，例如这个issue：[--insecure-registry should be on "docker pull"](https://github.com/docker/docker/issues/8887)，但是目前为止Docker还没有修改。甚至有人还在这个issue里面贴出了更加丧病的work around，就是使用ssh tunnel：

```bash
$ docker pull host:5000/image #fails
$ ssh -N -L 5000:host:5000 user@host
$ docker pull localhost:5000/image #works
```

希望Docker的后续版本可以更加方便的向私有Registry Pull和Push，或者是有更加方便的配置安全证书和安全认证的方式。