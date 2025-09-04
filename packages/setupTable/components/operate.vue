<template>
  <div class="top">
    &nbsp;
    <div class="operate">
      <el-button size="mini" @click="handleTableSetting">列表页设置</el-button>
      <slot name="btn"></slot>
      <el-button size="mini" @click="showTableAttrs">表格属性设置</el-button>
      <el-button size="mini" @click="showPreview">预览</el-button>
      <el-button size="mini" @click="jumpResource">权限设置</el-button>
      <el-dropdown @command="handleImport">
        <el-button size="mini">导入</el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="btn">仅按钮</el-dropdown-item>
          <el-dropdown-item command="all">全部</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      <el-dropdown @command="handleExport">
        <el-button size="mini">导出</el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="btn">仅按钮</el-dropdown-item>
          <el-dropdown-item command="all">全部</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>

      <el-button :loading="loading" size="mini" type="primary" @click="handleSave">保存</el-button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    disposeShowTableSetting: {
      type: [Boolean, Function],
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  inject: ["showTableSetting"],
  computed: {
    handleTableSetting() {
      return this.disposeShowTableSetting || this.showTableSetting;
    }
  },
  methods: {
    async handleSave() {
      this.$emit("handleSave");
    },
    showTableAttrs() {
      this.$emit("showTableAttrs");
    },
    showPreview() {
      this.$emit("showPreview");
    },
    jumpResource() {
      this.$emit("jumpResource");
    },
    handleImport(command) {
      this.$emit("handleImport", command);
    },
    handleExport(command) {
      this.$emit("handleExport", command);
    }
  }
};
</script>

<style lang="less" scoped>
.top {
  display: flex;
  justify-content: space-between;
  padding: 0 30px;
  align-items: center;
  background: #fff;
  height: 30px;
}
</style>
