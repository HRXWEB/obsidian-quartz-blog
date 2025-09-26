# 如何在某个/目录修改时触发stage，[参考](https://docs.gitlab.com/ee/ci/yaml/#onlychanges--exceptchanges)

```YAML
docker build:
  script: docker build -t my-image:$CI_COMMIT_REF_SLUG .
  only:
    changes:
      - Dockerfile
      - docker/scripts/*
      - dockerfiles/**/*
      - more_scripts/*.{rb,py,sh}
```

- The Dockerfile file.
- Any of the files inside docker/scripts/ directory.
- Any of the files and subdirectories inside the dockerfiles directory.
- Any of the files with rb, py, sh extensions inside the more_scripts directory.