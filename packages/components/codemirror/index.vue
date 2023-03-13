<template>
  <codemirror ref="chartOption" :value="mirrorCode" :options="cmOptions" @change="codeChange">
  </codemirror>
</template>
 
 
<script>
import { codemirror } from 'vue-codemirror' // 引入组件
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/base16-light.css' //主题
import 'codemirror/mode/javascript/javascript.js' //
//定义
export default {
  name: "codemirror",
   model: {
    prop: 'mirrorCode',
    event: 'change'
  },
  components: {
    codemirror // 声明组件
  },
  props: {
    mirrorCode: String
  },
  data () {
    return {
      cmOptions: {
        tabSize: 2,
        mode: 'text/javascript',
        theme: 'base16-light', // 主题
        lineNumbers: true,
        line: true,
      },
    }
  },
  methods: {
    codeChange (val) {
      this.$emit('change', val)
    }
  }
}
</script>

 
