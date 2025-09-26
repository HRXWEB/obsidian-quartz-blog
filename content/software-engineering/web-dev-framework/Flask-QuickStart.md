---
title: 
draft: 
aliases: 
tags: 
created: Wednesday, September 24th 2025, 4:54:27 pm
updated: Friday, September 26th 2025, 5:02:35 pm
---

related to [[Crow-QuickStart]]

```Python
from flask import Flask, request, jsonify

app = Flask(__name__)

# 定义一个处理GET请求的路由 /get-example
@app.route('/get-example', methods=['GET'])
def get_example():
    return "This is a response from a GET request.\n"

# 定义一个处理POST请求的路由 /post-example
@app.route('/post-example', methods=['POST'])
def post_example():
    data = request.get_json()
    if not data or 'data' not in data:
        return jsonify({"error": "Bad Request: Missing 'data' field"}), 400
    
    received_data = data['data']
    print(f"Received data: {received_data}")
    return jsonify({"message": f"Received your data: {received_data}"}), 200

if __name__ == '__main__':
    app.run(port=8080)
```