# v_jstools 

```
一个用于js页面逆向调试的工具。
```

2025/07/16: 更新了插件的 manifest V3 版本，重构了代码。旧版已留档：[manifest v2 版本在此下载](https://github.com/cilame/v_jstools/releases/tag/mainfest.v2)

当前是 manifest V3 版本 (完整功能需要 chrome 大于105版本)

- [1 下载方式](#1-下载方式)
  * [1.1 直接 github 上下载到本地解压](#11-直接-github-上下载到本地解压)
  * [1.2 通过 python 的 pip 命令行直接下载](#12-通过-python-的-pip-命令行直接下载)
- [2 核心功能描述](#2-核心功能描述)
  * [2.1 挂钩页面api](#21-挂钩页面api)
  * [2.2 注入代码](#22-注入代码)
  * [2.3 生成js环境代码](#23-生成js环境代码)
  * [2.4 js分析代码工具包](#24-js分析代码工具包)
- [3 插件交流平台](#3-插件交流平台)



# 1 下载方式

```
有两种下载方式
1 直接 github 下载
2 通过 python 的 pip 命令行下载(无需翻墙)
```

## 1.1 直接 github 上下载到本地解压

- [下载地址](https://github.com/cilame/v_jstools)

![download_addr.png](./img/download_addr.png)

- 下载后右键选中 “解压到当前文件夹” ，然后将该文件拖动到 chrome 插件页中。

![drag_install.png](./img/drag_install.png)

安装详细动态图：

![download_install.gif](./img/download_install.gif)

## 1.2 通过 python 的 pip 命令行直接下载

使用命令行安装方式，目前只支持 v3 版本的下载安装。

```
pip install v_jstools
```

使用命令行，会自动解压并打开目标文件地址，这样直接拖拽目标文件夹到 chrome 插件页中。

```
v_jstools unpack vvv
```

详细动图：

![pip_install.gif](./img/pip_install.gif)







# 2 核心功能描述

```
1 挂钩页面 api
2 注入代码
3 生成js环境代码
4 js分析代码工具包
	- 文本对比页面（就是一个简单的文本对比工具）
	- JS脚本库（存放了打包好的一些常用的脚本，单脚本使用很方便）
	- AST 语法（用于分析 JS 的 AST 的工具页面）
	- AST 工具（用于简单的 压缩/解压缩/混淆/解混淆 工具，不过由于v3权限，所以能做的有限）
	- AST 分析（直接在当前页面注入一个页面，可以利用当前页面环境中的函数）
	- WASM 分析（直接在当前页面注入一个页面，可以做简单的 WASM 代码的分析）

```

## 2.1 挂钩页面api

详细动图：

![api_hook.gif](./img/api_hook.gif)

## 2.2 注入代码

配置后就能注入代码，关闭调试状态则自动取消注入。

详细动图：

![inject_code.gif](./img/inject_code.gif)

## 2.3 生成js环境代码

详细动图：

![create_env.gif](./img/create_env.gif)

## 2.4 js分析代码工具包

这些是比较深入的分析 js 的功能的工具包，后续再做针对具体场景的使用功能描述。






# 3 插件交流平台

为方便广大开发者更好地了解和使用 v_jstools，我与猿人学平哥合作，我们共同建立了一个微信交流群。扫码并备注 “jstools” 即可申请加入。 

在这个交流群中，我们会在群中优先分享工具的使用方法、实践案例，以及后续功能的更新与版本维护信息。同时，平哥也邀请了多位长期关注 jstools 的技术创作者加入，共同参与内容交流、经验分享以及共同对项目生态进行维护。欢迎感兴趣的朋友加入群聊，共建一个开放、实用的 v_jstools 工具交流社区。

![a.png](./tools/common/a.png)
