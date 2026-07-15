---
title: "Redis"
description: "高性能内存键值数据库，支持多种数据结构"
date: "2026-07-15"
tags: ["database", "caching", "in-memory"]
githubUrl: "https://github.com/redis/redis"
language: "C"
license: "BSD-3-Clause"
stars: 67000
ratings:
  activity: 10
  documentation: 9
  easeOfUse: 8
  community: 10
  overall: 9
---

## 项目概览

Redis（Remote Dictionary Server）是一个开源的、基于内存的键值数据存储，由 Salvatore Sanfilippo 于 2009 年创建。它常被用作数据库、缓存、消息队列和流处理引擎。项目使用 C 语言编写，以极高的性能著称，单实例每秒可处理十万级读写操作。

- GitHub: https://github.com/redis/redis
- 语言: C
- License: BSD-3-Clause
- Stars: 67k+

## 核心功能

Redis 不仅仅是简单的键值存储，它支持多种数据结构：

- **Strings**：二进制安全的字符串，最大 512MB
- **Hashes**：字段-值映射，适合存储对象
- **Lists**：有序字符串列表，支持从两端 push/pop
- **Sets**：无序唯一元素集合，支持交并差运算
- **Sorted Sets**：带分数的有序集合，适合排行榜场景
- **Streams**：日志型数据结构，支持消费组
- **Pub/Sub**：发布订阅消息模式
- **过期与淘汰**：可对 key 设置 TTL，支持多种淘汰策略

## 技术架构

Redis 采用单线程事件循环架构（Redis 6.0 后网络 IO 支持多线程，但命令执行仍为单线程）：

- **单线程模型**：避免锁竞争和上下文切换，简化并发处理
- **IO 多路复用**：使用 epoll/kselect 实现高并发网络连接
- **内存存储**：所有数据常驻内存，磁盘持久化为 RDB 快照和 AOF 日志
- **RESP 协议**：自定义的二进制安全文本协议，简单高效

## 快速上手

使用 Docker 启动 Redis：

```bash
docker run -d --name redis -p 6379:6379 redis:latest
```

连接并测试：

```bash
docker exec -it redis redis-cli
> SET hello world
> GET hello
"world"
> ZADD leaderboard 100 alice 200 bob
> ZREVRANGE leaderboard 0 -1 WITHSCORES
1) "bob"
2) "200"
3) "alice"
4) "100"
```

上手难度：低。基本操作直观，官方文档和交互式教程完善。

## 生态与社区

- **贡献者**：600+ 贡献者，核心维护由 Redis Ltd 团队主导
- **活跃度**：GitHub 上持续高频提交，定期发布新版本
- **主要使用者**：Twitter、GitHub、Stack Overflow、Instagram 等大型互联网公司
- **相关项目**：Redis Sentinel（哨兵高可用）、Redis Cluster（集群分片）、RedisStack（搜索/JSON/时间序列模块）

## 适用场景

**适合：**

- 缓存层（热数据加速、Session 存储）
- 排行榜/计数器（利用 Sorted Set 原子操作）
- 消息队列（List/Stream 轻量级队列）
- 实时分析（位图、HyperLogLog）

**不适合：**

- 需要复杂查询和关系运算的场景（用 SQL 数据库）
- 数据量远超内存容量的场景（内存成本高）
- 对数据持久性要求极高且不能接受秒级丢失的场景

## 优缺点总结

**优势：**

- 极致性能，单线程单实例 10 万+ QPS
- 数据结构丰富，覆盖常见业务场景
- 社区生态成熟，文档完善
- 部署简单，开箱即用

**局限：**

- 内存容量限制数据规模，成本较高
- 单线程模型不适合 CPU 密集型计算
- 事务支持有限（无回滚）
- 集群方案配置复杂度高
