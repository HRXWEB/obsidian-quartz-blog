---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:23 pm
updated: Friday, September 26th 2025, 5:57:27 pm
---

> 一开始是用于 Seq2Seq 任务

## RNN

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926175617708.png)

传统的 Seq2Seq 模型通常基于循环神经网络（Recurrent Neural Network），但是有几个缺点：

- 长序列顺序计算，耗时长
- 根据链式反则，太长的序列会导致梯度消失/爆炸
- 后面的 token 没法考虑太前面的输入信息

> [!important] 基于此提出 Transformer Attention 机制

## Transformer

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926175628814.png)

### Input Embedding

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926175637210.png)

embedding 层有可训练的参数，因此随着训练 `input id` 到 `input embedding` 的映射关系会变化

### Positional Encoding

除了 token 本身的高维表示以外，还需要结合 token 在 sentence 中的位置信息来进行推理，所以有了这个模块。

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926175652715.png)

从图上可以看出位置编码只需要计算一次，无论是训练阶段还是推理阶段，对于不同的句子，共享同样的编码方式

### Self Attention

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926175701443.png)

求每个 word 和 其他 word（包括自己）之间的联系

- 6 表示 token 个数
- 512 表示 embedding 长度

最终的结果就是 6 个 token 之间的关联度

### Multi-Head Attention

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926175710120.png)

按 d_model 维度进行 split，分成了多个 head。每个 head 都会考虑到一整个 seq 维度的信息，只是会从不同的角度考虑这个 seq。

### Masked Multi-Head Attention

目的：make the model causal: output a certain position can only depend on the words on the previous positions. The model must not be able to see future words.

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926175717645.png)

## Layer Normalization

[https://blog.csdn.net/Little_White_9/article/details/123345062](https://blog.csdn.net/Little_White_9/article/details/123345062)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926175724608.png)

### 对标准化的理解

假设把中国的收入水平进行标准化（变成标准正态分布），这时中国高收入人群的收入值接近3，中收入人群的收入值接近0，低收入人群接近-3。不难发现，标准化后的相对大小是不变的，即中国富人的收入水平在标准化前和标准化后都比中国穷人高。**把中国的收入水平看成一个分布的话，我们可以说一个分布在标准化后，分布内的样本还是可比较的**

假设把中国和印度的收入水平分别进行标准化，这时中国和印度的中收入人群的收入值都为0，但是这两个0可比较吗？印度和中国的中等收入人群的收入相同吗？不难发现，中国和印度的收入水平在归一化后，两国间收入值已经失去了可比性。**把中国和印度的收入水平各自看成一个分布的话，我们可以说，不同分布分别进行标准化后，分布间的数值不可比较**

### 适用领域

- cv 领域适合使用 batchnorm，所有样本的同一通道的分布进行归一化，保持同一通道（例如Red通道）的可比性，不同通道的分布不关注。
- nlp 领域适合使用 layernorm，在一个样本内归一化，即保持同一个句子内的特征（词元）可比。比如下面两句话中的 “打” 是不同的意思，只有在本句内才能确定其含义：
    - 教练，我想打篮球！
    - 老板，我要一打包子。

==**所以 transformer 使用的是 layer normalization**==

## Inference Strategy

- greedy: 每个 step 使用 softmax 最大值的 word，再预测下一个词
- Beam Search: 每次考虑 topK 用于预测下一个词

## 参考资料

1. [https://www.bilibili.com/video/BV1gG411a7bw/?spm_id_from=333.788.videopod.sections&vd_source=a7368c6184a1b162acff7bf0efed19b2](https://www.bilibili.com/video/BV1gG411a7bw/?spm_id_from=333.788.videopod.sections&vd_source=a7368c6184a1b162acff7bf0efed19b2)
2. [https://developer.aliyun.com/article/1144579](https://developer.aliyun.com/article/1144579)
3. [https://blog.csdn.net/Little_White_9/article/details/123345062](https://blog.csdn.net/Little_White_9/article/details/123345062)