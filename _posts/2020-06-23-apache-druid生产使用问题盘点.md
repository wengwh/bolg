---
layout: post
title: apache-druid生产使用问题盘点
category: apache-druid
tags: [apache-druid]
no-post-nav: true
---

问题：查询时间范围大，段数据过多，导致集群资源飙升，影响其他查询
解决：在查询前，根据时间范围查询涉及的段大小，对于过大查询做屏蔽过滤

问题：前端查询大开销查询已经超时，druid还是会继续执行，无法释放资源
解决：使用druid提供的queryId，查询的时候传入，超时调用delete取消查询

问题：前端使用分级多次查询，全部查询，对于多维度产生几万个以上的子查询，线程池占用，影响其他用户查询
解决：使用权重线程池，同时超时之后释放全部未执行的子查询资源，开发加载控制类，对于满足条数的结果直接返回，不再做后续查询

问题：两大业务需要使用druid，经常一方的大查询影响了另一方
解决：使用router和broker的路由规则，对集群做划分：druid.router.tierToBrokerMap

问题：仓库大部分查询都在最近1年时间，但是保存的时间范围是3年以上，查询效率不高
解决：对仓库设置策略，做冷热分割，对1年数据放入热节点，热节点部署多机器

问题：druid节点jvm配置，设置过大堆内，堆外内存，导致系统空闲内存少mmap无法快速响应
解决：调整jvm配置，堆不超过24G，给予较大的空闲内存

问题：JVM疯狂Full GC，释放不了空间，导致全部查询卡顿
解决：配置了监控，但是influxdb数据库挂了，导致监控数据长存在内存中，关闭监控，或者维护好influxdb

问题：middleManager由于实时任务需要较大的JVM内存，导致全部任务配置都提高，浪费资源
解决：使用workerCategorySpec划分任务类型归属的机器，对不同类型设置不同open的jvm

问题：middleManager的任务个数上限分配过大，导致清洗过多任务时，对机器内存超出，historical节点oom挂掉
解决：根据机器资源，设置druid.worker.capacity，做到不会触发机器瓶颈

问题：实时任务和离线任务并行，新版本出现org.apache.druid.java.util.common.ISE: Could not allocate segment for row with timestamp 
解决：因为分区类型不同，实时任务无法锁定段，在离线任务跑完之后，执行一次compact任务

问题：仓库存在过多冗余维度，每个仓库都存在玩家相关维度，使用lookup数据太大无法存放，影响仓库清洗和存储
解决：建议使用join解决