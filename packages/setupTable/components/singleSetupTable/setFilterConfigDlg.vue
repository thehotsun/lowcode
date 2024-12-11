<template>
  <el-dialog
    v-dialogDrag
    title="设置筛选数组"
    :visible.sync="dialogVisibleFrom"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="1450px"
    class="setFilterConfigDlg"
    :before-close="handleCloseFrom"
    append-to-body
  >
    <el-tabs v-model="activeName">
      <el-tab-pane label="输入筛选数组" name="direct" class="tab">
        <js-code-editor ref="chEditor" mode="javascript" :readonly="false" :value="curRowData.filters" @input="handleEditorInput"></js-code-editor>
        <codeExample :val="filtersExample" @copy="handleCopy"></codeExample>
      </el-tab-pane>

      <el-tab-pane label="自定义处理函数" name="customHandler" class="tab">
        <js-code-editor
          ref="customHandlerEditor"
          mode="javascript"
          class="jscode"
          :readonly="false"
          :value="curRowData.filtersConfig.customHandler"
          @input="val => (curRowData.filtersConfig.customHandler = val)"
        ></js-code-editor>
        <codeExample :val="filtersHandleFnExample" @copy="handleCopy2"></codeExample>
      </el-tab-pane>

      <el-tab-pane label="配置筛选数组" name="options" class="tab">
        <div></div>
        <el-form ref="optionsForm" :model="curRowData.filtersConfig" label-width="70px">
          <el-form-item label="启用筛选">
            <template #lable>
              <el-tooltip class="item" effect="dark" content="启用筛选后，渲染时将自动获取当前列的所有值，统一展示在表头的下拉搜索列表中" placement="top-start">
                <el-button type="text">启用筛选 <i style="width: 20px" class="el-icon-question"></i> </el-button>
              </el-tooltip>
            </template>
            <el-switch v-model="curRowData.filtersConfig.isFilter"></el-switch>
          </el-form-item>
          <!-- <el-row>
            <el-col span="3"> -->
          <el-form-item label="内容分割">
            <el-switch v-model="curRowData.filtersConfig.isSplit"></el-switch>
          </el-form-item>
          <!-- </el-col>
            <el-col v-if="curRowData.filtersConfig.isSplit" span="4"> -->
          <el-form-item label="分割符号">
            <el-input v-model="curRowData.filtersConfig.splitChar" size="small" style="width: 200px" placeholder="请输入分割符号"></el-input>
          </el-form-item>
          <!-- </el-col>
          </el-row> -->
        </el-form>
      </el-tab-pane>
    </el-tabs>
    <div>
      提示：输入筛选数组优先级大于自定义处理函数优先级大于配置筛选数组优先级
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleCloseFrom">取消</el-button>
      <el-button type="primary" @click="confirmFrom">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { tableOptionsCodeExampleList } from "/utils/codeExampleList";
import codeExample from "../dialogs/components/codeExample.vue";
import { str2obj } from "../../../../utils";
import { cloneDeep, merge } from "lodash";
import { FiltersConfig } from "/baseConfig/tableBaseConfig";
export default {
  components: {
    codeExample
  },
  props: {
    generalRequest: {
      type: Function,
      default: () => {}
    },
    listPageId: {
      type: String,
      default: () => {
        return "";
      }
    },
    generateQuerySql: {
      type: Function,
      require: true,
      default: () => {}
    }
  },
  data() {
    return {
      activeName: "direct",
      filtersExample: tableOptionsCodeExampleList.filters,
      filtersHandleFnExample: tableOptionsCodeExampleList.filtersHandleFn,
      dialogVisibleFrom: false,
      curRowData: {
        filters: "",
        filtersConfig: new FiltersConfig()
      }
    };
  },
  mounted() {},
  methods: {
    handleEditorInput(value) {
      // 处理编辑器输入的逻辑
      this.curRowData.filters = value;
    },

    async handleCopy2(val) {
      this.curRowData.filtersConfig.customHandler = val;
      await this.$nextTick();
      this.$refs.customHandlerEditor.aceEditor.setOptions({
        value: this.curRowData.filtersConfig.customHandler
      });
      this.$refs.customHandlerEditor.codeValue = this.curRowData.filtersConfig.customHandler;
    },
    async handleCopy(val) {
      this.curRowData.filters = val;
      await this.$nextTick();
      this.$refs.chEditor.aceEditor.setOptions({
        value: this.curRowData.filters
      });
      this.$refs.chEditor.codeValue = this.curRowData.filters;
    },
    confirmFrom() {
      this.$emit("handleSave", this.curRowData);
      this.handleCloseFrom();
    },
    changeFormData(value, formData) {
      console.log(formData, value);
      // 防止用户赋值给没有声明的属性值，导致其变为非响应式数据
      this.$set(formData.request, "url", `${value}`);
    },

    openDlg({ filters, filtersConfig }) {
      this.curRowData = cloneDeep({ filters, filtersConfig });
      this.dialogVisibleFrom = true;
    },

    handleCloseFrom() {
      this.dialogVisibleFrom = false;
      this.setupForm = {};
      this.setupFormOptions = [];
      this.wholeSQL = "";
      this.suggestSQL = "";
    }
  }
};
</script>

<style lang="less" scoped>
.setFilterConfigDlg {
  .tab {
    height: 500px;
    overflow: auto;
  }
  .jscode {
    margin-top: 10px;
  }
  .flex {
    display: flex;
    .left {
      width: 500px;
      box-sizing: border-box;
      padding-right: 15px;

      .fieldList {
        max-height: 280px;
        overflow: auto;
      }
    }

    .right {
      width: 990px;
    }
  }
  .code {
    float: right;
    color: #999;
  }

  .colorRed {
    color: #ef5b5b;
  }
  .color78 {
    color: #787878;
  }
}
</style>
