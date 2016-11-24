---
layout: post
title: activiti5 使用自定义sql
category: activiti
tags: [activiti]
no-post-nav: true
---

最近在研究工作流activiti，把自己的开发过程做的验证发表出来给大家参考，说的并不会很全，但是都是自己验证可以使用的。


有时候在使用activiti提供的api不满足业务的时候使用自定义sql
        
两种：
        
1. xml配置：

```
<?xml version="1.0" encoding="UTF-8" ?>


<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="org.activiti.engine.impl.persistence.entity.HistoricProcessInstanceEntity">


  <select id="selectHistoricProcessInstanceIdsByProcessDefinitionId1" parameterType="org.activiti.engine.impl.db.ListQueryParameterObject" resultType="string">
    select ID_
    from ${prefix}ACT_HI_PROCINST 
    where PROC_DEF_ID_ = #{parameter}
  </select>


</mapper>
```

```java
package com.newland.mango.rest.dao;

import java.io.InputStream;
import java.util.List;

import org.activiti.engine.impl.interceptor.Command;
import org.activiti.engine.impl.interceptor.CommandContext;

public class ProcessCmd  implements Command<List<String>> {

    @Override
    public List<String> execute(CommandContext commandContext) {
        List<String> processInstanceIds =commandContext.getDbSqlSession().selectList("selectHistoricProcessInstanceIdsByProcessDefinitionId1","cs:1:5004");
        // TODO Auto-generated method stub
        return processInstanceIds;
    }

}
```

```java
   Set customMybatisXMLMappers = new HashSet();
   customMybatisXMLMappers.add("com/newland/mango/rest/dao/HistoricProcessInstance.xml");
   processEngineConfiguration.setCustomMybatisXMLMappers(customMybatisXMLMappers);
```
xml的配置使用mybatis,自己复制了enginejar的配置，改了id做个实验。

2. annotation配置：

```java
public interface ProcessInstanceDao {
      @Select({
          "SELECT instance.proc_inst_id_ from act_hi_procinst instance,act_re_procdef definition ",
          "where instance.proc_def_id_ =definition.id_"
      })
      List<Map<String, Object>> selectTaskWithSpecificVariable(String variableName);
}
```

```java
   Set<Class<?>> set = new HashSet<Class<?>>();
   set.add(ProcessInstanceDao.class);
   processEngineConfiguration.setCustomMybatisMappers(set);
```

```java
  List<Map<String,Object>> result = managementService.executeCustomSql(customSqlExecution);
  System.out.println("1111111111111:"+result.size());
  List processInstanceIds =managementService.executeCommand(new ProcessCmd());
  System.out.println("222222222:"+processInstanceIds.size());
  Model model = repositoryService.getModel(modelId);
```
两种都可以，我更推荐第一种，其实如果是查询，可以使用各种service提供的本地查询，可以直接定义sql。
