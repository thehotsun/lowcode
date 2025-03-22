<template>
  <el-dialog
    v-dialogDrag
    :title="title"
    :visible.sync="dialogVisible"
    width="800px"
    append-to-body
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :before-close="cancel"
  >
    <el-table :data="tableData" style="width: 100%" border stripe :header-cell-style="{ background: '#f5f7fa', fontWeight: 'bold' }">
      <el-table-column prop="folderName" label="文件名称" width="300" align="left">
        <template slot-scope="{ row }">
          <i class="el-icon-document" style="margin-right: 8px; color: #409EFF"></i>
          {{ row.folderName }}
        </template>
      </el-table-column>

      <el-table-column prop="fileSize" label="大小" width="150" align="center">
        <template slot-scope="{ row }">
          {{ row.fileSize }}
        </template>
      </el-table-column>

      <el-table-column prop="checkInUser" label="上传人" width="120" align="center">
        <template slot-scope="{ row }">
          <span style="margin-left: 8px">{{ row.checkInUser }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="checkInDate" label="上传时间" width="200" align="center" sortable>
        <template slot-scope="{ row }">
          <i class="el-icon-time" style="margin-right: 5px"></i>
          {{ row.checkInDate }}
        </template>
      </el-table-column>
    </el-table>
    <div slot="footer" class="dialog-footer">
      <el-button @click="cancel">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  props: {},
  data() {
    return {
      dialogVisible: false,
      folderPath: "",
      tableData: []
    };
  },
  computed: {
    title() {
      return `文件列表：${this.folderPath}`;
    }
  },
  methods: {
    open(fileList, folderPath) {
      this.tableData = fileList;
      this.folderPath = folderPath;
      this.dialogVisible = true;
    },

    cancel() {
      this.tableData = [];
      this.folderPath = "";
      this.dialogVisible = false;
    }
  }
};
</script>

<style lang="less" scoped>
.option-group {
  border: 1px solid #f56c6c;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
}

.sub-options {
  margin-top: 15px;
  padding: 10px;
  border: 1px dashed #ddd;
}

.el-form-item {
  margin-bottom: 15px;
}

.dialog-footer {
  text-align: right;
}
</style>
