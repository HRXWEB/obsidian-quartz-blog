---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-10T18:10:20.2020+08:00
---

- [[#欧拉角与四元数]]
- [[#旋转正向]]
- [[#利用Eigen库进行旋转]]

# 欧拉角与四元数

- [ ] 要理解旋转欧拉角和四元数的关系。

# 旋转正向

绕轴旋转的正向，记住xyz这个顺序即可（提取以下每行的字符，不过是XYZ的滚筒排序）：

- 绕x轴旋转，由y到z是正向。
- 绕y轴旋转，由z到x是正向。
- 绕z轴旋转，由x到y是正向。

# 利用Eigen库进行旋转

采用Test的方式来理解Eigen库提供的绕轴旋转的功能，运行如下的代码可以观察到点绕着z轴旋转45度的效果：

```C++
\#include <opencv2/opencv.hpp>
\#include <Eigen/Dense>
\#include <Eigen/Geometry>
\#include <cmath>

// 绘制坐标轴
void DrawAxes(cv::Mat &img, const cv::Point2f &origin, float length, const cv::Scalar &color) {
    cv::Point2f x_end = origin + cv::Point2f(length, 0);
    cv::Point2f y_end = origin + cv::Point2f(0, length);
    cv::line(img, origin, x_end, color, 2);
    cv::putText(img, "x", x_end, cv::FONT_HERSHEY_SIMPLEX, 0.5, color, 2);
    cv::line(img, origin, y_end, color, 2);
    cv::putText(img, "y", y_end, cv::FONT_HERSHEY_SIMPLEX, 0.5, color, 2);
}

// 将四元数应用于点
cv::Point2f ApplyQuaternion(const Eigen::Quaterniond &q, const cv::Point2f &point) {
    Eigen::Vector3d v(point.x, point.y, 0);
    Eigen::Vector3d rotated = q * v;
    return cv::Point2f(rotated.x(), rotated.y());
}

int TestQuant() {
    // 创建一个空白图像
    cv::Mat img(500, 500, CV_8UC3, cv::Scalar(255, 255, 255));

    // 定义原点
    cv::Point2f origin(img.cols / 2, img.rows / 2);

    // 绘制初始坐标轴
    DrawAxes(img, origin, 230, cv::Scalar(0, 0, 255)); // 红色BGR

    // 创建一个绕 Z 轴旋转 45 度的四元数
    double angle = M_PI / 4; // 45 度
    Eigen::AngleAxisd rotation_z(angle, Eigen::Vector3d::UnitZ());
    Eigen::Quaterniond q(rotation_z);

    // 绘制旋转后的坐标轴
    cv::Point2f x_end_rotated = ApplyQuaternion(q, cv::Point2f(200, 0));
    cv::Point2f y_end_rotated = ApplyQuaternion(q, cv::Point2f(0, 200));
    std::cout << "x_end_rotated: " << x_end_rotated << std::endl;
    std::cout << "y_end_rotated: " << y_end_rotated << std::endl;
    cv::line(img, origin, x_end_rotated + origin, cv::Scalar(0, 255, 0), 2); // 绿色
    cv::putText(img, "x'", x_end_rotated + origin, cv::FONT_HERSHEY_SIMPLEX, 0.5, cv::Scalar(0, 255, 0), 2);
    cv::line(img, origin, y_end_rotated + origin, cv::Scalar(0, 255, 0), 2); // 绿色
    cv::putText(img, "y'", y_end_rotated + origin, cv::FONT_HERSHEY_SIMPLEX, 0.5, cv::Scalar(0, 255, 0), 2);

    // 显示图像
    cv::imshow("Quaternion Rotation", img);
    cv::waitKey(0);

    return 0;
}

int main() {
    TestQuant();
    return 0;
}
```

结果图：

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182641899.png)
