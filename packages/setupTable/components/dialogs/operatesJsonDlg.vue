<template>
  <el-dialog v-if="visible" v-dialog-drag v-bind="mergedDialogAttrs" :visible.sync="visible" :title="title" @close="handleDialogClose">
    <el-alert v-if="type === 'import'" type="info" title="导入的JSON内容须符合下述格式，以保证顺利导入." show-icon class="alert-padding"></el-alert>
    <js-code-editor ref="chEditor" v-model="jsonContent" :mode="'json'" :readonly="type === 'export'" :display-height="displayHeight"></js-code-editor>
    <div slot="footer" class="dialog-footer">
      <el-button v-if="type === 'import'" type="primary" @click="doJsonImport"> 导入</el-button>
      <el-button v-if="type === 'export'" v-clipboard:copy="jsonContent" v-clipboard:success="onCopy" v-clipboard:error="onError" type="primary" class="copy-json-btn">
        复制JSON
      </el-button>
      <el-button v-if="type === 'export'" @click="saveFormJson">保存为文件</el-button>
      <el-button type="" @click="visible = false"> 关闭</el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: "OperatesJsonDialog",
  props: {
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
      visible: false,
      // 默认对话框配置
      defaultDialogAttrs: {
        title: "代码编写",
        width: "900px",
        appendToBody: true,
        beforeClose: this.handleDialogClose
      },
      jsonContent: "",
      type: "import"
    };
  },
  computed: {
    // 合并后的对话框属性（默认 + 传入）
    mergedDialogAttrs() {
      return {
        ...this.defaultDialogAttrs,
        ...this.dialogAttrs
      };
    },
    title() {
      return this.type === "import" ? "导入JSON" : "导出JSON";
    }
  },
  methods: {
    open(json, type) {
      this.visible = true;
      this.jsonContent = JSON.stringify(json, null, "  ");
      this.type = type;
    },
    // 暴露编辑器实例方法
    getEditorInstance() {
      return this.$refs.chEditor;
    },
    handleDialogClose() {
      this.visible = false;
    },
    onCopy() {
      this.$message.success("复制成功");
    },
    onError() {
      this.$message.error("复制失败");
    },

    doJsonImport() {
      this.$emit("importComfirm", this.jsonContent);
      this.visible = false;
    },

    saveFormJson() {
      this.exportConfig(this.jsonContent);
    },
    exportConfig(jsonData) {
      const blob = new Blob([jsonData], { type: "application/json" });

      // 创建下载链接
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "config.json";
      document.body.appendChild(link);
      link.click();

      // 清理
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }
  }
};
</script>

<style scoped>
.code-editor-dialog {
  /* 自定义对话框样式 */
}
</style>
