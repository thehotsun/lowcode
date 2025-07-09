<template>
  <el-dialog
    v-draggable
    :visible.sync="visible"
    title="提交字段设置"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="40%"
    append-to-body
    class="fieldRenameDlg"
  >
    <el-table ref="tableRef" :data="fieldConversions" height="600px" size="small" border highlight-current-row @selection-change="handleSelectionChange">
      <el-table-column type="selection" :selectable="selectable" width="55" align="center"> </el-table-column>
      <el-table-column prop="fieldName" label="显示名称" width="180" sortable></el-table-column>
      <el-table-column prop="fieldCode" label="字段名称" width="180" sortable></el-table-column>
      <el-table-column label="重命名">
        <template slot-scope="scope">
          <el-input v-model="scope.row.renamed" placeholder="请输入内容" @blur="validateInput(scope.row)"></el-input>
          <div v-show="scope.row.errorMessage" style="color: #f56c6c;font-size: 12px;">{{ scope.row.errorMessage }}</div>
        </template>
      </el-table-column>
    </el-table>
    <div slot="footer" class="dialog-footer">
      <div>
        提示：主键字段必选，不可取消
      </div>
      <div>
        <el-button size="mini" @click="visible = false">取 消</el-button>
        <el-button size="mini" type="primary" @click="confirmRename">确 定</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
export default {
  data() {
    return {
      visible: false,
      fieldConversions: [],
      multipleSelection: []
    };
  },
  methods: {
    async openDialog(fieldArr) {
      this.fieldConversions = fieldArr;
      this.visible = true;
      await this.$nextTick();
      this.fieldConversions.map((item, index) => {
        if (!index) {
          this.$refs.tableRef.toggleRowSelection(item, true);
        } else if (item.isSelected) {
          this.$refs.tableRef.toggleRowSelection(item, true);
        }
      });
    },
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },

    confirmRename() {
      if (this.multipleSelection.some(item => item.errorMessage)) {
        return this.$warn("请处理非法的重命名字段！");
      }

      this.$emit("confirm", this.multipleSelection);
      this.visible = false;
    },

    validateInput(row) {
      const value = row.renamed;
      row.errorMessage = ""; // 重置错误信息
      if ([undefined, ""].includes(value)) return;
      const isValid = this.isValidVariableName(value);
      if (!isValid) {
        row.errorMessage = "只允许输入字母、数字、下划线，且不能以数字开头";
      }
    },

    isValidVariableName(variableName) {
      // 正则表达式判断是否是合法的变量名
      const regex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
      return regex.test(variableName);
    },

    selectable(row, index) {
      return !!index;
    }
  }
};
</script>

<style scoped lang="less">
.fieldRenameDlg {
  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .w200 {
    width: 200px;
  }
}
</style>
