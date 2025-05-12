<template>
  <el-dialog
    v-dialogDrag
    title="内容构造器"
    :visible.sync="showDlg"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="800px"
    :before-close="handleClose"
    append-to-body
  >
    <div></div>

    <template #footer>
      <span class="dialog-footer">
        <el-button type="" size="mini" @click="handleClose">取消</el-button>
        <el-button type="primary" size="mini" @click="handleConfirm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
export default {
  props: {},
  data() {
    return {
      showDlg: false, // 补全变量
      fields: [] // 补全变量
    };
  },
  inject: {
    getTableDesignFields: {
      default: () => () => {
        console.warn("inject缺失getTableDesignFields!");
      }
    }
  },
  methods: {
    openDlg() {
      this.showDlg = true;
      const tableData = this.getTableDesignFields();
      console.log("tableData", tableData);
    },
    handleClose() {
      this.showDlg = false;
    },

    handleConfirm() {
      this.$emit("ok", this.currentContent);
      this.handleClose();
    }
  }
};
</script>

<style lang="less" scoped>
.btns {
  ::v-deep .el-button--mini {
    margin-left: 0px !important;
    margin-right: 10px;
  }
}
</style>
