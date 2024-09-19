<template>
  <el-dialog :visible.sync="visible" title="提交字段设置" :close-on-click-modal="false" :close-on-press-escape="false" width="40%" append-to-body>
    <el-table ref="tableRef" :data="fieldConversions" height="600px" size="small" border highlight-current-row @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55"> </el-table-column>
      <el-table-column prop="fieldName" label="显示名称" width="180"></el-table-column>
      <el-table-column prop="fieldCode" label="字段名称" width="180"></el-table-column>
      <el-table-column label="重命名">
        <template slot-scope="scope">
          <el-input v-model="scope.row.renamed" placeholder="请输入内容"></el-input>
        </template>
      </el-table-column>
    </el-table>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取 消</el-button>
      <el-button type="primary" @click="confirmRename">确 定</el-button>
    </span>
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
      this.fieldConversions.map(item => {
        if (item.isSelected) {
          this.$refs.tableRef.toggleRowSelection(item, true);
        }
      });
    },
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },

    confirmRename() {
      this.$emit("confirm", this.multipleSelection);
      this.visible = false;
    }
  }
};
</script>

<style scoped>
.dialog-footer {
  text-align: right;
}
.w200 {
  width: 200px;
}
</style>
