---
layout: post
title: Openfire Fastpath入门
category: Openfire
tags: [Openfire]
no-post-nav: true
---

Fastpath的介绍：

1.提供了Workgroup协议的实现，Workgroup的概念就是专门对应在线客服这个典型场景了。这是企业或组织机构的客服需求的核心概念和功能，类似于呼叫中心。

2.Server端的历史记录存储。默认Openfire本身是不记录信息历史记录的，只记录离线留言。注意，离线消息和消息历史记录是两个不同的概念，离线消息是对方不在线的情况，server端先保存起来，等对方上线后再发给他，发完了消息在server端就被删除了；而消息历史记录是只server端记录的所有对话消息，当然客户端也可以实现在客户端上自己的历史记录。

fasthpath：主要分为两端：agent-客服，user-用户，为人工客服实现了排队路由等基本的呼叫中心功能。

fasthpath：实现的原理就是以技能组为标准对用户加入对应的技能组在路由给对应技能组的客服人员，客服人员收到offer之后，可以接受，fastpath就可以创建openfire的聊天室邀请用户和agent加入进来进行会话，实现客服功能。其中fastpath还提供了一些其他的附加功能：比如转接，路由过程指定客服，设置最大聊天室等等，这些功能可以再以后开发过程中有需要的情况下查看源码即可了解。

这是openfire提供的插件，在smack中也提供了对应的api，这里提供一个agent端的实例

```java
/** 
 * 加入技能组 
 * @param workGroupName 
 * @return 
 */  
public boolean joinWorkGroup(String workGroupName,int maxChats){  
    boolean bResult=false;  
    agentSession=new AgentSession(workGroupName,connection);  
    agentSession.addInvitationListener(new WorkgroupInvitationListener(){  
        public void invitationReceived(WorkgroupInvitation workgroupInvitation) {  
//              System.out.println("workgroupInvitation.getWorkgroupName():"+workgroupInvitation.getWorkgroupName());  
//              System.out.println("workgroupInvitation.getMessageBody():"+workgroupInvitation.getMessageBody());  
//              System.out.println("workgroupInvitation.getMetaData():"+workgroupInvitation.getMetaData());  
//              System.out.println("workgroupInvitation.getInvitationSender():"+workgroupInvitation.getInvitationSender());  
//              System.out.println("workgroupInvitation.getGroupChatName():"+workgroupInvitation.getGroupChatName());  
            joinRoom(workgroupInvitation.getGroupChatName());  
//              System.out.println("name:"+workgroupInvitation.getGroupChatName()+",id:"+workgroupInvitation.getSessionID());  
            /*try { 
                agentSession.sendRoomTransfer(RoomTransfer.Type.user, "10110@kfas1", workgroupInvitation.getSessionID(), "转接"); 
            } catch (XMPPException e) { 
                // TODO Auto-generated catch block 
                e.printStackTrace(); 
            }*/  
            }  
              
        });  
        agentSession.addOfferListener(new OfferListener(){  
  
            public void offerReceived(Offer offer) {  
                System.out.println("offer.getUserJID();"+offer.getUserJID());  
            System.out.println("offer.getContent();"+offer.getContent());  
                offer.accept();  
            }  
  
            public void offerRevoked(RevokedOffer revokedOffer) {  
                System.out.println("revokedOffer.getReason():"+revokedOffer.getReason());  
            System.out.println("revokedOffer.getUserJID():"+revokedOffer.getUserJID());  
            }  
              
        });  
        agentSession.addQueueUsersListener(new QueueUsersListener(){  
  
            public void averageWaitTimeUpdated(WorkgroupQueue workgroupQueue, int averageWaitTime) {  
//              System.out.println("averageWaitTime:"+averageWaitTime);  
//              System.out.println("workgroupQueue.getAverageWaitTime():"+workgroupQueue.getAverageWaitTime());  
//              System.out.println("workgroupQueue.getCurrentChats():"+workgroupQueue.getCurrentChats());  
//                
            }  
  
            public void oldestEntryUpdated(WorkgroupQueue workgroupQueue, Date oldestEntry) {  
//              System.out.println("oldestEntry:"+oldestEntry.toString());  
                  
            }  
  
            public void statusUpdated(WorkgroupQueue workgroupQueue, Status status) {  
//              System.out.println("status:"+status.toString());  
                  
            }  
  
            public void usersUpdated(WorkgroupQueue workgroupQueue, Set uers) {  
                for (Iterator iterator = uers.iterator(); iterator  
                        .hasNext();) {  
                    Object user = (Object) iterator.next();  
                    System.out.println("user:"+user.toString());  
                  
            }  
              
        }  
          
    });  
    try {  
        agentSession.setOnline(true);  
        /*Presence presence=new Presence(Presence.Type.available); 
        presence.setTo("demo@workgroup.kftest2"); 
        presence.setPriority(1); 
        connection.sendPacket(presence); 
        System.out.println("presence OK");*/  
        agentSession.setStatus(Presence.Mode.available,maxChats,"OK");  
        System.out.println(agentSession.getMaxChats());  
    } catch (XMPPException e) {  
        e.printStackTrace();  
    }  
      
    bResult=true;  
    return bResult;  
}  
```


用户user端的加入排队实例，也是基于smack包编写，可以发现smack都提供了对应的对象进行编程：

```java
public void joinQueue(String workgroupName, Map metaData) {
	workgroup = new Workgroup(workgroupName, connection);
	// 监听技能组中队列的事件
	// 这里监听，由于workGroup监听connection的包，如果第二次初始化，第一次的队列的监听还会触发
	this.listenForQueue();

	workgroupInvitationListener = new WorkgroupInvitationListener() {
		public void invitationReceived(
				WorkgroupInvitation workgroupInvitation) {
			String room = workgroupInvitation.getGroupChatName();
			joinRoom(room);
		}
	};
	workgroup.addInvitationListener(workgroupInvitationListener);

	if (workgroup != null) {
		try {
			workgroup.joinQueue(metaData, userid);
		} catch (XMPPException e) {
			// 异常的情况也继续排队，由于技能没有agent会service-unavailable(503)
			log.error("[>" + callInfo.getJid()
					+ "<]: Unable to join chat queue.", e);
		}
	}
}

/**
 * 监听队列情况
 * 
 */
public void listenForQueue() {
	queueListener = new QueueListener() {
		// 加入队列成功返回基础消息
		public void joinedQueue() {

		}

		// 离开队列事件
		public void departedQueue() {
		}

		// 队列位置变化
		public void queuePositionUpdated(int currentPosition) {
		}

		// 队列时间变化
		public void queueWaitTimeUpdated(int secondsRemaining) {
		}
	};
	workgroup.addQueueListener(queueListener);
}
```
