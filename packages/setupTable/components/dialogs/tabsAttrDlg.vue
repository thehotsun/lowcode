<template>
  <el-dialog
    title="树属性设置"
    :visible.sync="dialogVisibleTabsAttrs"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="900px"
    :before-close="handleCloseTabsAttrs"
  >
    <div style="min-width: 60px;background: #fff;padding: 10px;">
      <el-form ref="ruleForm" :model="tabsAttrs" :rules="rules" label-width="130px" style="padding-bottom: 20px"> </el-form>
      <el-dialog :before-close="handleClose" title="代码编写" :visible="showCodeEditor" width="900px" :append-to-body="true">
        <js-code-editor ref="chEditor" mode="javascript" :readonly="false" :value="tabsAttrs[curFn]" @input="handleEditorInput"></js-code-editor>
      </el-dialog>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleCloseTabsAttrs">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { TabsAttrs } from "/baseConfig/tabsAttrDlg";

import { cloneDeep } from "lodash";

export default {
  components: {},
  data() {
    return {
      dialogVisibleTabsAttrs: false,
      showCodeEditor: false,
      tabsAttrs: new TabsAttrs(),
      curFn: "",
      rules: {},
      deliveryFieldsOption: {
        options: []
      }
    };
  },

  inject: ["getPageInfo"],
  computed: {},

  methods: {
    showTabsAttrs(attrs) {
      this.tabsAttrs = cloneDeep(attrs);
      this.dialogVisibleTabsAttrs = true;
    },
    handleCloseTabsAttrs() {
      this.dialogVisibleTabsAttrs = false;
    },
    async handleShow(field) {
      this.curFn = field;
      this.showCodeEditor = true;
      await this.$nextTick();
      this.$refs.chEditor.aceEditor.setOptions({
        value: this.tabsAttrs[this.curFn]
      });
      this.$refs.chEditor.codeValue = this.tabsAttrs[this.curFn];
    },
    handleEditorInput(val) {
      this.tabsAttrs[this.curFn] = val;
    },
    handleClose() {
      this.showCodeEditor = false;
    },
    handleConfirm() {
      this.$emit("changeTabsAttrs", this.tabsAttrs);
      this.handleCloseTabsAttrs();
    }
  }
};
</script>

<style lang="less" scoped>
.config {
  display: flex;
  align-items: flex-start;
  font-size: 14px;
}

.configLeft {
  font-size: 14px;
  width: 160px;
}

.configRight {
  font-size: 14px;
  flex: 1;
}
</style>
