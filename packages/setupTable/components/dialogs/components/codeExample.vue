<template>
  <div>
    <div>函数示例</div>
    <js-code-editor ref="chEditor" v-model="value" mode="javascript" :readonly="true" display-height="200px"></js-code-editor>
    <el-button type="text" @click="handleCopy">复制</el-button>
  </div>
</template>

<script>
export default {
  props: {
    val: {
      type: String,
      default() {
        return "";
      }
    }
  },
  data() {
    return {
      value: this.val
    };
  },
  watch: {
    val(val) {
      this.value = val;
      this.$refs.chEditor.aceEditor.setOptions({
        value: val
      });
      this.$refs.chEditor.codeValue = val;
    }
  },
  methods: {
    handleCopy() {
      this.$emit("copy", this.val);
    }
  }
};
</script>
