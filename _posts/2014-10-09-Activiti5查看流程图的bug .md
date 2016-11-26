---
layout: post
title: Activiti5回退功能
category: Activiti5
tags: [Activiti5]
no-post-nav: true
---

在Activiti5的开发过程中，要用到查看流程图，网络上面有说可以再部署的时候把xml和jpg一起打包这样就可以防止坐标错位等问题，由于我是直接用modeler设计部署，用到的代码是：

```java
DefaultProcessDiagramGenerator dpg = new DefaultProcessDiagramGenerator();  
  
is = dpg.generateDiagram(bpmnModel, "png", activitiIds,flowIds);
```

但是发现查看的图形在直线的label上面显示出现了问题，我的activiti是5.16.1，

第一点：自带modeler设计的不会有

```xml
<bpmndi:BPMNLabel>
    <omgdc:Bounds height="14.0" width="24.0" x="492.0" y="263.0"></omgdc:Bounds>
</bpmndi:BPMNLabel>
```

所以显示没有东西

要是用Eclipse的插件设计就会有这个标签，但是显示也是错位，为了解决这个问题，只好修改源代码，查看源代码：activiti-image-generator-5.16.1是这个jar包

DefaultProcessDiagramGenerator

564行存在逻辑bug，判断非空情况下应该不需要去获取连线的中间点，直接使用设置的label坐标，所以这里做一个修改

 
```java
if (labelGraphicInfo != null) {  
    GraphicInfo lineCenter = getLineCenter(graphicInfoList);  
    processDiagramCanvas.drawLabel(sequenceFlow.getName(), lineCenter, false); 
}
```
改成没有设置label的时候用连线的中间点做坐标，有设置就直接用设置的，这样也可以防止modeler设计的没有label标签也能正常显示了



```java
if (labelGraphicInfo == null) {  
    GraphicInfo lineCenter = getLineCenter(graphicInfoList);  
    processDiagramCanvas.drawLabel(sequenceFlow.getName(), lineCenter, false);  
}else{  
    processDiagramCanvas.drawLabel(sequenceFlow.getName(), labelGraphicInfo, false);  
}
```
DefaultProcessDiagramCanvas

1118行//这里获取的y我看来5.14的jar包这里也是用了x的坐标，所以这里也做一个修改

    
```java
double tY = graphicInfo.getY(); 修改成x 原来的获取y错误

改成

double tY = graphicInfo.getX();
```
215 行这里同时可以修改一下label的字体和大小，默认是斜体和蓝色，所以改成粗体黑色更明显


```java
LABEL_FONT = new Font(labelFontName, Font.BOLD, 12);//改成粗体更明显
```
经过这2个类的修改，在进行查看流程图的时候就可以再直线上面显示了
![image](http://img.blog.csdn.net/20141009014437734?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvZmdzdHVkZW50/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

