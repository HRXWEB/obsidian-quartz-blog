---
title: 图像缩放对相机内外参的影响：数学推导与参数变换
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:26.2626+08:00
updated: 2025-10-28T09:52:11.1111+08:00
---

# 结论

> [!important] 忽略 “0.5 像素问题”

假设缩放系数是 s，则：

1. ==内参矩阵==

    $$
    K' = \begin{bmatrix}s_1 f_x & 0       & s_1 c_x \\0       & s_2 f_y & s_2 c_y \\0       & 0       & 1\end{bmatrix}
    $$

2. ==外参不变==
3. ==畸变系数不变==

# 推导

设3D空间中的点 ( x , y , z ) 投影到图像上的像素坐标（连续值，以左上角像素的左上角为原点的坐标系，注意与整数值的图像像素索引相区别） 为 (u, v) ，深度为 d，图像内参 $I$，外参为 $E$

$$
\begin{equation}\begin{bmatrix}ud \\vd \\d\end{bmatrix}= I_{3 \times 3} E_{3 \times 4}\begin{bmatrix}x \\y \\z \\1\end{bmatrix}\end{equation}
$$

记：

$$
I_{3 \times 3} E_{3 \times 4} = M_{3 \times 4} = \begin{bmatrix}m_1 \\m_2 \\m_3\end{bmatrix}, P = \begin{bmatrix}x \\y \\z \\1\end{bmatrix}
$$

其中 $m_i \in \mathbb{R}^{1 \times 4}$，易得：

$$
\begin{aligned}  
ud &= m_1 P \\  
vd &= m_2 P \\  
d &= m_3 P  
\end{aligned}
$$

## 图像缩放

![image.png](https://cdn.jsdelivr.net/gh/hrxweb/obsidian-images/img/20250926182523803.png)

1. 对于3D空间中的同一个点，其投影到缩放前后图像上的相对位置是相同的（图中黄点）。换句话说，若以左上角像素的左上角为原点建立图像坐标系，其在缩放前后图像中的坐标（分别记为 $(u, v )$ 和 $(u ′, v ′)$ ），二者之比即为 $( \frac{1}{s_1}, \frac{1}{s_2})$
2. 由深度的几何（物理）含义可知同一个点在缩放前后图像中的深度不变

因此：

$$
\left\{\begin{aligned}ud &= s_1 ud' = m_1' P \\vd &= s_2 vd' = m_2' P \\d &= d' = m_3' P\end{aligned}\right.
$$

可知：

$$
m_1' = s_1 m_1, \quad m_2' = s_2 m_2
$$

故结论为：**图像缩放时，内外参矩阵之积的第一行需要乘上宽的缩放因数，第二行需要乘上高的缩放因数**。==**而外参矩阵不会随图像缩放变化。**==

进一步结论为：

原内参矩阵：

$$
K = \begin{bmatrix}f_x & 0   & c_x \\0   & f_y & c_y \\0   & 0   & 1\end{bmatrix}
$$

现内参矩阵：

$$
K' = \begin{bmatrix}s_1 f_x & 0       & s_1 c_x \\0       & s_2 f_y & s_2 c_y \\0       & 0       & 1\end{bmatrix}
$$

# 参考资料：

1. [https://blog.csdn.net/weixin_45657478/article/details/129423877](https://blog.csdn.net/weixin_45657478/article/details/129423877)
2. [https://zhuanlan.zhihu.com/p/87185139](https://zhuanlan.zhihu.com/p/87185139)
3. [https://answers.opencv.org/question/118918/does-the-resolution-of-an-image-affect-the-distortion-co-efficients/](https://answers.opencv.org/question/118918/does-the-resolution-of-an-image-affect-the-distortion-co-efficients/)