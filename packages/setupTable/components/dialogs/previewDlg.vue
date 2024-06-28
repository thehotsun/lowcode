<template>
  <el-dialog title="预览" :visible.sync="dialogVisiblePreview" :close-on-click-modal="false" :close-on-press-escape="false" width="90%" :before-close="handleClosePreview">
    <complete-table ref="table" class="preview" style="height:650px" :general-request="generalRequest"> </complete-table>
  </el-dialog>
</template>

<script>
import completeTable from "../../../completeTable";

export default {
  components: { completeTable },
  data() {
    return {
      dialogVisiblePreview: false,
      generalRequest: null
    };
  },
  inject: ["generalRequest"],
  methods: {
    handleClosePreview() {
      this.dialogVisiblePreview = false;
    },

    // 预览状态下，外部组件调用此方法
    showDlg(renderParams) {
      this.dialogVisiblePreview = true;
      this.$nextTick(() => this.$refs.table.expose_preview(renderParams));
    }
  }
};
</script>
