<template>
  <el-dialog
    v-dialogDrag
    title="内容构造器"
    :visible.sync="showFileNameDlg"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="800px"
    :before-close="handleGenerateNameClose"
    append-to-body
  >
    <el-form class="wrapper" label-width="200px" label-position="top" size="small">
      <el-form-item label="原始内容">
        <el-input v-model="originContent" :disabled="true"></el-input>
      </el-form-item>

      <el-form-item label="当前内容">
        <el-input ref="inputWord" v-model="currentContent" @blur="handleInputBlur"></el-input>
        <div>
          <el-button type="text" size="mini" :disabled="isViewMode" @click="handleReset">重置</el-button>
        </div>
        <div v-for="item in printParamFields" :key="item.type" class="btns">
          <!-- 按钮组带工具提示 -->
          <div>{{ item.typeDispalyName }}</div>
          <el-button v-for="(btnInfo, index) in item.btnInfoArr" :key="index" type="" size="mini" @click="handleInput(btnInfo.fieldName)">
            {{ btnInfo.fieldDisplayName }}
            <el-tooltip v-if="btnInfo.desc" placement="top" :content="btnInfo.desc">
              <i class="el-tooltip el-icon-question" style="margin-left:2px;margin-right:5px"></i>
            </el-tooltip>
          </el-button>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button type="" size="mini" @click="handleGenerateNameClose">取消</el-button>
        <el-button type="primary" size="mini" @click="handleConfirmChangeGenerateName">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
export default {
  inject: ["queryPrintParamFields"],
  props: {},
  data() {
    return {
      showFileNameDlg: false, // 补全变量
      currentContent: "", // 补全变量
      originContent: "", // 补全变量
      isViewMode: false, // 补全变量
      printParamFields: [] // 补全变量
    };
  },
  methods: {
    handleGenerateName(content, listPageId) {
      if (typeof content !== "string") {
        content = "";
      }
      this.originContent = content;
      this.handleReset();
      this.getPrintParamFields(listPageId);
      this.showFileNameDlg = true;
    },
    getPrintParamFields(listPageId) {
      this.queryPrintParamFields(listPageId).then(({ data }) => {
        this.printParamFields = [];
        Object.entries(data).forEach(([key, value]) => {
          const obj = {};
          obj.type = key;
          switch (key) {
            case "commonColumns":
              obj.typeDispalyName = "公共字段";
              obj.btnInfoArr = value;
              break;
            case "metaColumns":
              obj.typeDispalyName = "主表字段";
              obj.btnInfoArr = value.map(item => {
                item.fieldName = `m.${item.fieldName}`;
                return item;
              });
              break;
            case "viewColumns":
              obj.typeDispalyName = "视图字段";
              obj.btnInfoArr = value.map(item => {
                item.fieldName = `v.${item.fieldName}`;
                return item;
              });
              break;
            default:
              break;
          }
          this.printParamFields.push(obj);
        });
      });
    },
    handleGenerateNameClose() {
      this.currentContent = "";
      this.showFileNameDlg = false;
    },
    handleReset() {
      this.currentContent = this.originContent || "";
      this.cursorIndex = "";
    },

    handleInputBlur(e) {
      this.cursorIndex = e.srcElement.selectionStart;
    },
    handleInput(label) {
      // 获取el-input中的input元素
      const txt = this.currentContent;
      const cursorIndex = this.cursorIndex || 0;
      const start = txt.substring(0, cursorIndex);
      const end = txt.substring(cursorIndex, txt.length);

      // 插入关键词
      this.currentContent = start + `\${${label}}` + end;

      // 获取文本框，设置焦点，处理光标位置
      if (this.$refs.inputWord) {
        // this.$refs.inputWord.focus();
        this.$nextTick(() => {
          var a = this.$refs.inputWord.$el.firstElementChild;
          a.focus();
          a.selectionStart = cursorIndex + label.length + 3;
          a.selectionEnd = cursorIndex + label.length + 3;
        });
      }
    },

    handleConfirmChangeGenerateName() {
      this.$emit("ok", this.currentContent);
      this.handleGenerateNameClose();
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
