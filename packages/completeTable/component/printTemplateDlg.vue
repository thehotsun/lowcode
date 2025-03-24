<template>
  <el-dialog
    v-dialogDrag
    title="生成打印成果"
    :visible.sync="dialogVisible"
    width="600px"
    append-to-body
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :before-close="cancel"
  >
    <el-form label-width="120px">
      <!-- 自动下载 -->
      <el-form-item>
        <el-checkbox v-model="form.isPdfPrintTemplate" :true-value="1" :false-value="0">输出为pdf（如果不勾选，则输出word文档）</el-checkbox>
        <el-checkbox v-model="form.autoDownload">完成后自动下载</el-checkbox>
      </el-form-item>

      <!-- 保存位置 -->
      <el-form-item>
        <div class="option-group">
          <el-checkbox v-model="form.saveLocation">保存到项目文档</el-checkbox>

          <el-button v-if="form.selectedDir" type="text" :disabled="!form.saveLocation" @click="handleShowPrjFolderFiles">{{ form.selectedDir }}</el-button>
          <el-button type="text" :disabled="!form.saveLocation" @click="handleDir">选择目录</el-button>
        </div>
      </el-form-item>

      <!-- 成果文件名 -->
      <el-form-item label="成果文件名">
        <div>{{ form.projectFileName }}</div>
        <!-- <el-input v-model="form.projectFileName" placeholder="请输入文件名"></el-input> -->
      </el-form-item>

      <!-- 同名文件处理 -->
      <el-form-item label="出现同名文件时">
        <el-select v-model="form.targetPrjFolderSameFilePolicy" size="mini" placeholder="请选择">
          <el-option label="覆盖（升级版本，默认）" :value="0"></el-option>
          <!-- <el-option label="重命名（将在文件名中添加时间戳）" :value="1"></el-option> -->
        </el-select>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="cancel">取 消</el-button>
      <el-button type="primary" @click="generate">生成打印文档</el-button>
    </div>
    <chooseDirDlg
      v-if="dialogVisible"
      ref="chooseDirDlg"
      title="选择目录"
      :prjId="getPrjInfo().prjId"
      :check="getFolderDisableFilter"
      :filter="folderFilter"
      :showTable="false"
      width="514px"
      :multiple="false"
      :defaultList="this.form.targetPrjFolderId ? [{ folderId: this.form.targetPrjFolderId }] : []"
      @confirm="handleFolderSelected"
    ></chooseDirDlg>
    <filesDlg ref="filesDlg"></filesDlg>
  </el-dialog>
</template>

<script>
import chooseDirDlg from "./chooseDirDlg.vue";
import filesDlg from "./filesDlg.vue";
function From() {
  return {
    isPdfPrintTemplate: 0,
    autoDownload: true,
    saveLocation: false,
    projectFileName: "",
    targetPrjFolderSameFilePolicy: 0,
    selectedDir: "",
    targetPrjFolderId: ""
  };
}
export default {
  components: { chooseDirDlg, filesDlg },
  inject: {
    getPrjInfo: {
      default: () => () => {
        console.warn("inject缺失getPrjInfo!");
      }
    },
    queryTree: {
      default: () => () => {
        console.warn("inject缺失queryTree!");
      }
    },
    generatePrintFile: {
      default: () => () => {
        console.warn("inject缺失generatePrintFile!");
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
  props: {
    listPageId: String,
    btnId: String,
    selectList: Array,
    keyField: String
  },
  data() {
    return {
      dialogVisible: false,
      form: new From()
    };
  },

  methods: {
    open({ resultFileName }) {
      this.dialogVisible = true;
      this.form.projectFileName = resultFileName;
    },

    async generate() {
      if (!this.form.autoDownload && !this.form.saveLocation) {
        this.$warn("请至少选择一种保存方式");
        return;
      }
      this.selectList.map(async item => {
        const params = {
          listPageId: this.listPageId,
          buttonId: this.btnId,
          dataId: item[this.keyField],
          viewData: item,
          isPdfPrintTemplate: this.form.isPdfPrintTemplate,
          targetPrjFolderId: this.form.targetPrjFolderId,
          targetPrjFolderSameFilePolicy: this.form.targetPrjFolderSameFilePolicy
        };
        const { data } = await this.generatePrintFile(params);
        if (this.form.autoDownload) {
          // 下载逻辑处理
          if (data?.downloadUrl) {
            this.downloadFile(data.downloadUrl + `?token=${this.getToken()}`);
          } else {
            this.$warn("下载地址为空!");
          }
        }
      });
      // 生成逻辑处理
      console.log("生成参数：", this.form);
    },

    cancel() {
      this.dialogVisible = false;
      // 可选：重置表单数据
      this.form = new From();
    },

    handleDir() {
      this.$refs.chooseDirDlg.open();
    },
    handleFolderSelected(list) {
      if (!list.length) return;
      const { fullName, folderId } = list[0];
      this.form.selectedDir = fullName;
      this.form.targetPrjFolderId = folderId;
    },

    async handleShowPrjFolderFiles() {
      // 显示项目文档目录文件
      const params = {
        folderId: this.form.targetPrjFolderId,
        isRead: 1,
        priviAll: "1",
        noRightClickMenu: true,
        prjId: this.getPrjInfo().prjId
      };
      const { data } = await this.queryTree(params);
      this.$refs.filesDlg.open(
        data.filter(item => item.isFolder === 0),
        this.form.selectedDir
      );
    },
    folderFilter(Vo) {
      const isFolder = Vo.folderId !== "recycle" && Vo.isFolder;
      if (!isFolder) return false;
      else return true;
    },
    getFolderDisableFilter() {
      return () => true;
    }
  }
};
</script>

<style lang="less" scoped>
::v-deep .el-form-item {
  margin-bottom: 0px;
}
.dialog-footer {
  text-align: right;
}
</style>
