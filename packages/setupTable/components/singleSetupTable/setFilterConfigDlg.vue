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
        <el-form ref="optionsForm" :model="curRowData.filtersConfig" label-width="130px">
          <el-form-item label="启用筛选">
            <template #label>
              <div class="fz14">
                启用筛选
                <el-tooltip class="item" effect="dark" content="启用筛选后，渲染时将自动获取当前列的所有值，统一展示在表头的下拉搜索列表中" placement="top-start">
                  <i style="width: 20px; color: #606266;" class="el-icon-question"></i>
                </el-tooltip>
              </div>
            </template>
            <el-switch v-model="curRowData.filtersConfig.isFilter"></el-switch>
          </el-form-item>
          <!-- <el-row>
            <el-col span="3"> -->
          <el-form-item label="内容分割">
            <template #label>
              <div class="fz14">
                内容分割
                <el-tooltip class="item" effect="dark" content="是否使用split方法将当前列的值进行分割，一般用于多人使用逗号拼接在一起的场景" placement="top-start">
                  <i style="width: 20px; color: #606266;" class="el-icon-question"></i>
                </el-tooltip>
              </div>
            </template>
            <el-switch v-model="curRowData.filtersConfig.isSplit"></el-switch>
          </el-form-item>
          <!-- </el-col>
            <el-col v-if="curRowData.filtersConfig.isSplit" span="4"> -->
          <el-form-item label="分割符号">
            <template #label>
              <div class="fz14">
                分割符号
                <el-tooltip class="item" effect="dark" content="split方法的参数，默认,。例如当前值为A,B。配置此选项后，将分别展示A和B" placement="top-start">
                  <i style="width: 20px; color: #606266;" class="el-icon-question"></i>
                </el-tooltip>
              </div>
            </template>
            <el-input v-model="curRowData.filtersConfig.splitChar" size="small" style="width: 200px" placeholder="请输入分割符号"></el-input>
          </el-form-item>
          <el-form-item label="限制显示长度">
            <template #label>
              <div class="fz14">
                限制显示长度
                <el-tooltip class="item" effect="dark" content="在表头下拉筛选列表中是否限制显示长度，一般用于当前列的内容字数特别多的场景" placement="top-start">
                  <i style="width: 20px; color: #606266;" class="el-icon-question"></i>
                </el-tooltip>
              </div>
            </template>
            <el-switch v-model="curRowData.filtersConfig.limitShowWord"></el-switch>
          </el-form-item>
          <el-form-item label="分割符号">
            <template #label>
              <div class="fz14">
                最大字数长度
                <el-tooltip class="item" effect="dark" content="在表头下拉筛选列表中显示的最大字数长度" placement="top-start">
                  <i style="width: 20px; color: #606266;" class="el-icon-question"></i>
                </el-tooltip>
              </div>
            </template>
            <el-input-number v-model="curRowData.filtersConfig.maxlength" size="small" style="width: 200px" placeholder="请输入分割符号"></el-input-number>
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
import { cloneDeep } from "lodash";
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
      const defaultFilterConfig = new FiltersConfig();
      this.curRowData = cloneDeep({
        filters,
        filtersConfig: {
          ...defaultFilterConfig,
          ...filtersConfig
        }
      });
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
  .fx14 {
    font-size: 14px;
  }
}
</style>
