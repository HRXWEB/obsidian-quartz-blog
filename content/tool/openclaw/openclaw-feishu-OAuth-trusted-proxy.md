---
title: 飞书 OAuth + Trusted Proxy：给内网 Web UI 加一层企业登录
draft: true
aliases: []
tags:
  - OAuth
  - OIDC
  - Feishu
  - Casdoor
  - oauth2-proxy
  - nginx
created: 2026-06-04T14:34:40.4040+08:00
updated: 2026-06-04T15:20:00.0000+08:00
---

# 飞书 OAuth + Trusted Proxy：给内网 Web UI 加一层企业登录

> 场景：有一台只在局域网内访问的服务器，没有公网域名，希望用飞书企业账号给 Web UI 做登录认证。
>
> 这篇是一次 OAuth/OIDC 实践笔记，重点记录方案取舍、完整链路和踩坑点。

## 先说结论

方案可行，但**飞书 OAuth 不能直接接 oauth2-proxy**。原因是 oauth2-proxy 的 OIDC provider 需要标准 OpenID Connect，而飞书开放平台提供的是 OAuth 2.0 登录能力，不直接提供 OIDC discovery、`id_token` 和 JWKS。

最终方案是在中间加一层 Casdoor：

```text
oauth2-proxy ── OIDC ──> Casdoor ── OAuth 2.0 ──> 飞书
               标准协议    适配层          飞书登录
```

整体访问链路如下：

```text
浏览器
  │
  │ http://<LAN_IP>
  ▼
nginx (:80)
  │  auth_request
  ▼
oauth2-proxy (:4180)
  │  OIDC
  ▼
Casdoor (:8000)
  │  OAuth 2.0
  ▼
飞书开放平台

认证通过后：
nginx ── X-Forwarded-User: alice@example.com ──> OpenClaw Gateway (:18789)
```

其中：

| 组件 | 作用 |
| --- | --- |
| nginx | 局域网入口，负责反向代理和 `auth_request` |
| oauth2-proxy | 管理登录态，拦截未登录请求 |
| Casdoor | 把飞书 OAuth 适配成标准 OIDC Provider |
| 飞书开放平台 | 企业账号登录和用户信息来源 |
| OpenClaw Gateway | 真实 Web UI 服务，使用 trusted-proxy 模式信任上游传来的身份 |

## 为什么不能直接飞书接 oauth2-proxy

OAuth 2.0 解决的是授权问题：用户同意后，应用可以拿到 `access_token`，再用它读取用户信息。

OIDC（OpenID Connect）是在 OAuth 2.0 之上补的一层身份认证标准。oauth2-proxy 使用 OIDC provider 时依赖这些能力：

| OIDC 能力 | 说明 | 飞书 OAuth 是否直接提供 |
| --- | --- | --- |
| Discovery 端点 | `/.well-known/openid-configuration`，用于自动发现授权端点、token 端点、JWKS 等 | 否 |
| `id_token` | JWT 格式的身份 token，包含邮箱、用户名等 claim | 否 |
| JWKS 端点 | 用于验证 `id_token` 签名的公钥集合 | 否 |

飞书提供的是 OAuth 2.0 登录和用户信息 API，不是完整 OIDC Provider。因此 oauth2-proxy 不能只靠一个飞书 issuer URL 启动。

Casdoor 在这里的作用就是“翻译”：

- 对 oauth2-proxy 暴露标准 OIDC：discovery、authorization endpoint、token endpoint、JWKS、`id_token`
- 对飞书使用 OAuth 2.0：授权、换 token、读取用户信息
- 把飞书返回的邮箱写入 OIDC `id_token` 的 `email` claim

## 一次完整登录发生了什么

以 `http://<LAN_IP>` 为例：

1. 浏览器访问 nginx。
2. nginx 用 `auth_request` 请求 oauth2-proxy 的 `/oauth2/auth`。
3. oauth2-proxy 发现没有 session cookie，返回 401。
4. nginx 把浏览器重定向到 `/oauth2/sign_in`。
5. oauth2-proxy 重定向到 Casdoor 登录页。
6. 用户在 Casdoor 里点击“用飞书登录”。
7. 浏览器跳转到飞书授权页。
8. 用户完成飞书登录和授权。
9. 飞书回调 Casdoor，URL 中带 authorization code。
10. Casdoor 用 code 向飞书换取 access token。
11. Casdoor 调飞书用户信息 API，拿到用户邮箱。
12. Casdoor 生成包含 `email` claim 的 OIDC `id_token`，回调 oauth2-proxy。
13. oauth2-proxy 校验 `id_token`，设置 session cookie。
14. 浏览器带 cookie 重新访问 nginx。
15. nginx 再次调用 `/oauth2/auth`，这次得到 200。
16. oauth2-proxy 在 auth 响应中返回 `X-Auth-Request-Email`。
17. nginx 把它转成 `X-Forwarded-User`，转发给 Gateway。
18. Gateway 在 trusted-proxy 模式下读取这个 header，完成认证。

之后浏览器只要 session cookie 还有效，就不会重复走飞书登录。

## 邮箱是怎么传到 Gateway 的

这条链路是整套方案里最容易混淆的部分：

```text
飞书账号邮箱
  → 飞书用户信息 API
  → Casdoor 用户表 email 字段
  → OIDC id_token 的 email claim
  → oauth2-proxy 的 X-Auth-Request-Email
  → nginx 改名为 X-Forwarded-User
  → Gateway trusted-proxy userHeader
```

### 1. 飞书 API 到 Casdoor

用户授权后，飞书返回 authorization code。Casdoor 用 code 换取用户 access token，再调用飞书用户信息 API。

示例返回：

```json
{
  "user": {
    "open_id": "ou_xxxxxxxxxxxxxxxxxxxxxxxx",
    "name": "Alice",
    "email": "alice@example.com",
    "avatar": { "avatar_72": "https://example.com/avatar.png" }
  }
}
```

Casdoor 会把用户存入自己的数据库，`email` 字段来自飞书返回的邮箱。

### 2. Casdoor 到 OIDC `id_token`

oauth2-proxy 拿着 Casdoor 发回的 authorization code 请求 token endpoint。Casdoor 返回的 token 响应里包含 `id_token`。

`id_token` 是一个 JWT，payload 里会有类似字段：

```json
{
  "sub": "user-id",
  "iss": "http://<LAN_IP>:8000",
  "aud": "oauth2-proxy-client-id",
  "email": "alice@example.com",
  "name": "Alice",
  "preferred_username": "alice",
  "iat": 1710000000,
  "exp": 1710086400
}
```

其中 `email` 是 OIDC 标准 claim。oauth2-proxy 默认会把它当成用户邮箱。

### 3. oauth2-proxy 到 nginx header

启用下面这个配置后：

```yaml
OAUTH2_PROXY_SET_XAUTHREQUEST: "true"
```

oauth2-proxy 会在 nginx `auth_request` 的响应里输出身份 header：

```text
X-Auth-Request-Email: alice@example.com
X-Auth-Request-User: user-id
X-Auth-Request-Preferred-Username: alice
```

这些 header 名是 oauth2-proxy 固定输出的。nginx 可以读取其中一个，再转发给后端：

```nginx
auth_request_set $user $upstream_http_x_auth_request_email;
proxy_set_header X-Forwarded-User $user;
```

Gateway 不关心 header 一定叫 `X-Forwarded-User`，它读的是配置里的 `gateway.auth.trustedProxy.userHeader`。只要 nginx 传的 header 名和 Gateway 配置一致即可。

## 部署步骤

下面用 `<LAN_IP>` 代表服务器的局域网 IP，请替换为自己的地址。示例里的 secret、client id、邮箱都只是占位符。

### Step 1：创建飞书企业自建应用

在飞书开放平台创建企业自建应用，记录：

- App ID，例如 `cli_xxxxxxxxxxxxxxxx`
- App Secret

然后配置：

1. 安全设置 → 重定向 URL，添加：

   ```text
   http://<LAN_IP>:8000/callback
   ```

   这是 Casdoor 的飞书回调地址，不是 oauth2-proxy 的回调地址。

2. 权限管理中开通：

   - `contact:user.email:readonly`：必须，否则拿不到邮箱
   - `contact:user.base:readonly`

3. 重新创建版本并发布。

   飞书权限变更后需要重新发版，否则新权限不会生效。

4. 在飞书管理后台限制应用可用范围。

   如果不在 Gateway 里额外设置 allowlist，那么谁能访问主要取决于飞书应用的可用范围。

### Step 2：部署 Casdoor 和 oauth2-proxy

创建一个单独目录，例如：

```bash
sudo mkdir -p /opt/openclaw-auth
cd /opt/openclaw-auth
```

示例 `docker-compose.yml`：

```yaml
version: "3"

services:
  mysql:
    image: mysql:8
    container_name: casdoor-mysql
    environment:
      MYSQL_ROOT_PASSWORD: "CHANGE_ME_DB_PASSWORD"
      MYSQL_DATABASE: casdoor
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 3s
      retries: 10

  casdoor:
    image: casbin/casdoor:latest
    container_name: casdoor
    ports:
      - "8000:8000"
    environment:
      RUNNING_IN_DOCKER: "true"
      driverName: mysql
      dataSourceName: "root:CHANGE_ME_DB_PASSWORD@tcp(mysql:3306)/"
      dbName: casdoor
    depends_on:
      mysql:
        condition: service_healthy
    restart: unless-stopped

  oauth2-proxy:
    image: quay.io/oauth2-proxy/oauth2-proxy:latest
    container_name: oauth2-proxy
    ports:
      - "4180:4180"
    environment:
      OAUTH2_PROXY_PROVIDER: oidc
      OAUTH2_PROXY_OIDC_ISSUER_URL: "http://<LAN_IP>:8000"
      OAUTH2_PROXY_CLIENT_ID: "CHANGE_ME_CASDOOR_CLIENT_ID"
      OAUTH2_PROXY_CLIENT_SECRET: "CHANGE_ME_CASDOOR_CLIENT_SECRET"
      OAUTH2_PROXY_REDIRECT_URL: "http://<LAN_IP>/oauth2/callback"
      OAUTH2_PROXY_COOKIE_SECRET: "CHANGE_ME_COOKIE_SECRET"
      OAUTH2_PROXY_COOKIE_SECURE: "false"
      OAUTH2_PROXY_EMAIL_DOMAINS: "*"
      OAUTH2_PROXY_SET_XAUTHREQUEST: "true"
      OAUTH2_PROXY_UPSTREAMS: "static://202"
      OAUTH2_PROXY_HTTP_ADDRESS: "0.0.0.0:4180"
      OAUTH2_PROXY_SKIP_PROVIDER_BUTTON: "true"
      OAUTH2_PROXY_INSECURE_OIDC_ALLOW_UNVERIFIED_EMAIL: "true"
      OAUTH2_PROXY_INSECURE_OIDC_SKIP_ISSUER_VERIFICATION: "true"
    depends_on:
      - casdoor
    restart: unless-stopped

volumes:
  mysql_data:
```

生成 oauth2-proxy cookie secret：

```bash
openssl rand -hex 16
```

这个命令会生成 32 个十六进制字符。不要用 `openssl rand -base64 32`，它输出 44 个字符，oauth2-proxy 会因为长度不符合 16/24/32 bytes 而启动失败。

先启动 Casdoor：

```bash
docker compose up -d casdoor
```

### Step 3：配置 Casdoor

打开：

```text
http://<LAN_IP>:8000
```

默认账号通常是 `admin` / `123`，首次登录后应立即修改密码。

#### 3.1 创建独立组织

不要直接用 `built-in` 组织做第三方登录。`built-in` 组织里的用户是全局管理员，Casdoor 默认会限制这类自动注册。

创建一个独立组织，例如：

```text
openclaw-users
```

#### 3.2 添加飞书 Provider

在 Casdoor 里添加 Provider：

| 字段 | 示例 |
| --- | --- |
| Category | OAuth |
| 类型 | Lark |
| 组织 | `openclaw-users` |
| 名称 | `feishu-login` |
| 客户端 ID | 飞书 App ID |
| 客户端密钥 | 飞书 App Secret |

Casdoor 的 Lark provider 已经内置飞书相关端点，一般不需要手动填写 authorize/token/userinfo URL。

#### 3.3 创建 Application

创建给 oauth2-proxy 使用的 Application：

| 字段 | 示例 |
| --- | --- |
| 名称 | `openclaw-web` |
| 组织 | `openclaw-users` |
| Provider | `feishu-login` |
| Redirect URL | `http://<LAN_IP>/oauth2/callback` |

Provider 配置中要打开：

- 可用于登录
- 可用于注册

否则第一次飞书登录时，Casdoor 不能自动创建关联用户，会报“不允许通过 Lark 注册新账户”。

保存 Application 后，记录 Casdoor 生成的 Client ID 和 Client Secret，填回 oauth2-proxy 的环境变量。

最后启动全部服务：

```bash
docker compose up -d
```

验证 OIDC discovery：

```bash
curl http://<LAN_IP>:8000/.well-known/openid-configuration
```

正常情况下会看到 `authorization_endpoint`、`token_endpoint`、`jwks_uri` 等字段。

### Step 4：配置 nginx

示例配置：

```nginx
server {
    listen 80;

    location /oauth2/ {
        proxy_pass http://127.0.0.1:4180;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    location = /oauth2/auth {
        internal;
        proxy_pass http://127.0.0.1:4180;
        proxy_pass_request_body off;
        proxy_set_header Content-Length "";
        proxy_set_header X-Original-URI $request_uri;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    location / {
        auth_request /oauth2/auth;
        auth_request_set $user $upstream_http_x_auth_request_email;

        proxy_set_header X-Forwarded-User $user;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_pass http://127.0.0.1:18789;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    error_page 401 = /oauth2/sign_in;
}
```

配置好后：

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5：配置 OpenClaw Gateway

关键点是让 Gateway 只信任来自 nginx 的本机请求，并从指定 header 读取用户身份：

```bash
openclaw config set gateway.bind loopback
openclaw config set gateway.trustedProxies '["127.0.0.1"]'
openclaw config set gateway.auth.mode trusted-proxy
openclaw config set gateway.auth.trustedProxy.userHeader x-forwarded-user

# 可选：只允许特定邮箱访问
# openclaw config set gateway.auth.trustedProxy.allowUsers '["alice@example.com"]'

openclaw gateway restart
```

如果不设置 `allowUsers`，通过飞书认证的人都可以进入，实际范围由飞书应用的可用范围控制。更稳妥的做法是：

- 飞书侧限制应用可用范围，例如只开放给某个部门或团队
- Gateway 侧按需再加 `allowUsers`

## 常见问题

### 1. 浏览器显示 502 Bad Gateway

如果 nginx error log 里有：

```text
upstream sent too big header while reading response header from upstream
```

一般是 oauth2-proxy 的 session cookie 太大，超过 nginx 默认 buffer。把下面配置加到 `/oauth2/` 和 `/oauth2/auth` 两个 location：

```nginx
proxy_buffer_size 128k;
proxy_buffers 4 256k;
proxy_busy_buffers_size 256k;
```

然后重新加载 nginx。

### 2. oauth2-proxy 报 `neither the id_token nor the profileURL set an email`

这说明 oauth2-proxy 没拿到邮箱。常见原因：

1. 飞书应用没有开通 `contact:user.email:readonly`
2. 权限开通后没有重新发布应用版本
3. 当前飞书账号本身没有邮箱
4. Casdoor 已经缓存/创建了一个无邮箱用户

可以按顺序排查：

```bash
docker compose logs --tail 30 oauth2-proxy
```

再查 Casdoor 用户表中的 email 是否为空：

```bash
docker compose exec mysql mysql -uroot -pCHANGE_ME_DB_PASSWORD casdoor \
  -e "SELECT owner, name, display_name, email, lark FROM user;"
```

如果确认用户已经以空邮箱创建，修复飞书侧邮箱或权限后，需要删除 Casdoor 中对应用户，再重新登录。

### 3. Casdoor 提示“不允许通过 Lark 注册新账户”

这是 Application 的 Provider 配置里没有打开“可用于注册”。

解决：Casdoor → Application → Provider，找到飞书 Provider，把“可用于注册”和“可用于登录”都打开。

### 4. Casdoor 提示不能向 `built-in` 组织添加用户

不要把第三方登录用户放到 `built-in` 组织。创建独立组织，例如 `openclaw-users`，并确保 Application 和 Provider 都属于这个组织。

### 5. `OIDC_ISSUER_URL` 不能写 Docker 服务名

虽然 oauth2-proxy 容器内可以访问 `http://casdoor:8000`，但 discovery 文档里的 URL 会被浏览器使用。

如果配置成：

```yaml
OAUTH2_PROXY_OIDC_ISSUER_URL: "http://casdoor:8000"
```

Casdoor 可能返回：

```json
"authorization_endpoint": "http://casdoor:8000/login/oauth/authorize"
```

浏览器在局域网里解析不了 `casdoor` 这个 Docker 内部服务名，登录会失败。

所以应该使用浏览器也能访问的地址：

```yaml
OAUTH2_PROXY_OIDC_ISSUER_URL: "http://<LAN_IP>:8000"
OAUTH2_PROXY_REDIRECT_URL: "http://<LAN_IP>/oauth2/callback"
```

可以用下面命令确认 discovery 文档里的 endpoint 是否正确：

```bash
curl -s http://<LAN_IP>:8000/.well-known/openid-configuration
```

### 6. 页面显示 `origin not allowed`

这通常不是 OAuth 问题，而是 Web UI 后端做了 origin 校验。

把浏览器实际访问的 origin 加到 Gateway 的 allowed origins 中。例如：

```text
http://<LAN_IP>
```

然后重启 Gateway。

## 安全注意事项

这套方案适合“局域网内 Web UI + 企业账号准入”的场景，但需要注意：

1. **Gateway 应只监听 loopback**

   外部请求必须先经过 nginx。否则攻击者可以绕过 nginx，直接访问 Gateway。

2. **trusted proxy 列表要收窄**

   只信任 `127.0.0.1` 或明确的反代 IP，不要信任整个局域网网段。

3. **不要把示例 secret 原样用于生产**

   数据库密码、oauth2-proxy cookie secret、Casdoor client secret 都要单独生成。

4. **飞书侧要限制应用可用范围**

   如果 Gateway 没有配置 `allowUsers`，那么准入范围主要由飞书应用可用范围决定。

5. **公网场景建议上 HTTPS**

   本文示例是局域网 HTTP。如果放到公网或跨不可信网络访问，应使用 HTTPS，并把 cookie secure 打开。

## 总结

这次实践里最关键的点有三个：

1. 飞书 OAuth 不是 OIDC，不能直接作为 oauth2-proxy 的 OIDC issuer。
2. Casdoor 可以把飞书 OAuth 适配成标准 OIDC，让 oauth2-proxy 正常工作。
3. trusted-proxy 模式的本质是：后端服务不自己处理登录，只信任反向代理传来的用户身份 header。

理解这三点后，整个链路就比较清晰了：飞书负责企业身份，Casdoor 负责协议适配，oauth2-proxy 负责登录态，nginx 负责认证拦截和 header 转发，Gateway 只读取可信代理注入的用户身份。

## 参考链接

- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [飞书开放平台](https://open.feishu.cn/)
- [Casdoor 官方文档](https://casdoor.org/docs/overview)
- [Casdoor Lark Provider](https://casdoor.org/docs/provider/oauth/lark/)
- [oauth2-proxy 配置文档](https://oauth2-proxy.github.io/oauth2-proxy/configuration/overview/)
- [oauth2-proxy OIDC Provider](https://oauth2-proxy.github.io/oauth2-proxy/configuration/providers/openid_connect/)
