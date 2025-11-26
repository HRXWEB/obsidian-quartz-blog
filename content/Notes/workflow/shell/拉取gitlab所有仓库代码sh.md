---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

```python
# -*- coding: UTF-8 -*-
 
# 在Python3.0测试通过
# 需要在gitlab里面新建一个AccessToken填入gitlabToken
 
import sys
if sys.version_info < (3, 0):
    import urllib
else:
    from urllib.request import urlopen
 
import json
import subprocess, shlex
import time
import os
 
gitlabAddr  = '201.1.2.115:8099'         #git的地址
gitlabToken = 'Nzyg92-123456aa4ay__y'    #gitlab的token，在gitlab的设置里有生产临时token
 
for index in range(10):
    url     = "http://%s/api/v4/projects?private_token=%s&per_page=100&page=%d&order_by=name" % (gitlabAddr, gitlabToken, index)
    print(url)
    
    if sys.version_info < (3, 0):
        allProjects     = urllib.urlopen(url)
    else:
        allProjects     = urlopen(url)
        
    allProjectsDict = json.loads(allProjects.read().decode(encoding='UTF-8'))
    if len(allProjectsDict) == 0:
        break
    for thisProject in allProjectsDict: 
        try:
            thisProjectURL  = thisProject['http_url_to_repo']
            thisProjectPath = thisProject['path_with_namespace']
            print(thisProjectURL + ' ' + thisProjectPath)
            
            if os.path.exists(thisProjectPath):
                command     = shlex.split('git -C "%s" pull' % (thisProjectPath))
            else:
                command     = shlex.split('git clone %s %s' % (thisProjectURL, thisProjectPath))
            
            resultCode  = subprocess.Popen(command)
            time.sleep(0.5)
        except Exception as e:
            print("Error on %s: %s" % (thisProjectURL, e.strerror))
```

修改：

- `gitlabAddr`
- `gitlabToken`

# 参考

1. [https://www.cnblogs.com/duanxz/p/14987759.html](https://www.cnblogs.com/duanxz/p/14987759.html)