<template>
  <el-dialog v-dialog-drag v-bind="mergedDialogAttrs" :visible.sync="visible" @close="handleDialogClose">
    <js-code-editor ref="chEditor" v-model="jsvalue" :mode="editorMode" :readonly="readonly" :display-height="displayHeight"></js-code-editor>
    <codeExample v-if="showExample && !useTabLayout" :val="codeExampleVal" @copy="handleCopy"></codeExample>
    <el-tabs v-if="showExample && useTabLayout" v-model="activeName">
      <el-tab-pane v-for="(item, index) in exampleList" :key="index" :label="item.label" :name="index + ''">
        <codeExample :val="item.codeExampleVal" @copy="handleCopy"></codeExample>
      </el-tab-pane>
    </el-tabs>
    <span slot="footer" class="dialog-footer">
      <el-button size="small" @click="handleDialogClose">取消</el-button>
      <el-button size="small" type="primary" @click="handleDialogConfirm">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import codeExample from "/packages/setupTable/components/dialogs/components/codeExample.vue";
export default {
  name: "CodeEditorDialog",
  components: {
    codeExample
  },
  props: {
    useTabLayout: {
      type: Boolean,
      default: false
    },
    modelValue: {
      type: String,
      required: true
    },
    showExample: {
      type: Boolean,
      default: true
    },
    codeExampleVal: {
      type: String,
      required: false
    },
    exampleList: {
      type: Array
    },
    displayHeight: {
      type: String,
      required: false,
      default: "600px"
    },
    dialogAttrs: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      activeName: "0",
      visible: true,
      // 默认对话框配置
      defaultDialogAttrs: {
        title: "代码编写",
        width: "900px",
        appendToBody: true,
        beforeClose: this.handleDialogClose
      },
      // 编辑器固定配置
      editorMode: "javascript",
      readonly: false,
      jsvalue: this.modelValue
    };
  },
  computed: {
    // 合并后的对话框属性（默认 + 传入）
    mergedDialogAttrs() {
      return {
        ...this.defaultDialogAttrs,
        ...this.dialogAttrs
      };
    }
  },
  methods: {
    // // 代码变化处理
    // handleCodeChange(newCode) {
    //   this.$emit("code-change", newCode);
    // },
    // // 更新数据模型
    // updateModelValue(value) {
    //   this.$emit("update:modelValue", value);
    // },
    handleCopy() {
      if (this.useTabLayout) {
        this.jsvalue = this.exampleList[this.activeName].codeExampleVal;
      } else {
        this.jsvalue = this.codeExampleVal;
      }
    },
    // 对话框关闭处理

    handleDialogClose() {
      this.$emit("close");
    },
    handleDialogConfirm() {
      this.$emit("confirm", this.jsvalue);
      this.$emit("close");
    },
    // 暴露编辑器实例方法
    getEditorInstance() {
      return this.$refs.chEditor;
    }
  }
};
</script>

<style scoped>
.code-editor-dialog {
  /* 自定义对话框样式 */
}
</style>
