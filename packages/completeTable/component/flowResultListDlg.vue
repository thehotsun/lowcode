<template>
  <el-dialog
    v-draggable.overflow.maximize
    title="成果文件清单"
    :visible.sync="dialogVisible"
    width="900px"
    append-to-body
    :close-on-click-modal="false"
  >
    <el-table :data="tableData" border style="width: 100%">
      <!-- 页面显示数据配置的动态列 -->
      <el-table-column
        v-for="field in pageFields"
        :key="field.fieldName"
        :prop="field.fieldName"
        :label="field.fieldDisplayName"
        min-width="120"
        show-overflow-tooltip
      ></el-table-column>
      <el-table-column label="文件名" min-width="180" show-overflow-tooltip>
        <template slot-scope="{ row }">{{ row.fileName || "" }}</template>
      </el-table-column>
      <el-table-column label="生成时间" min-width="150">
        <template slot-scope="{ row }">{{ row.createTime || "" }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template slot-scope="{ row }">
          <template v-if="row.fileId">
            <el-button type="text" @click="handleDownload(row)">下载</el-button>
            <el-button type="text" @click="handleRegenerate(row)">重新生成</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
    <div slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">关 闭</el-button>
      <el-button type="primary" :disabled="!downloadableCount" @click="handleBatchDownload">批量下载</el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: "FlowResultListDlg",
  inject: {
    requestQueryArchiveList: {
      default: () => () => {
        console.warn("inject缺失requestQueryArchiveList!");
      }
    },
    recreateFlowArchive: {
      default: () => () => {
        console.warn("inject缺失recreateFlowArchive!");
      }
    },
    requestDownloadArchive: {
      default: () => () => {
        console.warn("inject缺失requestDownloadArchive!");
      }
    },
    downloadFileShowPrompt: {
      default: () => () => {
        console.warn("inject缺失downloadFileShowPrompt!");
      }
    },
    decodeFileName: {
      default: () => () => {
        console.warn("inject缺失decodeFileName!");
      }
    },
    downloadFile: {
      default: () => () => {
        console.warn("inject缺失downloadFile!");
      }
    },
    getToken: {
      default: () => () => {
        console.warn("inject缺失getToken!");
      }
    }
  },
  data() {
    return {
      dialogVisible: false,
      // 页面显示数据配置的字段列表
      pageFields: [],
      tableData: [],
      ids: [],
      rows: [],
      // 所选行的主键字段名，用于把返回记录关联到所选行
      idField: "",
      listPageId: "",
      btnId: ""
    };
  },
  computed: {
    downloadableCount() {
      return this.tableData.filter(item => item.fileId).length;
    }
  },
  methods: {
    async open({ ids, rows, pageFields, listPageId, btnId, keyField }) {
      this.ids = ids;
      this.rows = rows;
      this.idField = keyField;
      this.pageFields = pageFields || [];
      this.listPageId = listPageId;
      this.btnId = btnId;
      this.dialogVisible = true;
      await this.queryArchiveList();
    },
    async queryArchiveList() {
      const queryFields = this.pageFields.map(field => field.fieldName);
      const res = await this.requestQueryArchiveList({
        ids: this.ids,
        queryFields,
        listPageId: this.listPageId
      });
      if (res?.result !== "0") {
        this.$warn(res?.message || "查询流程成果失败！");
        return;
      }
      const archiveList = res.data || [];
      // 一个流程可能有多个成果（多行）；动态列取值回退到所选行数据
      const rowMap = {};
      this.rows.forEach(row => {
        rowMap[row[this.idField]] = row;
      });
      this.tableData = archiveList.map(record => {
        const row = {};
        const selectedRow = rowMap[record.businessId] || {};
        this.pageFields.forEach(field => {
          row[field.fieldName] = record[field.fieldName] ?? selectedRow[field.fieldName] ?? "";
        });
        return {
          ...row,
          resultFileId: record.resultFileId || "",
          printTemplateId: record.printTemplateId || "",
          businessId: record.businessId || "",
          flowInstanceId: record.flowInstanceId || "",
          fileId: record.fileId || "",
          fileVersion: record.fileVersion,
          fileName: record.fileName || "",
          prjId: record.prjId || "",
          createTime: record.createTime || ""
        };
      });
    },
    // 参考 isoManagement 成果文件下载：走 /flowNew/archive/download 按成果记录下载
    async handleDownload(row) {
      try {
        const response = await this.requestDownloadArchive(row.flowInstanceId, row.businessId, row.resultFileId);
        const fileName = this.decodeFileName(response.getHeaders()["content-disposition"]);
        this.downloadFileShowPrompt(fileName, response);
      } catch (error) {
        console.error("下载失败", error);
        this.$warn("下载失败");
      }
    },
    async handleBatchDownload() {
      const rows = this.tableData.filter(item => item.fileId);
      if (!rows.length) return;
      for (const row of rows) {
        await this.handleDownload(row);
      }
    },
    // 参考 isoManagement 重新生成成果文件
    async handleRegenerate(row) {
      try {
        await this.$confirm("确认重新生成成果文件吗？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        });
      } catch (error) {
        return;
      }
      this.$warn("生成中请稍候，完成后将自动下载成果文件");
      try {
        const res = await this.recreateFlowArchive(row.flowInstanceId, row.businessId, row.printTemplateId);
        // 生成完成自动下载
        if (res?.data?.downloadUrl) {
          this.downloadFile(res.data.downloadUrl + `?token=${this.getToken()}`);
        }
      } finally {
        await this.queryArchiveList();
      }
    }
  }
};
</script>

<style lang="less" scoped>
.dialog-footer {
  text-align: right;
}
</style>
