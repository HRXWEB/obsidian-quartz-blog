---
title: 
draft: 
aliases: []
tags: []
created: Wednesday, September 24th 2025, 4:54:25 pm
updated: Friday, September 26th 2025, 4:59:10 pm
---

# 服务端

## reprepro 相关配置

- 添加发行配置
    
    ```Shell
    sudo apt install reprepro
    sudo mkdir -p /var/www/html/apt-repository
    cd /var
    sudo chown -R $USER:$USER www
    cd ./www/html/apt-repository
    mkdir conf
    cd conf
    touch distributions
    ```

    distribution 的配置的字段解释如下：

    - Origin: Your_Origin // 指定软件包仓库的来源，通常是您或您的组织的名称
    - Label: our_Label // 给软件包仓库设置一个标签，用于标识仓库
    - Codename: Your_Codename // 每个发行版都有一个代号，比如 stable、testing、unstable 等
    - Architectures: Your_Architectures // 指定软件包支持的架构，比如 amd64、i386、arm64 等
    - Components: main // 指定软件包仓库的组件，比如 main、contrib、non-free 等
    - Description: Your_Description
    - SignWith: YOUR_KEY_ID // 指定用于对软件包进行签名的GPG密钥ID

    一个具体的例子如下

    ```Shell
    Origin: Team
    Label: algorithm
    Codename: stable
    Architectures: amd64 arm64
    Components: main
    Description: The deb of algorithm department of team
    SignWith: 14A8D54DAE457C5233A63C8483558764B2FCCCA1
    ```
    
- 上述的配置中有一个 gpg 密钥，这是需要先生成并填写的
    
    ```Shell
    gpg --gen-key
    >>> # 会要求填写如下几个部分，冒号后面是我填写的一个具体的例子
    Real Name: username
    Email address: user@example.com.cn
    You need a Passphrase to protect your secret key: 5aidaYUMAOQIU    # 这个是用来保护密钥的密码。。。
    >>>
    
    gpg --list-keys
    >>> # 下面的 14A8D54DAE457C5233A63C8483558764B2FCCCA1 就是需要的密钥ID
    /home/username/.gnupg/pubring.kbx
    ------------------------------------
    pub   rsa3072 2025-02-06 [SC] [expires: 2027-02-06]
          14A8D54DAE457C5233A63C8483558764B2FCCCA1
    uid           [ultimate] username <user@example.com.cn>
    sub   rsa3072 2025-02-06 [E] [expires: 2027-02-06]
    >>>
    ```
    
- 将密钥文件拷贝到 `apt-repository` 下面方便客户端添加密钥的公钥
    
    ```Shell
    # 这一步需要用到密钥 ID：14A8D54DAE457C5233A63C8483558764B2FCCCA1
    # 另外回车敲下命令后还会需要输入刚才配置的 passphrase：5aidaYUMAOQIU
    gpg --output /var/www/html/apt-repository/public.key --armor --export 14A8D54DAE457C5233A63C8483558764B2FCCCA1
    ```
    
- 初始化仓库
    
    ```Shell
    cd /var/www/html/apt-repository
    reprepro export
    ```
    
- 添加软件包到 `reprepro` 仓库
    
    ```Shell
    # reprepro会根据DEB包内的元数据自动将其放置在正确的架构目录下。
    reprepro includedeb stable /data/r1_deb/dataflow_1.0.0_arm64.deb
    reprepro export
    
    # 查看目录架构
    tree -a .
    ```

## 配置 Nginx 代理 reprepro 仓库的静态文件

```Shell
sudo apt-get install nginx
sudo vim /etc/nginx/sites-available/default
>>> # 找到如下的字段并修改
# 1. 改为 `root /var/www/html/apt-repository;`
# 2. location 中添加 `autoindex on;`
# 注意分号不能省略
server {
    listen 80;
 
    root /var/www/html/apt-repository;
    server_name _;
 
    location / {
        autoindex on;
    }
>>>
sudo systemctl restart nginx
```

打开 `http://server_ip/` 就可以打开 `index of apt-repository`

上述配置解析：

- `listen 80` : 这是HTTP（超文本传输协议）的标准端口号。当用户在浏览器地址栏输入一个网址而没有指定端口号时，默认使用的就是80端口。所以改成别的端口时以下所有部分要从 `server_ip` 改成 `server_ip:port`
- `root ...` : 设置网站根目录
- `server_name _` : 设置域名或服务器 IP 地址
- `autoindex on;` : 展示目录列表

# 客户端

### 配置 apt 源

```Shell
cd /etc/apt/sources.list.d
sudo vim nova-algo.list
>>> # 服务器 ip 是 192.168.7.102
deb [arch=arm64] http://192.168.7.102 stable main
```

### 导入 GPG 密钥

public.key 的位置去决定这部分的设置：

```Shell
wget -qO - http://192.168.7.102/public.key | sudo apt-key add -

# 列出所有的密钥
apt-key list
```

### 更新下载

```Shell
sudo apt update
sudo apt install dataflow
>>> # 会自动安装依赖（前提是deb包本身配置了依赖），dataflow 本身有很多依赖，但是只有 libgoogle-glog-dev 没装，所以只装这个
Reading package lists... Done
Building dependency tree
Reading state information... Done
The following additional packages will be installed:
  libgoogle-glog-dev
The following NEW packages will be installed:
  dataflow libgoogle-glog-dev
>>> 
```

deb 打包的时候怎么设置依赖项并被 `apt` 解析请参考（注意 `set(CPACK_DEBIAN_PACKAGE_DEPENDS` 部分）：

```Plain
# set the package type
set(CPACK_DEBIAN_PACKAGE_ARCHITECTURE "arm64")

# strip the binaries
set(CPACK_STRIP_FILES YES)

# Set dependencies
set(CPACK_DEBIAN_PACKAGE_DEPENDS "libyaml-cpp-dev, libopencv-dev, libgoogle-glog-dev")
```

`set(CPACK_DEBIAN_PACKAGE_DEPENDS...` 会影响 `DEBIAN/control` 文件中的 `Depends` 字段，比如上述设置后的效果是：

```Shell
Depends: libyaml-cpp-dev, libopencv-dev, libgoogle-glog-dev
```

# 参考

1. [https://blog.csdn.net/hua_chi/article/details/136578234](https://blog.csdn.net/hua_chi/article/details/136578234)
2. **[GPG 生成 gpg的密钥对](https://juejin.cn/post/7439628941394378806)**