---
layout: post
title: activiti-modeler 工作流设计器代码分析
category: activiti
tags: [activiti]
---

####  用了一段时间的activiti5工作流，今天做个设计器的分析。新版的使用了bootstrap和angularJS做了封装。先从文件的说明开始。 

## 1.文件夹说明

1. configuration:设计器的属性配置及工具栏和后台交互（重点）
1. css：样式文件
1. editor：activiti设计器的oryx插件基于做的流程拖拽
1. fonts：字体
1. i18n：国际化文件
1. images：图片
1. lib：引用angular，bootstrap等ui，js的文件
1. partials：左侧元素选项栏的html文件
1. popups：弹出框的html，保存，修改元素等html
1. stencilsets：bpmn各种元素图标，（svg放在配置文件）

## 2.主要文件说明

1. stencilset.json：定义元素的属性，规则的配置文件，页面的展示就是根据这个配置文件
1. editor.html：定义了这个页面的布局，顶部，左侧的工具栏，右侧的画布和元素属性编辑栏
1. app-cfg.js ： 配置调用接口的地址
1. app.js ：angularJS的入口文件，注入需要使用的模块，以及国际化和请求模型json信息
1. stencil-controller.js：编辑窗口的控制器，包括了元素的快捷方式，元素的属性保存updatePropertyInModel
1. toolbar-controller.js：定义快捷键对应工具栏的按钮
1. configuration\properties.js  :定义各属性的读取写入的html配置 
1. configuration\url-config.js  :定义接口的相应地址（平常做集成到自己系统主要看这里，实现这2个接口即可）


![image](http://static.oschina.net/uploads/img/201602/15150819_cL12.jpg)


## 3.配置文件说明
--属性的定义

```
"propertyPackages" : [ {
    "name" : "process_idpackage",
    "properties" : [ {
        "id" : "name",      ---id
        "type" : "String",  --类型，在赋值的时候会根据类型展示各种输入框，根据properties.js
        "title" : "名称",  --显示的标题
        "value" : "",      --值
        "description" : "BPMN元素的描述性名称.", --描述
        "category":"property", --分类，空的话位popular
        "popular" : true,         --是否显示
        "refToView" : "text_name" --触发svg里面的效果
    }]
```

--节点的定义

```
    "type" : "node", 
    "id" : "MailTask", 
    "title" : "邮件任务",--标题 
    "description" : "邮件任务", --描述 
    "view" : "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n</svg>", --svg的xml 
    "icon" : "activity/list/type.send.png",        --图标 
    "groups" : [ "任务" ], --归属的组 
    "propertyPackages" : [ "overrideidpackage" ],--属性 
    "hiddenPropertyPackages" : [ ], 
    "roles" : [ "Activity" ] --规则
```


## 4.代码顺序

modeler.html->editor.html->app.js/stencil-controller.js->properties.js->oryx.debug.js(核心代码，每个版本都是基于这个做封装)

## 5.总结

整个设计器其实都是基于oryx.debug.js做了一层扩展，扩展的代码量不多，使用了angularJS，大家在看的时候应该也很容易看懂。其实有空可以研究看看oryx.debug.js，毕竟这个是精华，我还没研究，只是之前修改的时候看了里面的属性与配置文件对应的api等，没有细看。大家有时间可以看看。

