---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-10T18:10:21.2121+08:00
---

```bash
from typing import List, Optional, Tuple
import numpy as np
import torch
import torch.nn as nn
import math
import onnxruntime as ort
 
device = 'cuda' if torch.cuda.is_available() else 'cpu'
 
class Config:
    def __init__(self, hidden_size: int = 512, num_attention_heads: int = 8) -> None:
        self.hidden_size = hidden_size
        self.num_attention_heads = num_attention_heads
 
 
class AttentionWithCache(nn.Module):
    def __init__(self, config: Config) -> None:
        super().__init__()
        self.config = config
        self.hidden_size = config.hidden_size
        self.num_heads = config.num_attention_heads
        self.head_dim = self.hidden_size // self.num_heads
        assert self.head_dim * self.num_heads == self.hidden_size, "hidden_size must be divisible by num_heads."
        
        self.query_proj = nn.Linear(self.hidden_size, self.hidden_size, bias=False)
        self.key_proj = nn.Linear(self.hidden_size, self.hidden_size, bias=False)
        self.value_proj = nn.Linear(self.hidden_size, self.hidden_size, bias=False)
        self.o_proj = nn.Linear(self.hidden_size, self.hidden_size, bias=False)
 
    def forward(self, hidden_states: torch.Tensor, key_cache: Optional[torch.Tensor] = None, value_cache: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        bsz, q_len, _ = hidden_states.size()
 
        # 计算 query
        query_states = self.query_proj(hidden_states).view(bsz, q_len, self.num_heads, self.head_dim).transpose(1, 2)
 
        # 如果存在缓存，使用缓存并计算新的 key 和 value，然后拼接它们
        if key_cache is not None:
            key_states = torch.cat([key_cache, self.key_proj(hidden_states).view(bsz, q_len, self.num_heads, self.head_dim).transpose(1, 2)], dim=2)
        else:
            key_states = self.key_proj(hidden_states).view(bsz, q_len, self.num_heads, self.head_dim).transpose(1, 2)
 
        if value_cache is not None:
            value_states = torch.cat([value_cache, self.value_proj(hidden_states).view(bsz, q_len, self.num_heads, self.head_dim).transpose(1, 2)], dim=2)
        else:
            value_states = self.value_proj(hidden_states).view(bsz, q_len, self.num_heads, self.head_dim).transpose(1, 2)
 
        # 计算注意力权重
        attn_weights = torch.matmul(query_states, key_states.transpose(-2, -1)) / math.sqrt(self.head_dim)
        attn_weights = torch.softmax(attn_weights, dim=-1)
 
        # 计算注意力输出
        attn_output = torch.matmul(attn_weights, value_states).transpose(1, 2).reshape(bsz, q_len, self.hidden_size)
        attn_output = self.o_proj(attn_output)
 
        # 返回注意力输出以及更新后的 key 和 value 缓存
        return attn_output, key_states, value_states
 
 
def with_cache_convert(model: AttentionWithCache, save_path='model.onnx') -> None:
    # 将模型设置为评估模式，关闭 dropout 和 batch normalization 的训练行为
    model.eval()
 
    # 创建随机输入张量，形状为 [batch_size, sequence_length, hidden_size]
    # batch_size=1, sequence_length=10, hidden_size 从模型中获取
    dummy_input = torch.randn(1, 10, model.hidden_size).to(device)
 
    # 创建随机的 key 缓存张量，形状为 [batch_size, num_heads, sequence_length, head_dim]
    # batch_size=1, num_heads 从模型中获取, sequence_length=10, head_dim 从模型中获取
    key_cache = torch.randn(1, model.num_heads, 10, model.head_dim).to(device)
 
    # 创建随机的 value 缓存张量，形状为 [batch_size, num_heads, sequence_length, head_dim]
    # batch_size=1, num_heads 从模型中获取, sequence_length=10, head_dim 从模型中获取
    value_cache = torch.randn(1, model.num_heads, 10, model.head_dim).to(device)
 
    # 导出模型为 ONNX 格式
    torch.onnx.export(
        model,  # 要导出的模型
        (dummy_input, key_cache, value_cache),  # 模型的输入，包括隐藏状态和缓存
        save_path,  # 导出的 ONNX 文件保存路径
        input_names=['hidden_states', 'key_cache', 'value_cache'],  # 输入的名称
        output_names=['output', 'updated_key_cache', 'updated_value_cache'],  # 输出的名称
        dynamic_axes={
            # 指定动态维度：
            # - hidden_states: 第 0 维（batch_size）和第 1 维（sequence_length）是动态的
            'hidden_states': {0: 'batch_size', 1: 'sequence_length'},
            # - key_cache: 第 0 维（batch_size）和第 2 维（sequence_length）是动态的
            'key_cache': {0: 'batch_size', 2: 'sequence_length'},
            # - value_cache: 第 0 维（batch_size）和第 2 维（sequence_length）是动态的
            'value_cache': {0: 'batch_size', 2: 'sequence_length'},
            # - output: 第 0 维（batch_size）和第 1 维（sequence_length）是动态的
            'output': {0: 'batch_size', 1: 'sequence_length'},
            # - updated_key_cache: 第 0 维（batch_size）和第 2 维（sequence_length）是动态的
            'updated_key_cache': {0: 'batch_size', 2: 'sequence_length'},
            # - updated_value_cache: 第 0 维（batch_size）和第 2 维（sequence_length）是动态的
            'updated_value_cache': {0: 'batch_size', 2: 'sequence_length'}
        },
        opset_version=11  # 使用 ONNX 算子集的第 11 版
    )
 
def onnx_test_with_cache(hidden_states: np.ndarray, key_cache: Optional[np.ndarray] = None, value_cache: Optional[np.ndarray] = None, model_path: str='model.onnx') -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    # 初始化 ONNX 运行时会话，加载指定路径的 ONNX 模型
    ort_session = ort.InferenceSession(model_path)
 
    # 获取模型的配置信息：
    # - hidden_size 从输入 hidden_states 的最后一维推断
    # - num_attention_heads 默认为 8
    config = Config(hidden_size=hidden_states.shape[-1], num_attention_heads=8)
 
    # 计算每个注意力头的维度
    num_heads = config.num_attention_heads
    head_dim = config.hidden_size // num_heads
 
    # 如果 key_cache 未提供，则初始化为零矩阵，形状为 [batch_size, num_heads, 0, head_dim]
    if key_cache is None:
        key_cache = np.zeros((hidden_states.shape[0], num_heads, 0, head_dim), dtype=np.float32)
 
    # 如果 value_cache 未提供，则初始化为零矩阵，形状为 [batch_size, num_heads, 0, head_dim]
    if value_cache is None:
        value_cache = np.zeros((hidden_states.shape[0], num_heads, 0, head_dim), dtype=np.float32)
 
    # 准备 ONNX 运行时的输入数据
    ort_inputs = {
        'hidden_states': hidden_states,  # 输入的隐藏状态
        'key_cache': key_cache,  # 输入的 key 缓存
        'value_cache': value_cache  # 输入的 value 缓存
    }
 
    # 运行 ONNX 模型，获取输出
    ort_outs = ort_session.run(None, ort_inputs)
 
    # 返回输出和更新后的缓存：
    # - ort_outs[0]: 模型输出
    # - ort_outs[1]: 更新后的 key 缓存
    # - ort_outs[2]: 更新后的 value 缓存
    return ort_outs[0], ort_outs[1], ort_outs[2]
 
 
def main(torch_model):
    config = Config(hidden_size=512, num_attention_heads=8)
    hidden_size = config.hidden_size
    attention_layer_with_cache = AttentionWithCache(config).to(device)
    attention_layer_with_cache.load_state_dict(torch.load(torch_model))
    with_cache_convert(attention_layer_with_cache)
    hidden_states=np.random.randn(1, 10, hidden_size).astype(np.float32)
    output, key_cache, value_cache = onnx_test_with_cache(hidden_states, model_path='model.onnx')
    print(output.shape, key_cache.shape, value_cache.shape)
 
 
if __name__ == "__main__":
    main('model.pth')
```

# 参考

1. [https://blog.csdn.net/z241225/article/details/146308977](https://blog.csdn.net/z241225/article/details/146308977)
2. [[]]