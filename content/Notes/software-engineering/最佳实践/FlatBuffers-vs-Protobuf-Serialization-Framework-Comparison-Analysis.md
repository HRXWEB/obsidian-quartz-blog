---
title: FlatBuffers与Protobuf序列化框架对比分析
draft: true
aliases: []
tags: []
created: 2025-09-24T16:54:24.2424+08:00
updated: 2025-10-11T17:43:24.2424+08:00
---

## **前言**

Protocol Buffers，也被称为Protobuf，是由谷歌在2008年开源的与语言无关、与平台无关的可扩展的结构化数据序列化组件，可用于通信协议、数据存储等场景。自开源以来，因为其简单易用、压缩率高、运行效率高、开发效率高等特点，经历了时间的验证，在业界有广泛的应用。

那么我们在项目中是不是就可以直接使用了呢？我认为这样是欠妥的，Protobuf的确非常优秀，各方面的测试成绩都名列前茅，但并不是它在所有方面都是第一，如果你的项目对某个性能指标有特别严苛的要求，就需要因地制宜、根据实际需求选择最适合的一款序列化组件。

今天要介绍的同样是另一款数据序列化组件，同样是由谷歌开发并开源，它就是FlatBuffers。

## **FlatBuffers介绍**

根据[官网](https://google.github.io/flatbuffers/)的介绍，FlatBuffers是一个高效的、跨平台的序列化组件，支持多种编程语言，是专门为游戏开发和其他性能关键的应用而开发的。他与Protobuf相比有什么区别呢？为什么就更适合游戏开发呢？谷歌很直接的回答了这个问题：Protobuf确实与FlatBuffers比较相似，最主要的区别就是，FlatBuffers并不需要一个转换/解包的步骤就可以获取原数据。

因为我们知道，在游戏场景下的网络通信中，玩家往往是对延迟非常敏感的（尤其是在FPS，Moba类游戏中），抛去网络本身的网络延迟不谈，如果能够降低数据解析（反序列化）的延迟，就能降低玩家操作的延迟感，提升游戏体验。

根据官网的描述，我们对Protobuf与FlatBuffers有如下大致的对比：

|        | **Protobuf**                                                                                                           | **Flatbuffers**                                                                               |
| ------ | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 支持语言   | C/C++, C#, Go, Java, Python, Ruby, Objective-C, Dart                                                                   | C/C++, C#, Go, Java, JavaScript, TypeScript, Lua, PHP, Python, Rust, Lobster                  |
| 版本     | 2.x/3.x，不相互兼容                                                                                                          | 1.x                                                                                           |
| 协议文件   | .proto，需指定协议文件版本                                                                                                       | .fbs                                                                                          |
| 代码生成工具 | 有（生成代码量较多）                                                                                                             | 有（生成代码量较少）                                                                                    |
| 协议字段类型 | bool, bytes, int32, int64, uint32, uint64, sint32, sint64, fixed32, fixed64, sfixed32, sfixed64, float, double, string | bool, int8, uint8, int16, uint16, int32, uint32, int64, uint64, float, double, string, vector |

为了对Protobuf与FlatBuffers的性能有更具体的对比，我做了如下的性能测试，具体代码见[Git仓库](https://git.ppgame.com/lijixue/protocol-benchmark-java)。

## **测试对比**

首先需要选择一组测试数据。为了尽可能真实的模拟业务数据，我选取了3种类型的数据，分别是少量数据、中量数据和大量数据。

### **测试数据**

- 少量数据：只有1个int32，这种情况主要模拟简单的客户端请求/服务器返回，实际业务中有部分通信消息都是这种简单的少量数据，原数据大小为4字节。
- 中量数据：有常用的数据类型：int32、int64、float和string，每个类型均为10个，每个string大小为10字节，则原数据大小为260字节（10 * (4+8+4+10)）。因为这些都是用的最多的业务数据类型，实际业务中有大量通信消息都是这种数据量一般的中量数据。
- 大量数据：同样也有常用的数据类型：int32、int64、float和string，每个类型均为10000个。因为业务中可能会出现少量大消息数据的情况，可以利用该情景来测试一下比较极限的情况，原数据大小为253KB（10000 * (4+8+4+10) / 1024）。

### **测试环境**

测试语言：Java 1.8

操作系统：CentOS Linux release 6.5 (Final)

JVM：Java HotSpot(TM) 64-Bit Server VM 1.8.0_112

Protobuf：3.11.4

FlatBuffers：1.11.0

为了对两款组件的使用成本进行对比，我分别列举了它们的开发使用步骤。

### **ProtoBuf使用步骤**

### 制定协议文件，并命名为 Pb.proto

```Protobuf
// 协议版本为3.x
syntax = "proto3";
// 指定生成消息类的Java包
option java_package = "com.digisky.protocol.msg.pb";


// 消息
message Msg {
    // int32数据
    int32 intData = 1;
    // 数据消息
    repeated DataMsg datas = 2;
}

message DataMsg {
    // int32数据
    int32 intData = 1;
    // int64数据
    int64 longData = 2;
    // float数据
    float floatData = 3;
    //string数据
string stringData = 4;
}
```

为了方便测试，定义了一个通用消息Msg，其中包含一个int32类型用作“少量”型数据测试，又定义了一个DataMsg类型的数据用作“中量”与“大量”型的数据测试。需要注意的是，如果使用3.x版本的Protobuf，必须加入`syntax = "proto3"`的版本标记，并且在3.x版本中移除了2.x版本中的required与optional字段描述，默认所有字段都是optional，这样可以提高消息兼容性。

- 使用编译器“protoc”来编译协议文件，生成协议代码。（编译器可以从[Github仓库](https://github.com/protocolbuffers/protobuf/releases)下载）
- 编译命令：`protoc --java_out=../../src/main/java/ *.proto`，其中`*.proto`表示编译当前目录下的所有proto协议文件。
- 查看生成的Java代码，可以看到已生成了类com.digisky.protocol.msg.pb.PbTest。

只有2个消息的Protobuf协议文件，生成了约2000行的代码。根据我以往的使用经验，若用一个协议文件记录一个模块的协议消息，仅需要十多个消息就会生成数万行的Java代码，因此Protobuf生成的代码文件算是比较庞大的。

### 添加消息序列化代码

```Java
protected byte[] serialize(TestDatadata) {
    Builder builder = Msg.newBuilder();
    // 填充int32
    builder.setIntData(data.getData());
    // 填充data
for (DataObject dataObject :data.getDataArray()) {
        DataMsg.Builder dataBuilder = DataMsg.newBuilder();
        dataBuilder.setIntData(dataObject.getIntData());
        dataBuilder.setLongData(dataObject.getLongData());
        dataBuilder.setFloatData(dataObject.getFloatData());
        dataBuilder.setStringData(dataObject.getStringData());
        builder.addDatas(dataBuilder);
    }
    Msg msg = builder.build();
return msg.toByteArray();
}
```

[![](https://csdnimg.cn/release/blogv2/dist/pc/img/newCodeMoreWhite.png)](https://csdnimg.cn/release/blogv2/dist/pc/img/newCodeMoreWhite.png)

首先是用静态工厂new了一个Msg的builder，然后填充intData，因为datas是复合类型，又是数组（repeated），所以用循环的方式new出DataMsg的builder，填充好DataMsg的builder，然后再将其加入到Msg的builder。再通过build方法构建出Msg对象，最后通过toByteArray方法转化为byte数组，就可以将该byte[]通过网络或其他形式发送出去。

### 添加反序列化代码

```Java
protectedvoiddeserialize(byte[] serializedData) {
try {
        Msg.newBuilder().mergeFrom(serializedData);
    }catch (InvalidProtocolBufferException e) {
        e.printStackTrace();
    }
}
```

反序列化就特别简单，（从网络中）拿到收到的byte[]后，一般先通过网络包的消息头中的消息号，确定本消息对应的消息类，假定我们这里对应的是Msg类，直接通过newBuilder方法和mergeFrom方法就可以得到Msg的builder，然后就可以builder对象中的数据了。

至此，Protobuf使用完毕。可以看到，如果在框架中已经集成好了Protobuf，添加一个新消息，每个步骤都且简单，也没有任何冗余的步骤。

### **FlatBuffers使用步骤**

### 制定协议文件，并命名为Fb.fbs

```Plain
// 指定生成消息类的Java包
namespace com.digisky.protocol.msg.fb;

// 消息
table Msg {
    // int32数据
    intData:int;
    // 数据消息
    datas:[DataMsg];
}

table DataMsg {
    // int32数据
    intData:int;
    // int64数据
    longData:int64;
    // float数据
    floatData:float;
    //string数据
    stringData:string;
}
```

[![](https://csdnimg.cn/release/blogv2/dist/pc/img/newCodeMoreWhite.png)](https://csdnimg.cn/release/blogv2/dist/pc/img/newCodeMoreWhite.png)

FlatBuffers的消息都以table类型来定义，与Protobuf不同的是，字段是以变量名在前，变量类型在后，并且默认省略了字段顺序（也可以加上）。

- 编译方式与Protobuf非常类似，使用编译器“flatc”来编译协议文件，生成协议代码。（编译器可以从[Github仓库](https://github.com/google/flatbuffers/releases)下载）
- 编译命令：`flatc --java -o ../../src/main/java/Fb.fbs`，需要注意的是flatc不支持通配符来指定协议文件，不能像Protobuf一样使用*.fbs。
- 同样查看生成的Java代码，可以看到在com.digisky.protocol.msg.fb包下生成了两个类：Msg与DataMsg。

所以FlatBuffers的生成规则是为每个table生成单独的类，建议将一个模块的消息单独放到一个包中，每个类经过格式化以后大约只有100行，跟Protobuf相比算是小了许多。

### 添加序列化消息代码

```Java
protected byte[] serialize(TestDatadata) {
    FlatBufferBuilder builder = new FlatBufferBuilder();
    DataObject[] dataObjects =data.getDataArray();
    int[] dataOffsets = new int[dataObjects.length];
    // 构建data偏移
for (int i = 0; i < dataObjects.length; i++) {
        DataObject dataObject = dataObjects[i];
        // 填充string，获得stringDataOffset
        int stringDataOffset = builder.createString(dataObject.getStringData());
        // 填充data的其他字段，获得oneDataOffset
        int oneDataOffset = DataMsg.createDataMsg(builder, dataObject.getIntData(), dataObject.getLongData(),
                dataObject.getFloatData(), stringDataOffset);
        dataOffsets[i] = oneDataOffset;
    }
    int dataOffset = Msg.createDatasVector(builder, dataOffsets);
    Msg.startMsg(builder);
    // 填充int32
    Msg.addIntData(builder,data.getData());
    // 填充data
    Msg.addDatas(builder, dataOffset);
    intend = Msg.endMsg(builder);
    builder.finish(end);
return builder.sizedByteArray();
}
```

[![](https://csdnimg.cn/release/blogv2/dist/pc/img/newCodeMoreWhite.png)](https://csdnimg.cn/release/blogv2/dist/pc/img/newCodeMoreWhite.png)

首先是需要new一个FlatBufferBuilder出来，以后填充数据都需要指定到这个builder当中。由于Msg当中引用了DataMsg类型，因此需要先创建DataMsg，获得DataMsg的偏移量，再将偏移量填充到Msg当中。可以看到，FlatBuffers处理自定义类型或是数组等非基本类型的数据时，都是通过先计算偏移量，再填充偏移量来实现的，这个过程比Protobuf略微复杂。

### 添加反序列化代码

```Java
protectedvoiddeserialize(byte[] serializedData) {
ByteBuffer buffer = ByteBuffer.wrap(serializedData);
Msg msg = Msg.getRootAsMsg(buffer);
}
```

反序列化就相对简单了，先利用NIO将byte[]包装成ByteBuffer，然后利用Msg的getRootAsMsg即可获得Msg对象，就可以进行取值操作了。

### **性能测试**

通过上述使用步骤可以看出，Protobuf与FlatBuffers的使用步骤基本一致，最主要的区别就是Protobuf生成的代码量庞大，消息封装简单；而FlatBuffers则相反，生成的代码量少，消息封装稍显复杂。那么他们的性能到底如何呢，在少量、中量、大量数据的情形下表现如何呢，我从数据大小、序列化时间、反序列化时间、内存使用等维度进行了测试对比。

- 数据大小

|   |   |   |   |
|---|---|---|---|
||**少量数据（4字节）**|**中量数据（260字节）**|**大量数据（253千字节）**|
|Protobuf|2字节|201字节|229,735字节|
|FlatBuffers|28字节|496字节|440,056字节|

可以看到，在数据量很少的情况下，Protobuf要比FlatBuffers小很多倍的，当数据量逐渐增大后，Protobuf最终会比FlatBuffers小一半左右。所以结论是，Protobuf比FlatBuffers在数据大小上更优（约领先一倍），但因为不同的数据量，不同的字段类型都会影响到该性能指标，这里只得出一个大致的结论，我将在后面源码解析部分做更详细的分析。

- 序列化时间

|   |   |   |   |
|---|---|---|---|
||**少量数据（4字节）**|**中量数据（260字节）**|**大量数据（253千字节）**|
|Protobuf|1466纳秒|10757纳秒|2,000,497纳秒|
|FlatBuffers|1922纳秒|9754纳秒|2,760,061纳秒|

可以看到，在序列化时间上，Protobuf与Flatbuffers整体上不相上下。因此可以得出结论：Protobuf与FlatBuffers在序列化耗时上性能基本一致。

- 反序列化时间

|   |   |   |   |
|---|---|---|---|
||**少量数据（4字节）**|**中量数据（260字节）**|**大量数据（253千字节）**|
|Protobuf|2040纳秒|5393纳秒|1,101,464纳秒|
|FlatBuffers|847纳秒|312纳秒|286纳秒|

可以看到，在数据量很少的情况下，FlatBuffers的反序列化时间大约比Protobuf少一半，而在中等数据的情况下优势就已经比较明显，在大量数据的情况下呢？

Protobuf直接被秒杀！这也验证了本文刚开始介绍的Flatbuffers的特性：不需要转换/解包的操作就能够获得原数据，因此反序列化时间几乎为0。所以结论是：FlatBuffers可以在反序列化性能上打败任何框架/组件，因为它已经将该性能做到了极致。

- 内存使用

因为使用Java语言来测试的缘故，无法准确统计到底使用了多少内存，但可以通过垃圾回收来侧面反映整个测试过程的内存使用情况，我设定了最大堆内存（Xmx）为16MB，首先来看Protobuf的gc情况。

可以看到，对于测试数据，Protobuf序列化与反序列化总共消耗了1分06秒，CPU平均占用42%，垃圾回收占用12.2%，GC情况如图。

而Flatbuffers只运行了32秒，因为反序列化特性的缘故节省了很多时间，比较符合预期。而CPU利用率只有27%，垃圾回收也只占2.9%，GC次数更是明显比Protobuf少了至少一半，因此Flatbuffers运行过程比较轻量，占用资源较少。

## **源码分析**

那么为什么Protobuf可以将数据大小做得这么小呢？一般序列化后的数据会加上一些协议本身的数据，但Protobuf最终的数据大小竟然比数据本身还小，他是如何压缩的呢？还有，Flatbuffers是怎样将反序列化时间做到0这样一个极限的呢？让我们来从源码中一一找到答案。**！！！催眠预警，如果你对源码不感兴趣，也可以直接跳到文末看结论**

### **Protobuf的数据压缩**

Protobuf的数据处理算法主要是在com.google.protobuf.CodedOutputStream类里面，根据不同的字段类型，有许多不同的computeXXXSize，我们以int32为例：

```Java
/**
*Compute thenumberof bytes that would be neededto encode an {@code int32} field, including
* tag.
*/
public static int computeInt32Size(final int fieldNumber,final intvalue) {
return computeTagSize(fieldNumber) + computeInt32SizeNoTag(value);
}
```

可以看到，int32字段所占的空间大小由tag大小（即字段顺序）与字段值大小的和来决定，首先先来看tag大小。

```Java
/** Compute the number of bytes that would be needed to encode a tag. */
publicstaticintcomputeTagSize(finalint fieldNumber) {
return computeUInt32SizeNoTag(WireFormat.makeTag(fieldNumber, 0));
}
```

无论是哪种字段类型，tag大小都是由同样的方式计算出的，首先是：

```Java
/** Makes a tag value given a field number and wire type. */
staticintmakeTag(finalint fieldNumber,finalint wireType) {
return (fieldNumber << TAG_TYPE_BITS) | wireType;
}
```

这里TAG_TYPE_BITS等于3，wireType等于0，因此返回值为8。这里可能会有疑问，为什么要左移3位呢？因为需要让3bit的空间给wireType，就是Protobuf的编码类型，默认为0，详细的编码列表在com.google.protobuf.WireFormat中有定义：

```Java
  public staticfinal int WIRETYPE_VARINT = 0;
  public staticfinal int WIRETYPE_FIXED64 = 1;
  public staticfinal int WIRETYPE_LENGTH_DELIMITED = 2;
  public staticfinal int WIRETYPE_START_GROUP = 3;
  public staticfinal int WIRETYPE_END_GROUP = 4;
  public staticfinal int WIRETYPE_FIXED32 = 5;
```

因此，int32使用的编码类型就是Varints，在后面会做进一步介绍。我们先继续看computeUInt32SizeNoTag：

```Java
/**Compute thenumberof bytes that would be neededto encode a {@code uint32} field. */
public static int computeUInt32SizeNoTag(final intvalue) {
if ((value & (~0 << 7)) == 0) {// 表示value除后7bit外全为0，例如00000000 00000000 00000000 01111111
return 1;
    }
if ((value & (~0 << 14)) == 0) {// 表示value除后14bit外全为0，例如00000000 00000000 00111111 11111111
return 2;
    }
if ((value & (~0 << 21)) == 0) {// 表示value除后21bit外全为0，例如00000000 00011111 11111111 11111111
return 3;
    }
if ((value & (~0 << 28)) == 0) {// 表示value除后28bit外全为0，例如00001111 11111111 11111111 11111111
return 4;
    }
return 5;
}
```

如上注释中所标注，该方法是根据value的值来确定tag的所占空间。当value是0-127时，占1字节，128-16383时占2字节，以此类推，最多占用5字节。而value是由fieldNumber（字段顺序）左移3位得来的，要使value小于128，则fieldNumber需要小于16。因此，**为了使tag所占空间不超过1字节，我们定义消息时字段数量最好不要超过15个。**

tag大小弄明白之后，再来继续看字段值所占的大小computeInt32SizeNoTag：

```Java
/**
*Compute thenumberof bytes that would be neededto encode an {@code int32} field, including
* tag.
*/
public static int computeInt32SizeNoTag(final intvalue) {
if (value >= 0) {
return computeUInt32SizeNoTag(value);
    }else {
      // Must sign-extend.
return MAX_VARINT_SIZE;
    }
}
```

首先判断int值是否为非负数，若为非负数，则改用computeUInt32SizeNoTag来计算所占空间，否则固定占用MAX_VARINT_SIZE个字节，即10个。而computeUInt32SizeNoTag我们刚刚已经分析过了，这时可能会产生疑问，uint32为什么是按127，16383来做区间划分的呢？我们再来看writeInt32NoTag：

```Java
@Override
publicfinal void writeInt32NoTag(intvalue) throws IOException {
if (value >= 0) {
        writeUInt32NoTag(value);
      }else {
        // Must sign-extend.
        writeUInt64NoTag(value);
      }
}
```

当写数据时，首先也是判断value的正负，若是负数则直接扩展成uint64来处理，所以前面直接确定了所占空间为10字节。而如果是非负数，则调用了writeUInt32NoTag来处理：

```Java
@Override
publicfinal void writeUInt32NoTag(intvalue) throws IOException {
if (HAS_UNSAFE_ARRAY_OPERATIONS
          && !Android.isOnAndroidDevice()
          && spaceLeft() >= MAX_VARINT32_SIZE) {
if ((value & ~0x7F) == 0) {
          UnsafeUtil.putByte(buffer, position++, (byte)value);
return;
        }
        UnsafeUtil.putByte(buffer, position++, (byte) (value | 0x80));
value>>>= 7;
if ((value & ~0x7F) == 0) {
          UnsafeUtil.putByte(buffer, position++, (byte)value);
return;
        }
        UnsafeUtil.putByte(buffer, position++, (byte) (value | 0x80));
value>>>= 7;
if ((value & ~0x7F) == 0) {
          UnsafeUtil.putByte(buffer, position++, (byte)value);
return;
        }
        UnsafeUtil.putByte(buffer, position++, (byte) (value | 0x80));
value>>>= 7;
if ((value & ~0x7F) == 0) {
          UnsafeUtil.putByte(buffer, position++, (byte)value);
return;
        }
        UnsafeUtil.putByte(buffer, position++, (byte) (value | 0x80));
value>>>= 7;
        UnsafeUtil.putByte(buffer, position++, (byte)value);
      }else {
        try {
          while (true) {
if ((value & ~0x7F) == 0) {
              buffer[position++] = (byte)value;
return;
            }else {
              buffer[position++] = (byte) ((value & 0x7F) | 0x80);
value>>>= 7;
            }
          }
        } catch (IndexOutOfBoundsException e) {
          throw new OutOfSpaceException(
String.format("Pos: %d, limit: %d, len: %d", position,limit, 1), e);
        }
      }
}
```

这里就比较复杂了，首先是一个巨大的if-else，如果虚拟机支持Unsafe并且至少有5个字节未分配，就走if，否则，就执行else。其实两种算法的逻辑是一样的，都是在进行byte数组的赋值，只是Unsafe的效率会高一些，如果你有兴趣，可以先自行了解一下Unsafe。

那么具体是怎样赋值的呢，这里就需要先介绍Protobuf的[Base 128 Varints](https://developers.google.com/protocol-buffers/docs/encoding)的概念。简单来讲，就是将每个字节的8个bit按用途进行划分，最高位的那个bit称为“most significant bit”（MSB）用来存储标志，表示本字节外是否还有额外的字节，其余低7位的bit用来存储数据。因此，每个字节只能存储7个bit的数据（非负值的取值范围为0-127），这也与前面计算占用空间时所说的数据按每7bit分为一段相符合。

那么上面的代码含义就是，首先判断数据是否不超过127（最高位是否为0），若为0，则表示本数据只有一个字节，直接强转为byte后写入即可；若不为0，则表示除本字节外，还需要有额外的字节来写数据，于是就先写入本数据的前7bit，并把MSB置为1，作为1个字节数据写入，然后再按照同样的方式（每7bit为一段）来处理后面的数据。

看到这里，Protobuf的数据压缩原理基本就清晰了，对于int32类型的数据，会根据数据值将4个字节的空间最多压缩到1个字节，再加上协议本身（tag）所占的空间，最高能压缩到2字节。因此对于int32类型的数据，最高能达到的压缩率是50%。

还有个细节需要注意，上文中有提到，对于负数值的int32类型，无论是负多少，Protobuf会将其转化为uint64来处理，将会非常的浪费空间（例如int32的数“-1”如果转化uint64，其值将会变为2^32-1=4294967295这么大的数）。那么如果业务中要处理负数怎么办呢？Protobuf提供了一种专门针对负数优化的类型sint型，查看writeSInt32源码可以看到：

```Java
/**Write a {@code sint32} field, including tag,to the stream. */
publicfinal void writeSInt32(final int fieldNumber,final intvalue) throws IOException {
    writeUInt32(fieldNumber, encodeZigZag32(value));
}

/**
* Encode a ZigZag-encoded 32-bitvalue. ZigZag encodes signed integersintovalues that can be
* efficiently encodedwith varint. (Otherwise, negativevalues must be sign-extendedto 64 bits
*to be varint encoded, thus always taking 10 byteson the wire.)
*
* @param n A signed 32-bit integer.
* @return An unsigned 32-bit integer, storedin a signed int because Java hasno explicit
*     unsigned support.
*/
public static int encodeZigZag32(final int n) {
    // Note:  the right-shift must be arithmetic
return (n << 1) ^ (n>> 31);
}
```

Protobuf采用了zigzag编码来处理有负数的情况，例如1经过编码后变成了2，-1经过编码后变成了1，编码后全为正数，且不会出现绝对值很小的数编码后变成了很大的数，因此可以充分利用Protobuf的Base 128 Varints来进行数据压缩。而其他类型例如enum、float、double、sfixed等等都是转化成了fixed来处理，没有做数据压缩。

综上所述，对于整型的数值较小的数据，Protobuf能够很好的对其进行压缩，压缩率最高可达50%。

### **FlatBuffers的反序列化**

要弄清楚反序列化的过程，首先就得弄明白序列化的过程，因为反序列化是序列化的逆向操作。从Flatbuffers的使用步骤中可以看到，每个消息是用table来表示的，并且table之间是可以嵌套的，给一个table型变量赋值只需要给出该table的偏移量即可。因此，计算偏移量就成为了分析FlatBuffers源码的关键，我们首先来看计算DataMsg偏移量的方法：com.digisky.protocol.msg.fb.DataMsg类（该代码是由flatc编译器生成）

```Java
publicstatic intcreateDataMsg(FlatBufferBuilder builder,
                                int intData,
                                long longData,
                                float floatData,
                                int stringDataOffset) {
    builder.startObject(4);
    DataMsg.addLongData(builder, longData);
    DataMsg.addStringData(builder, stringDataOffset);
    DataMsg.addFloatData(builder, floatData);
    DataMsg.addIntData(builder, intData);
return DataMsg.endDataMsg(builder);
}
```

在该方法中，首先是调用builder的startObject方法来创建对象，参数“4”代表DataMsg包含的变量个数。跟进去看该方法的实现：

```Java
public void startObject(int numfields) {
    notNested();
    // new出一个包含变量便宜值的数组
if (vtable ==null || vtable.length < numfields) vtable = new int[numfields];
    vtable_in_use = numfields;
    // 初始化数组
    Arrays.fill(vtable, 0, vtable_in_use, 0);
nested =true;
    // 获得本对象的起始便宜值
object_start = offset();
}
```

该方法并没有做一些实际的事情，只是做一些初始化的工作。接下来再看给各变量赋值的addXXX方法，我们以addIntData为例：

```Java
publicstaticvoidaddIntData(FlatBufferBuilder builder, int intData) {
    builder.addInt(0, intData, 0);
}
```

可以看到直接调用了builder的addInt方法，第一个参数0表示字段的顺序，0代表第一个字段，第三个参数0表示该字段的默认值，表示默认为0，再继续跟进：

```Java
/**
 * Add an `int` to a table at `o` into its vtable, with value `x`and default `d`.
 *
 * @param o Theindex into the vtable.
 * @paramx An `int` to put into the buffer, depending on how defaults are handled. If
 *          `force_defaults` is `false`, compare `x` against the default value `d`. If `x` contains the
 *          default value, it can be skipped.
 * @param d An `int` default value to compare againstwhen `force_defaults` is `false`.
 */
public void addInt(int o,intx,int d) {
if (force_defaults ||x != d) {
        addInt(x);
        slot(o);
    }
}
```

首先是做了一个判断，是否要强制写进默认值，如果不强制，该字段又是默认值，那么就直接返回了，这也是Flatbuffers唯一的数据压缩方案，如果该字段是默认值，就不序列化该字段。如果不是默认值，就调用addInt和slot方法。首先是addInt方法：

```Java
/**
 * Add an `int` to the buffer, properly aligned, and grows the buffer (if necessary).
 *
 * @param x An `int` to put into the buffer.
 */
public void addInt(int x) {
    prep(Constants.SIZEOF_INT, 0);
    putInt(x);
}
```

AddInt方法中包含了prep与PutInt：

```Java
/**
 * Prepare to write an element of `size` after `additional_bytes`
 * have been written, e.g. if you write a string, you need to align such
 * the int length field is aligned to {@link com.google.flatbuffers.Constants\#SIZEOF_INT}, and
 * the string data follows it directly.  If all you need to do is alignment, `additional_bytes`
 * will be 0.
 *
 *@param size This is the of the new element to write.
 *@param additional_bytes The padding size.
 */
publicvoidprep(int size,int additional_bytes) {
    // Track the biggest thing we've ever aligned to.
if (size > minalign) minalign = size;
    // Find the amount of alignment needed such that `size` is properly
    // aligned after `additional_bytes`
int align_size = ((~(bb.capacity() - space + additional_bytes)) + 1) & (size - 1);
    // Reallocate the buffer if needed.
while (space < align_size + size + additional_bytes) {
int old_buf_size = bb.capacity();
ByteBuffer old = bb;
        bb = growByteBuffer(old, bb_factory);
if (old != bb) {
            bb_factory.releaseByteBuffer(old);
        }
        space += bb.capacity() - old_buf_size;
    }
    pad(align_size);
}

/**
 * Add an `int` to the buffer, backwards from the current location. Doesn't align nor
 * check for space.
 *
 *@param x An `int` to put into the buffer.
 */
publicvoidputInt(int x) {
    bb.putInt(space -= Constants.SIZEOF_INT, x);
}
```

prep主要是进行一些写入前的准备，确认缓冲区是否足够写入，以及检查数据对齐等等，而putInt就是真正的将数据写入缓冲区。从这里可以看到，Flatbuffers在写入数据时，是将原数据直接写入，并没有做压缩，再来看slot方法：

```Java

/**
 * Set the current vtable at `voffset` to the current location in the buffer.
 *
 * @param voffset The index into the vtable to store the offset relative to the end of the
 * buffer.
 */
publicvoidslot(int voffset) {
    vtable[voffset] = offset();
}
```

将数据写入后，根据字段顺序计算出了该字段的偏移量，并保存到了vtable中。至此，各字段数据就写入完毕。再通过计算最终的偏移量，就可以获得整个消息的偏移量，序列化的工作就完成了。

接下来就是反序列化了，还记得是如何反序列化FlatBuffers数据的吗：

```Java
ByteBuffer buffer = ByteBuffer.wrap(serializedData);
Msg msg = Msg.getRootAsMsg(buffer);
```

首先是将byte数组包装成NIO的ByteBuffer，然后调用getRootAsMsg即可获得Msg对象。那Msg对象是如何构建的呢，在构建过程中是否进行了字段解析呢？

```Java
publicstaticMsggetRootAsMsg(ByteBuffer _bb) {
returngetRootAsMsg(_bb,newMsg());
}

publicstaticMsggetRootAsMsg(ByteBuffer _bb, Msg obj) {
    _bb.order(ByteOrder.LITTLE_ENDIAN);
return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb));
}

publicMsg__assign(int _i, ByteBuffer _bb) {
__init(_i, _bb);
return this;
}

public void__init(int _i, ByteBuffer _bb) {
    bb_pos = _i;
    bb = _bb;
    vtable_start = bb_pos - bb.getInt(bb_pos);
    vtable_size = bb.getShort(vtable_start);
}
```

通过上述几个方法深追可以看到，首先将ByteBuffer设置成了小端模式，然后调用__assign方法将ByteBuffer关联到Msg对象，并将其初始化。整个过程中都只是简单的赋值操作，没有进行内存拷贝、数据解码等耗时操作，那么消息字段又怎样解析呢，我们以intData为例：

```Java
publicintintData() {
int o = __offset(4);
return o != 0 ? bb.getInt(o + bb_pos) : 0;
}

/**
* Look up a field in the vtable.
*
*@param vtable_offset An `int` offset to the vtable in the Table's ByteBuffer.
*@return Returns an offset into the object, or `0` if the field is not present.
*/
protectedint__offset(int vtable_offset) {
return vtable_offset < vtable_size ? bb.getShort(vtable_start + vtable_offset) : 0;
}
```

要获取某字段时，先通过字段顺序“4”获取该字段的偏移量，然后再通过该偏移量即可在ByteBuffer中直接获取到字段值，非常的简洁高效。

综上所述，FlatBuffers在序列化时计算了各字段在数据体的偏移量，并将偏移量存储在了数据体中。反序列化时，首先读取字段的偏移量，然后根据偏移量读取数据即可。因为反序列化过程没有内存拷贝、数据解码等耗时操作，所以速度非常快。

## **总结**

1. FlatBuffers序列化后不需要转换/解包的操作就可以获得原数据，反序列化消耗的时间极短，短到远小于1ms而可以忽略；基本没有对数据进行压缩，因为有偏移量的关系，数据量比原数据有所增加；生成的代码量较少，运行比较轻量，CPU占用较低，内存占用较少。
2. Protobuf采用”Base 128 Varints”算法对整型数据进行压缩，压缩比例最高能达到50%；序列化与反序列化都比较重度，生成的代码量较大，CPU占用较高，内存占用较多。
3. Protobuf 3.x中移除了required和optional字段描述，相当于除repeated以外的所有字段都是optional，提高了Protobuf的消息兼容性。
4. Protobuf使用技巧：
    - 为了使数据压缩率更高，每个消息的字段数量最好不要超过15个。
    - 尽量不要使用int32与int64，如果是正数使用uint，如果是负数则使用sint。
    - 如果业务中能够控制int32或int64型数据的取值范围，尽量控制在0-127。
    - 通过以上技巧都能够提高Protobuf的数据压缩能力。
5. Flatbuffers使用技巧：
    - uint类型只是为了扩大int的取值范围（兼容c/c++与c\#等有unsigned int类型的语言），而如果是java等没有unsigned int等类型的语言，会在赋值与取值时扩展为long来处理，所以若非有实际需要，尽量不要使用uint。
    - 如果业务中能够控制bool、int8、int16、int32、int64的取值是0与非0的概率，尽量让取值为0的情况多一些，可以使Flatbuffers具备一定的压缩能力。
6. 若项目需求对数据处理延时有严苛的要求（例如FPS、Moba、动作RPG等），可以考虑使用Flatbuffers，并配合UDP/KCP等传输层协议，能够比传统的TCP+Protobuf方案有更好的降低延时的效果。