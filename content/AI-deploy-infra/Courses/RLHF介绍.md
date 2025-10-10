---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:24.2424+08:00
updated: 2025-10-10T18:10:21.2121+08:00
---

# Step1. **预训练语言模型**

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926174621585.png)

# Step2. **训练奖励模型**

RM(Reward Model) 的训练是 RLHF 区别于旧范式的开端。这一模型接收一系列文本并返回一个标量奖励，数值上对应人的偏好。我们可以用端到端的方式用 LM(Language Model) 建模，或者用模块化的系统建模 (比如对输出进行排名，再将排名转换为奖励) 。这一奖励数值将对后续无缝接入现有的 RL 算法至关重要。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926174634683.png)

# Step3. 用强化学习微调

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926174647828.png)

# 参考

1. [https://blog.csdn.net/pearl8899/article/details/138476084](https://blog.csdn.net/pearl8899/article/details/138476084)
2. 为什么需要RLHF？SFT不够吗？ - 何枝的回答 - 知乎  
    [https://www.zhihu.com/question/651021172/answer/3513159005](https://www.zhihu.com/question/651021172/answer/3513159005)