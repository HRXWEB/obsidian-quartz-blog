---
title:
draft:
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-12T16:05:35.3535+08:00
---

从这个 [https://github.com/opencv/opencv/blob/082cd7a74eab9a435c414e4fe7a5c0803d4d3b4d/platforms/wince/readme.md?plain=1#L30](https://github.com/opencv/opencv/blob/082cd7a74eab9a435c414e4fe7a5c0803d4d3b4d/platforms/wince/readme.md?plain=1#L30)

可以看出有很多选项用于控制 opencv 的module

```bash
-DBUILD_EXAMPLES=OFF `
-DBUILD_opencv_apps=OFF `
-DBUILD_opencv_calib3d=OFF `
-DBUILD_opencv_highgui=OFF `
-DBUILD_opencv_features2d=OFF `
-DBUILD_opencv_flann=OFF `
-DBUILD_opencv_ml=OFF `
-DBUILD_opencv_objdetect=OFF `
-DBUILD_opencv_photo=OFF `
-DBUILD_opencv_shape=OFF `
-DBUILD_opencv_stitching=OFF `
-DBUILD_opencv_superres=OFF `
-DBUILD_opencv_ts=OFF `
-DBUILD_opencv_video=OFF `
-DBUILD_opencv_videoio=OFF `
-DBUILD_opencv_videostab=OFF `
-DBUILD_opencv_dnn=OFF `
-DBUILD_opencv_java=OFF `
-DBUILD_opencv_python2=OFF `
-DBUILD_opencv_python3=OFF `
-DBUILD_opencv_java_bindings_generator=OFF `
-DBUILD_opencv_python_bindings_generator=OFF `
-DBUILD_TIFF=OFF `
-DCV_TRACE=OFF `
-DWITH_OPENCL=OFF `
-DHAVE_OPENCL=OFF `
-DWITH_QT=OFF `
-DWITH_GTK=OFF `
-DWITH_QUIRC=OFF `
-DWITH_JASPER=OFF `
-DWITH_WEBP=OFF `
-DWITH_PROTOBUF=OFF `
-DBUILD_SHARED_LIBS=OFF `
-DWITH_OPENEXR=OFF `
-DWITH_TIFF=OFF `
```

另外 [https://discourse.cmake.org/t/fetchcontent-and-find-package-args-not-linking-correctly/10653](https://discourse.cmake.org/t/fetchcontent-and-find-package-args-not-linking-correctly/10653) 可以看出有很多 include 目录需要添加

每一个目录都对应了一个 library，比如：

`${OPENCV_MODULE_opencv_highgui_LOCATION}/``include` **对应** `opencv_highgui` **这个库**