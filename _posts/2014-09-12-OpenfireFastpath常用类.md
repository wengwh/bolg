---
layout: post
title: Openfire fastpath常用类
category: Openfire
tags: [Openfire,fasthpath]
---

fastpath在前一章有做了一些介绍，是openfire提供的一种可以实现客服功能的插件。

这里把自己查看源码看到一些主要几个类来说明一下这个fastpath的主要对象。

## 1.Agent
这是对于的客服的实体对象，主要就是记录一些基本的属性，比如：agent的昵称，jid等

```java
public class Agent {  
  
    private static final Logger Log = LoggerFactory.getLogger(Agent.class);  
  
    private static final String LOAD_AGENT =  
            "SELECT name, agentJID, maxchats FROM fpAgent WHERE agentID=?";  
    private static final String SAVE_AGENT =  
            "UPDATE fpAgent SET name=?, agentJID=?, maxchats=? WHERE agentID=?";  
  
    /** 
     * The agent session created when the agent joined the service. 
     */  
    private AgentSession session;  
  
    /** 
     * The ceiling on the maximumn number of chats the agent should handle. 
     */  
    protected int maxChats = 0;  
  
    /** 
     * Nickname of the agent. 
     */  
    private String nickname;  
  
    /** 
     * Custom properties for the agent. 
     */  
    private JiveLiveProperties properties;  
  
    /** 
     * The id of the agent. 
     */  
    private long id;  
  
    /** 
     * The XMPP address of the Agent. 
     */  
    private JID agentJID;  

```

## 2.AgentManager
这个类很好理解就是对agent这个实体类的管理类，openfire中的一些实体对象一样整个代码主要是用一些sql语句实现了基本的增删改查。

```java
public class AgentManager {  
  
    private static final Logger Log = LoggerFactory.getLogger(AgentManager.class);  
  
    private static final String LOAD_AGENTS =  
            "SELECT agentID FROM fpAgent";  
    private static final String INSERT_AGENT =  
            "INSERT INTO fpAgent (agentID, agentJID, name, maxchats, minchats) VALUES (?,?,?,?,?)";  
    private static final String DELETE_AGENT =  
            "DELETE FROM fpAgent WHERE agentID=?";  
    private static final String DELETE_AGENT_PROPS =  
            "DELETE FROM fpAgentProp WHERE ownerID=?";  
```

## 3.AgentSession
这个对象顾名思义agent的会话实体。从类的属性可以看出，这个实体是对应一个agent对象，包含了这个agent在各个技能组的聊天会话的集合，加入的技能组集合，以及这个agent的最大的聊天室，出席包的状态等都在这个类中定义。这个是在后面操作中比较常用的类。以及一些事件的监听类

```java
public class AgentSession {  
  
    private static final Logger Log = LoggerFactory.getLogger(AgentSession.class);  
  
    private static final FastDateFormat UTC_FORMAT = FastDateFormat.getInstance("yyyyMMdd'T'HH:mm:ss", TimeZone.getTimeZone("GMT+0"));  
  
    private Presence presence;  
    private Collection<Workgroup> workgroups = new ConcurrentLinkedQueue<Workgroup>();  
    private Offer offer;  
    /** 
     * Flag that indicates if the agent requested to get information of agents of all the workgroups 
     * where the agent has joined. 
     */  
    private boolean requestedAgentInfo = false;  
    private Map<Workgroup, Queue<ChatInfo>> chatInfos = new ConcurrentHashMap<Workgroup, Queue<ChatInfo>>();  
    /** 
     * By default maxChats has a value of -1 which means that #getMaxChats will return 
     * the max number of chats per agent defined in the workgroup. The agent may overwrite 
     * the default value but the new value will not be persisted for future sessions. 
     */  
    private int maxChats;  
    private Agent agent;  private WorkgroupPresence workgroupPresenceHandler;  
    private WorkgroupIQHandler workgroupIqHandler;  
    private MessageHandler messageHandler;  

```

## 4.Workgroup
这个是技能组的实体对象，这个对象和之前的agent对象有点相同也是包含了基本的一些属性,如：最大聊天数，这是对于技能组而言，offer超时时间等。这里涉及到队列的实体，一个技能组可以包含多个队列，根据队列的等级来显示路由的优先级。提供了创建队列的方法，队列会涉及到路由的实现。这个也是比较主要的类，在后面会经常使用。

```java
public class Workgroup {  
  
    private static final Logger Log = LoggerFactory.getLogger(Workgroup.class);  
    private String description = null;  
    private Date creationDate;  
    private Date modDate;  
    private long offerTimeout = -1;  
    private long requestTimeout = -1;  
    private int maxChats;  
    private int minChats;  
  
    private Map<Long, RequestQueue> queues = new HashMap<Long, RequestQueue>();  
  
    /** 
     * Custom properties for the workgroup. 
     */  
    private JiveLiveProperties properties;  
  
    private String workgroupName;  
    private String displayName;  
    private long id;  
```


## 5.WorkgroupManager
这个也是对应的技能组的管理类，这个就比较复杂，涉及的地方比较多

## 6.WorkgroupPresence
这个顾名思义管理发送给技能组的出席包，比如agent加入技能组就是个对应的技能组发送出席包。

## 7.RequestQueue
这个就是在前面提到的队列，这个实体类，基本属性主要是一些最大会话数，这里就比较涉及多。

用户请求的链表集合，通过集合来添加，删除等基本操作用户的排队请求，通过这个实现当前排队人数的推送等

```java
private LinkedList<UserRequest> requests = new LinkedList<UserRequest>();  
```

agentSession的集合对象，控制在本队列中的agent，比如agent退出等

```java
private AgentSessionList activeAgents = new AgentSessionList(); 
```

路由的实现类

```java
private RoundRobinDispatcher dispatcher;  
```

## 8.Request
这个是个抽象类，就是请求的实体类。

三个实现类：

UserRequest：这个就是上面的队列中的用户请求的实体类，就是用户加入排队的时候发送的包，包括了一些路由的要求比如：agent:优先的agent，rank:排的技能组等级，timeout:队列排队的时间,微秒为单位

TransferRequest：这个是后来实现转接的时候看到，是agent端转接给其他agent进行请求的一个请求类，这里的转接是用涉及到转接的对象，可以转接用户，队列，技能组都可以转接。smack包也提供了对应的方法。

InvitationRequest：这个就是邀请的请求，比如fastpath在路由成功后，邀请用户和agent加入自己创建的聊天室发送的包，就是这个类现实的。

## 9.RoundRobinDispatcher
这个也是上面一直提到的路由的实现类。整个的fastpath核心逻辑就是路由，就是这个类实现。该类是基于队列的，从构造方法可以看出通过定时器来扫描队列中的用户请求，来实现offer的分发给改队列中的agent，以现实路由功能。

```java
public RoundRobinDispatcher(RequestQueue queue) {
    this.queue = queue;
    agentList = new LinkedList<AgentSession>();
    properties = new JiveLiveProperties("fpDispatcherProp", queue.getID());
    try {
        info = infoProvider.getDispatcherInfo(queue.getWorkgroup(), queue.getID());
    } catch (NotFoundException e) {
        Log.error("Queue ID " + queue.getID(), e);
    }
    // Recreate the agentSelector to use for selecting the best agent to
    // receive the offer
    loadAgentSelector();

    // Fill the list of AgentSessions that are active in the queue. Once the
    // list has been
    // filled this dispatcher will be notified when new AgentSessions join
    // the queue or leave
    // the queue
    fillAgentsList();
    Log.error("after fillAgentsList");
    TaskEngine.getInstance().scheduleAtFixedRate(new TimerTask() {
        @Override
        public void run() {
            checkForNewRequests();
        }
    }, 2000, 2000);
}
```

最核心的方法就是分发通过之前的请求时间，来做超时控制，查找最合适的agent分发offer，等待offer是否被接收，要是接收就分发邀请的请求给两端加入聊天室从而实现了路由，如果没接收或者超时就继续循环，如果超时退出，就涉及到溢出，根据溢出的配置来对应的出来，比如取消请求告诉用户等

```java
public void dispatch(Offer offer) {
    // The time when the request should timeout
    // long timeoutTime = System.currentTimeMillis() +
    // info.getRequestTimeout();
    // 这里修改，要是有输入超时时间，不用默认的
    final Request request = offer.getRequest();
    long timeoutTime = System.currentTimeMillis() + ((request.getMetaData().containsKey("timeout")) ? Long.parseLong(request.getMetaData().get("timeout").get(0)) : info.getRequestTimeout());
    boolean canBeInQueue = request instanceof UserRequest;
    Map<String, List<String>> map = request.getMetaData();
    String initialAgent = map.get("agent") == null || map.get("agent").isEmpty() ? null : map.get("agent").get(0);
    String ignoreAgent = map.get("ignore") == null || map.get("ignore").isEmpty() ? null : map.get("ignore").get(0);
    // Log debug trace
    Log.debug("RR - Dispatching request: " + request + " in queue: " + queue.getAddress());

    // Send the offer to the best agent. While the offer has not been
    // accepted send it to the
    // next best agent. If there aren't any agent available then skip this
    // section and proceed
    // to overflow the current request
    if (!agentList.isEmpty()) {
        for (long timeRemaining = timeoutTime - System.currentTimeMillis(); !offer.isAccepted() && timeRemaining > 0 && !offer.isCancelled(); timeRemaining = timeoutTime - System.currentTimeMillis()) {

            try {
                AgentSession session = getBestNextAgent(initialAgent, ignoreAgent, offer);
                Log.error("AgentSession:");
                if (session == null && agentList.isEmpty()) {
                    // Stop looking for an agent since there are no more
                    // agent available
                    Log.error("agentList.isEmpty():");
                    break;
                } else if (session == null || offer.isRejector(session)) {
                    Log.error("offer.isRejector(session):");
                    initialAgent = null;
                    Thread.sleep(1000);
                } else {
                    // Recheck for changed maxchat setting
                    Workgroup workgroup = request.getWorkgroup();
                    if (session.getCurrentChats(workgroup) < session.getMaxChats(workgroup)) {
                        // Set the timeout of the offer based on the
                        // remaining time of the
                        // initial request and the default offer timeout
                        timeRemaining = timeoutTime - System.currentTimeMillis();
                        // 设置offer超时时长，是怕offer超时时长超过request时长
                        offer.setTimeout(timeRemaining < info.getOfferTimeout() ? timeRemaining : info.getOfferTimeout());

                        // Make the offer and wait for a resolution to the
                        // offer
                        if (!request.sendOffer(session, queue)) {
                            // Log debug trace
                            Log.debug("RR - Offer for request: " + offer.getRequest() + " FAILED TO BE SENT to agent: " + session.getJID());
                            continue;
                        }
                        // Log debug trace
                        Log.debug("RR - Offer for request: " + offer.getRequest() + " SENT to agent: " + session.getJID());

                        offer.waitForResolution();
                        // If the offer was accepted, we send out the
                        // invites
                        // and reset the offer
                        if (offer.isAccepted()) {
                            // Get the first agent that accepted the offer
                            AgentSession selectedAgent = offer.getAcceptedSessions().get(0);
                            // Log debug trace
                            Log.debug("RR - Agent: " + selectedAgent.getJID() + " ACCEPTED request: " + request);
                            // Create the room and send the invitations
                            offer.invite(selectedAgent);

                            // 发送监控消息 bywengwh
                            sendUmccWorkMsg(request, selectedAgent);

                            // Notify the agents that accepted the offer
                            // that the offer process
                            // has finished
                            for (AgentSession agent : offer.getAcceptedSessions()) {
                                agent.removeOffer(offer);
                            }
                            if (canBeInQueue) {
                                // Remove the user from the queue since his
                                // request has
                                // been accepted
                                queue.removeRequest((UserRequest) request);
                            }
                        }
                    } else {
                        // Log debug trace
                        Log.debug("RR - Selected agent: " + session.getJID() + " has reached max number of chats");
                    }
                }
            } catch (Exception e) {
                Log.error(e.getMessage(), e);
            }
        }
    }
    if (!offer.isAccepted() && !offer.isCancelled()) {
        // Calculate the maximum time limit for an unattended request before
        long requestTimeOut = (request.getMetaData().containsKey("timeout")) ? Long.parseLong(request.getMetaData().get("timeout").get(0)) : info.getRequestTimeout();
        long limit = request.getCreationTime().getTime() + (requestTimeOut * (getOverflowTimes() + 1));

        if (limit - System.currentTimeMillis() <= 0 || !canBeInQueue) {
            // Log debug trace
            Log.debug("RR - Cancelling request that maxed out overflow limit or cannot be queued: " + request);
            // Cancel the request if it has overflowed 'n' times
            request.cancel(Request.CancelType.AGENT_NOT_FOUND);
        } else {
            // Overflow if request timed out and was not dispatched and max
            // number of overflows
            // has not been reached yet
            overflow(offer);
            // If there is no other queue to overflow then cancel the
            // request
            if (!offer.isAccepted() && !offer.isCancelled()) {
                // Log debug trace
                Log.debug("RR - Cancelling request that didn't overflow: " + request);
                request.cancel(Request.CancelType.AGENT_NOT_FOUND);
            }
        }
    }
}
```

这是几个主要的类，对于整个fastpath插件类是很多的，功能很多，还等着大家多看源码去挖掘。其实在看源码的时候，可以观察他们的包的规划，类的命名，fastpath主要是分成：Provider，Handle，dispatcher，event等这几个结尾类。从查看源码明白他们的思路，可能不一定能做到每个类都读一遍，读清楚，但是对于他们的编写习惯有时候也可以借鉴，对自己以后编写也是个好处。虽然现在mvc是风靡Java编程。这里就把fastpath做个总结。后面看看会接触到什么新的东西或者自己学一些java的一些知识的时候在贴出来。
