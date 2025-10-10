---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:27.2727+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

# 简单示例

```C++
// 文件 demo.cpp
\#include "crow.h"
\#include <iostream>

int main() {
    crow::SimpleApp app;

    // 定义一个处理GET请求的路由 /get-example
    CROW_ROUTE(app, "/get-example")([](){
        return crow::response("This is a response from a GET request.");
    });

    // 定义一个处理POST请求的路由 /post-example
    CROW_ROUTE(app, "/post-example")
    .methods("POST"_method)
    ([](const crow::request& req) {
        auto x = crow::json::load(req.body);
        if (!x)
            return crow::response(400, "Bad Request");

        std::string receivedData = x["data"].s();
        std::cout << "Received data: " << receivedData << std::endl;
        return crow::response("Received your data: " + receivedData);
    });

    app.port(8080).multithreaded().run();
}
```

# 编译&&运行

```C++
git clone https://github.com/CrowCpp/Crow.git
g++ -std=c++17 demo.cpp -o demo -I ./Crow/include -lpthread && ./demo
```

# 测试

```Shell
curl http://localhost:8080/get-example
>>>
This is a response from a GET request
>>>

curl -X POST http://localhost:8080/post-example -H "Content-Type: application/json" -d '{"data":"Hello, Crow!"}'
>>>
Received your data: Hello, Crow!
>>>
```