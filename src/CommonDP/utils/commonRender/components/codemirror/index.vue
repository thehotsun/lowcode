<template>
  <div class="wrap">
    <codemirror v-if="showCodemirror" ref="jsonEditor" v-model="jsCode" :options="cmOptions" />
  </div>
</template>

<script>
import { codemirror } from 'vue-codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/keymap/sublime'; // sublime编辑器效果
import "codemirror/theme/dracula.css";// 配置里面也需要theme设置为monokai
import "codemirror/mode/vue/vue.js"; // 配置里面也需要mode设置为vue
import 'codemirror/addon/selection/active-line'; // 光标行背景高亮，配置里面也需要styleActiveLine设置为true
export default {
  components: {
    codemirror
  },
  data () {
    return {
      showCodemirror: false,
      jsCode: '',
      cmOptions: {
        tabSize: 4, // tab的空格个数
        theme: 'dracula', // 主题样式
        lineNumbers: true, // 是否显示行数
        lineWrapping: true, // 是否自动换行
        styleActiveLine: true, // line选择是是否加亮
        matchBrackets: true, // 括号匹配
        mode: "vue", // 实现javascript代码高亮
        readOnly: false// 只读
      },
    }
  },
  methods: {
    expose_showEdit () { this.showCodemirror = true },
    expose_hiddenEdit () { this.showCodemirror = false },
  }
}
</script>