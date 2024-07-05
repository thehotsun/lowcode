<template>
  <el-dialog
    v-dialogDrag
    :title="title"
    :visible.sync="dialogVisible"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="920px"
    :before-close="handleClose"
    append-to-body
  >
    <div class="edit">
      <sql-code-editor ref="chEditor" mode="javascript" :value="sql" @input="changeSql" />
    </div>

    <span slot="footer" class="dialog-footer">
      <el-button size="small" @click="handleClose">取消</el-button>
      <el-button type="primary" size="small" @click="handleConfirm">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  props: {
    form: {
      type: Object,
      default() {
        return {};
      }
    },
    sqlField: {
      type: String,
      default: "sql"
    },
    sqlLabel: {
      type: String,
      default: "sql"
    },
    orderExprField: {
      type: String,
      default: "orderExpr"
    },
    orderExprLabel: {
      type: String,
      default: "sql排序"
    },
    title: {
      type: String,
      default: "sql"
    }
  },
  data() {
    return {
      dialogVisible: false,
      sql: ""
    };
  },
  methods: {
    showDlg() {
      this.sql = this.form[this.sqlField];
      this.dialogVisible = true;
    },
    handleClose() {
      this.dialogVisible = false;
      this.sql = "";
    },
    handleConfirm() {
      this.form[this.sqlField] = this.sql;
      this.handleClose();
    },
    changeSql(val) {
      this.sql = val;
    }
  }
};
</script>

<style lang="less" scoped>
.codemirror {
  line-height: 20px;
}
.flex {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
