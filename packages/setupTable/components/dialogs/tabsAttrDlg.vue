<template>
  <el-dialog
    title="tabs属性设置"
    :visible.sync="dialogVisibleTabsAttrs"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="900px"
    :before-close="handleCloseTabsAttrs"
  >
    <div style="min-width: 60px;background: #fff;padding: 10px;">
      <el-form ref="ruleForm" :model="tabsAttrs" :rules="rules" label-width="130px" style="padding-bottom: 20px">
        <!-- <el-form-item label="tab页名称" prop="showLableInfo">
          <el-input v-model="tabsAttrs.showLableInfo" placeholder="请输入tab1,tab2,tab3格式"></el-input>
        </el-form-item> -->
        <el-form-item label="类型" prop="type">
          <el-select v-model="tabsAttrs.attrs.type" placeholder="请选择">
            <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value"> </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="标签位置" prop="tabPosition">
          <el-select v-model="tabsAttrs.attrs.tabPosition" placeholder="请选择">
            <el-option v-for="item in tabPositionOptions" :key="item.value" :label="item.label" :value="item.value"> </el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleCloseTabsAttrs">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { TabsAttrs } from "/baseConfig/tabsBaseConfigs";

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
      },
      typeOptions: [
        {
          label: "默认",
          value: ""
        },
        {
          label: "选项卡样式",
          value: "card"
        },
        {
          label: "卡片化",
          value: "border-card"
        }
      ],
      tabPositionOptions: [
        { label: "左", value: "left" },
        { label: "右", value: "right" },
        { label: "上", value: "top" },
        { label: "下", value: "bottom" }
      ]
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
