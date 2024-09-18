<template>
  <el-dialog :visible.sync="visible" title="字段重命名" :close-on-click-modal="false" :close-on-press-escape="false" width="40%" append-to-body>
    <el-table :data="fieldConversions" style="width: 100%">
      <el-table-column prop="original" label="原始名称" width="180"></el-table-column>
      <el-table-column label="重命名为">
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
import { cloneDeep } from "lodash";
export default {
  data() {
    return {
      visible: false,
      fieldConversions: []
    };
  },
  methods: {
    openDialog(fieldArr) {
      this.fieldConversions = cloneDeep(fieldArr);
      this.visible = true;
    },
    confirmRename() {
      this.$emit("confirm", this.fieldConversions);
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
