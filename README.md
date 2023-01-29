# 基础版utils/commonRender如不会使用，请先去查看此文件夹下的example，如想使用commonRender请先确保你的项目能够使用jsx，如何配置jsx请看下面。

# 如何在vue2中使用jsx

1. 找到babel.config.js 添加配置如下 
  module.exports = {
    presets: [
      '@vue/cli-plugin-babel/preset',
      ['@vue/babel-preset-jsx',
        {


          'injectH': false
        }]
    ]
  }

2. 安装依赖 npm install @vue/babel-preset-jsx @vue/babel-helper-vue-jsx-merge-props


# 基础版代码规范

1. 允许父组件通过 ref 得方式获取子组件实例及实例上得数据，但修改只允许通过调用子组件相应的 set 方法修改子组件数据

2. 所有组件如果提供被外部（父）组件调用的方法，命名以 expose_开头，全部写在 methods 的最前方，且方法体只允许调用组件内的方法，不允许有其他逻辑（方便解耦）
   示例
      expose_getForm () {
        return this.getForm()
      },
      expose_resetForm () {
        this.resetForm();
      },
      getForm () {
        return this.form
      },
      resetForm () {
        this.form = new Form();
      },

3. 组件选项顺序（组件这种重要且行数较少的放头部，所有可直接通过 this 访问的数据放在一起, methods 一般是最大的一个对象，所以放在最后面）

- components
- props
- data
- computed
- created
- mounted
- watch
- metods

4. 组件命名规范
   PascalCase (单词首字母大写命名)是最通用的声明约定
   kebab-case (短横线分隔命名) 是最通用的使用约定
   如果是和父组件强耦合的组件，子组件的命名应该以父组件命名为开头(文件排序是按照字母顺序排列的，这样所有的相关组件都会挨着排序，一目了然)
      示例：
        parent： MyBox
        children: MyBoxBtn MyBoxForm

5. 引入依赖
   除强相关的某组件下的 components 文件夹外，其他的所有引用都尽量通过绝对路径引用（这样在全局搜索所有引用此组件的时候很方便）

6. 各组件中重要函数或者类说明，特殊情况的代码处理说明,

7. 凡是提供相关公共组件，请提供使用示例

8. es6 相关
   8.1 定义变量使用 let ,定义常量使用 const
   8.2 静态字符串一律使用单引号或反引号，动态字符串使用反引号
   8.3 优先使用箭头函数
   8.4 如果模块只有一个输出值，就使用 export default，如果模块有多个输出值，就不使用 export default，export default 与普通的 export 不要同时使用

9. 无用变量和方法及时删除，保持代码整洁


10. 建议使用pnpm代替npm， 全局安装pnpm ， 所有的命令都是用pnpm代替npm即可，如pnpm i ， pnpm run serve ，pnpm run build。 为什么使用pnpm？具体参见 https://zhuanlan.zhihu.com/p/419399115


11. 建议methods里面所有的方法之间都空一行