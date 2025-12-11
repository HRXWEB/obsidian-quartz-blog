---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-12-11T14:21:26.2626+08:00
---

# Quick Start

[[vLLM-QuickStart]]

# Models

同一个模型可能支持多个任务，比如：

```shellscript
vllm serve Qwen/Qwen2.5-1.5B-Instruct
>>>
...
This model supports multiple tasks: {'generate', 'score', 'classify', 'embed', 'reward'}. Defaulting to 'generate'.
...
>>>

# 可以通过 --task 指定具体的任务
```

- Generate Models
- _**Pooling Models**_ 包括：
    - embedding
    - reranking
    - reward
    - more
- List of supported models
    - 查看 huggingface 模型的 config.json 文件中的 architecture 字段是否是已经支持的架构
    - 如果不支持，可以：
        - 参考 [Adding a New Model](https://docs.vllm.ai/en/latest/contributing/model/index.html#new-model) 自行添加
        - [open an issue on GitHub](https://github.com/vllm-project/vllm/issues/new/choose) 请求社区帮助
- 模型序列化，加快模型加载的速度

# Features

## [量化](https://docs.vllm.ai/en/latest/features/quantization/index.html)

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926175840714.png)

量化方法：

- [https://github.com/casper-hansen/AutoAWQ](https://github.com/casper-hansen/AutoAWQ)
- [https://github.com/TimDettmers/bitsandbytes](https://github.com/TimDettmers/bitsandbytes)
- **⚠️GGUF，支持很差**
- GPTQ：
    - INT4 W4A16
    - INT8 W8A8
    - FP8 W8A8
- Quantized KV Cache

## [LoRA Adapters](https://docs.vllm.ai/en/latest/features/lora.html)

LoRA adapters can be used with any vLLM model that implements `**[SupportsLoRA](https://docs.vllm.ai/en/latest/api/model/interfaces.html#vllm.model_executor.models.interfaces.SupportsLoRA)**`.

> 通过在大型语言模型的特定层中插入低秩矩阵来实现高效的模型微调。这种方法减少了需要更新的参数数量，从而降低了计算和存储成本，同时保持模型性能。LoRA adapters 可以在不改变原始模型权重的情况下，快速适应新的任务或数据。

vLLM 不仅支持在 server 启动的同时提供 LoRA adapter 服务，还可以动态装卸

## [Tool Calling](https://docs.vllm.ai/en/latest/features/tool_calling.html)

可以对输出的结果更进一步“加工”

- `--tool-call-parser` ，对 tool 的描述进行解析，比如 json 格式的 tool
    
    ```shellscript
    vllm serve meta-llama/Llama-3.1-8B-Instruct \
        --enable-auto-tool-choice \
        --tool-call-parser llama3_json \
        --chat-template examples/tool_chat_template_llama3.1_json.jinja
    ```
    
    ```python
    def get_weather(location: str, unit: str):
        return f"Getting the weather for {location} in {unit}..."
    tool_functions = {"get_weather": get_weather}
    
    tools = [{
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string", "description": "City and state, e.g., 'San Francisco, CA'"},
                    "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]}
                },
                "required": ["location", "unit"]
            }
        }
    }]
    ```
    
- `--tool-parser-plugin` – **optional** ：注册用户自定义的 `parser`
- `--chat-template` – **optional** ：format 输入的“玩意儿”

## [Reasoning Outputs](https://docs.vllm.ai/en/latest/features/reasoning_outputs.html)

`deepseek-r1` 系列的模型会给出思考过程并总结产生输出

```shellscript
vllm serve deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B \
    --enable-reasoning --reasoning-parser deepseek_r1
```

## [Structured Outputs](https://docs.vllm.ai/en/latest/features/structured_outputs.html)

vLLM 支持使用 [outlines](https://github.com/dottxt-ai/outlines), [lm-format-enforcer](https://github.com/noamgat/lm-format-enforcer), or [xgrammar](https://github.com/mlc-ai/xgrammar) 作为引导解码的后端生成结构化输出。

- `guided_choice`: the output will be exactly one of the choices.
- `guided_regex`: the output will follow the regex pattern.
- `guided_json`: the output will follow the JSON schema. `guided_json` parameter in two different ways:
    - Using directly a [JSON Schema](https://json-schema.org/)
    - Defining a [Pydantic model](https://docs.pydantic.dev/latest/) and then extracting the JSON Schema from it (which is normally an easier option).
    
    ```python
    from pydantic import BaseModel
    from enum import Enum
    
    class CarType(str, Enum):
        sedan = "sedan"
        suv = "SUV"
        truck = "Truck"
        coupe = "Coupe"
    
    
    class CarDescription(BaseModel):
        brand: str
        model: str
        car_type: CarType
    
    
    json_schema = CarDescription.model_json_schema()
    
    completion = client.chat.completions.create(
        model="Qwen/Qwen2.5-3B-Instruct",
        messages=[
            {
                "role": "user",
                "content": "Generate a JSON with the brand, model and car_type of the most iconic car from the 90's",
            }
        ],
        extra_body={"guided_json": json_schema},
    )
    print(completion.choices[0].message.content)
    ```
    
- more

## [Automatic Prefix Caching, APC](https://docs.vllm.ai/en/latest/features/automatic_prefix_caching.html#)

如果新的 query 和之前 query 共享相同的 prefix，那么允许新的 query 直接共享之前 query 计算好的 KV Cache，跳过这部分的计算。

```python
# Querying the age of John Doe
get_generation_time(
    llm,
    sampling_params,
    LONG_PROMPT + "Question: what is the age of John Doe? Your answer: The age of John Doe is ",
)

# Querying the age of Zack Blue
# This query will be faster since vllm avoids computing the KV cache of LONG_PROMPT again.
get_generation_time(
    llm,
    sampling_params,
    LONG_PROMPT + "Question: what is the age of Zack Blue? Your answer: The age of Zack Blue is ",
)
```

根据其作用，可以知道 APC 只是减少 prefill 阶段的时间。

将 `logic KV block <-> physical KV block` 的过程改为 `Logic KV Block <-> hash(prefix tokens + current block tokens) <-> Physical KV Block` 通过 hash 值来唯一确定 Block，只要是相同的 hash 值的 block 就可以共享 KV cache block。

prefix tokens 和 current block tokens 的例子如下：

```plaintext
                    Block 1                  Block 2                  Block 3
         [A gentle breeze stirred] [the leaves as children] [laughed in the distance]
Block 1: |<--- block tokens ---->|
Block 2: |<------- prefix ------>| |<--- block tokens --->|
Block 3: |<------------------ prefix -------------------->| |<--- block tokens ---->|
```

使用哈希映射的主要原因在于它能够提供以下几个关键优势：

1. **唯一性与一致性**：通过哈希函数生成的哈希值可以确保每个 KV 块（包括其前缀令牌和块内令牌）有一个唯一的标识符。这有助于避免冲突并确保数据的一致性和准确性。
2. **高效查找与访问**：哈希映射允许快速查找和访问特定的 KV 块。在没有哈希表的情况下，为了找到特定的 KV 块，可能需要遍历整个逻辑到物理块的映射关系，这在大规模应用中效率较低。而哈希映射则能显著提高查找速度，因为它可以直接定位到对应的物理块位置。
3. **简化共享与复用**：在不同的请求之间可能存在相同的前缀块，这意味着这些请求可以共享同一物理 KV 块。使用哈希映射，所有共享相同哈希值的 KV 块都可以映射到同一个物理块，从而节省内存空间，并且简化了管理和维护过程。
4. **动态调整与扩展性**：利用哈希映射，系统可以根据需求动态地分配和释放 KV 块，这为系统的扩展提供了更大的灵活性。如果直接映射，则每次添加、删除或更新 KV 块时都需要重新配置整个映射关系，增加了复杂性和潜在的错误风险。

## [Disaggregated Prefilling (experimental)](https://docs.vllm.ai/en/latest/features/disagg_prefill.html#)

why do this：

- **Tuning time-to-first-token (TTFT) and inter-token-latency (ITL) separately：**将 prefill 和 decode 阶段放在不同的 vLLM 实例中，二者互相不影响。可以采用不同的并行策略来调整 TTFT 而不影响 ITL
- **Controlling tail ITL：**vLLM 可能会在处理 request 的最后阶段插入一些 prefill jobs，导致高 tail latency。通过 disaggregated prefilling 解决这个问题

## **[Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode.html#)**

用于降低 词间延迟（ITL） 的技术，优化了访存瓶颈。

技术路径：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926175856199.png)

# Inference and Serving

## [Multimodal Inputs](https://docs.vllm.ai/en/latest/serving/multimodal_inputs.html#)

To input multi-modal data, follow this schema in `**[vllm.inputs.PromptType](https://docs.vllm.ai/en/latest/api/offline_inference/llm_inputs.html#vllm.inputs.PromptType)**`:

- `prompt`: The prompt should follow the format that is documented on HuggingFace.
- `multi_modal_data`: This is a dictionary that follows the schema defined in `**[vllm.multimodal.inputs.MultiModalDataDict](https://docs.vllm.ai/en/latest/api/multimodal/inputs.html#vllm.multimodal.inputs.MultiModalDataDict)**`.
- offline inference
    - Image
    - Video
    - Audio
    - [Embedding](https://docs.vllm.ai/en/latest/serving/multimodal_inputs.html#embedding)：将预先计算好的 embedding 输入到 LLM，embedding is a tensor of shape `(num_items, feature_size, hidden_size of LM)`
        
        ```python
        # Inference with image embeddings as input
        llm = LLM(model="llava-hf/llava-1.5-7b-hf")
        
        # Refer to the HuggingFace repo for the correct format to use
        prompt = "USER: <image>\nWhat is the content of this image?\nASSISTANT:"
        
        # Embeddings for single image
        # torch.Tensor of shape (1, image_feature_size, hidden_size of LM)
        image_embeds = torch.load(...)
        
        outputs = llm.generate({
            "prompt": prompt,
            "multi_modal_data": {"image": image_embeds},
        })
        
        for o in outputs:
            generated_text = o.outputs[0].text
            print(generated_text)
        ```
        
- online serving

## [Distributed Inference and Serving](https://docs.vllm.ai/en/latest/serving/distributed_serving.html)

- 单机单卡
- 单机多卡
- 多记多卡