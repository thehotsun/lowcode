常见问题汇总

Q: classname 是否受 scoped 的影响是否生效
A: 父组件的 style 如果有 scoped 标志，确实会导致 class 不生效，但是可以使用/deep/进行穿透，也可以达成效果。

Q: 原生事件如何传递？
A: 方法写在 listeners 中，去掉 on 使用 on 后面的名字作为属性名，

Q: 原生标签某些特殊属性怎么传递？
A: 所有想传递的属性写在 tagAttrs 中

Q: 如何使用一些必须通过接口才能获取来的数据对 formOptions 进行赋值
A: 最简单的还是通过$set，这样数据就会变为响应式的，会自动出发 baserenderform 组件的重新渲染,否则要在 formOptions 中提前声明好要赋值的属性名

Q: 使用自定义组件时如何对formData进行修改？
A: 首先自定义组件能够获取到整个的formdata对象，可以满足多种状态下的不同展示和逻辑。其次由于formdata是由父组件传递给baserenderform的，因此建议自定义组件直接使用emit选项在父组件中进行事件通信从而改变formdata的属性值，具体示例请看example下的formExample组件
