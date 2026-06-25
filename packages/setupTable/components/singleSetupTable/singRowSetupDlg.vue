<template>
  <el-dialog
    v-dialogDrag
    title="更多设置"
    :visible.sync="dialogVisible"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="900px"
    class="singRowSetupDlg"
    append-to-body
  >
    <div class="flex">
      <el-form :model="formData" label-width="120px" class="setup-form">
        <!-- <el-form-item label="对齐方式">
          <el-radio-group v-model="formData.align">
            <el-radio :label="0">左对齐</el-radio>
            <el-radio :label="1">居中</el-radio>
            <el-radio :label="2">右对齐</el-radio>
          </el-radio-group>
        </el-form-item> -->

        <!-- <el-form-item label="固定列位置">
          <el-radio-group v-model="formData.fixed">
            <el-radio label="">不固定</el-radio>
            <el-radio label="left">左侧固定</el-radio>
            <el-radio label="right">右侧固定</el-radio>
          </el-radio-group>
        </el-form-item> -->

        <!-- <el-form-item label="是否作为搜索组件">
          <el-switch v-model="formData.isSearchWidget" @change="onSearchWidgetChange"></el-switch>
          <el-button v-if="formData.isSearchWidget" type="primary" size="small" @click="openSearchWidgetConfig">设置</el-button>
        </el-form-item> -->

        <!-- <el-form-item label="是否支持排序">
          <el-switch v-model="formData.sort"></el-switch>
        </el-form-item> -->

        <!-- <el-form-item label="点击行为">
          <div style="display: flex; align-items: center;">
            <el-button type="primary" size="small" @click="openContentTextAttr">设置</el-button>
            <el-tooltip :content="tipsMap.singleFormatter">
              <i class="el-icon-question" style="margin-left: 4px; cursor: pointer; color: #909399;"/>
            </el-tooltip>
          </div>
        </el-form-item> -->

        <el-form-item label="筛选数组">
          <div style="display: flex; align-items: center;">
            <el-button type="primary" size="small" @click="openFiltersConfig">设置</el-button>
            <el-tooltip :content="tipsMap.filters">
              <i class="el-icon-question" style="margin-left: 4px; cursor: pointer; color: #909399;" />
            </el-tooltip>
          </div>
        </el-form-item>

        <el-form-item label="筛选函数">
          <div style="display: flex; align-items: center;">
            <el-input v-model="formData['filter-method']" placeholder="请输入过滤方法" readonly @click.native="openCodeEditor('filter-method', '过滤方法')">
              <el-button slot="append" @click="openCodeEditor('filter-method', '过滤方法')">编辑</el-button>
            </el-input>
            <el-tooltip :content="tipsMap['filter-method']">
              <i class="el-icon-question" style="margin-left: 4px; cursor: pointer; color: #909399;" />
            </el-tooltip>
          </div>
        </el-form-item>

        <el-form-item label="排序函数">
          <div style="display: flex; align-items: center;">
            <el-input v-model="formData['sort-method']" placeholder="请输入排序方法" readonly @click.native="openCodeEditor('sort-method', '排序方法')">
              <el-button slot="append" @click="openCodeEditor('sort-method', '排序方法')">编辑</el-button>
            </el-input>
            <el-tooltip :content="tipsMap['sort-method']">
              <i class="el-icon-question" style="margin-left: 4px; cursor: pointer; color: #909399;" />
            </el-tooltip>
          </div>
        </el-form-item>
        <!--
        <el-form-item label="是否单行显示">
          <el-switch v-model="formData['show-overflow-tooltip']"></el-switch>
        </el-form-item> -->

        <el-form-item label="列表渲染函数">
          <div style="display: flex; align-items: center;">
            <el-input v-model="formData.formatter" placeholder="请输入渲染函数" readonly @click.native="openCodeEditor('formatter', '列表渲染函数')">
              <el-button slot="append" @click="openCodeEditor('formatter', '列表渲染函数')">编辑</el-button>
            </el-input>
            <el-tooltip :content="tipsMap.formatter">
              <i class="el-icon-question" style="margin-left: 4px; cursor: pointer; color: #909399;" />
            </el-tooltip>
          </div>
        </el-form-item>

        <el-form-item label="自定义表头渲染">
          <div style="display: flex; align-items: center;">
            <el-input v-model="formData.renderHeader" placeholder="请输入表头渲染函数" readonly @click.native="openCodeEditor('renderHeader', '表头渲染函数')">
              <el-button slot="append" @click="openCodeEditor('renderHeader', '表头渲染函数')">编辑</el-button>
            </el-input>
            <el-tooltip :content="tipsMap.renderHeader">
              <i class="el-icon-question" style="margin-left: 4px; cursor: pointer; color: #909399;" />
            </el-tooltip>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <!-- 代码编辑器 -->
    <onlineCode
      v-if="showCodeEditor"
      :title="codeEditorTil"
      :model-value="formData[curFn]"
      :code-example-val="codeExampleIsList ? '' : codeExampleList[curFn]"
      :example-list="codeExampleIsList ? codeExampleList[curFn] : []"
      :use-tab-layout="codeExampleIsList"
      @confirm="handleEditorInput"
      @close="handleCloseCodeEditor"
    ></onlineCode>

    <!-- 搜索组件配置弹窗 -->
    <setSearchWidgetAttrDlg
      ref="setSearchWidgetAttrDlg"
      :general-request="generalRequest"
      :list-page-id="listPageId"
      :generate-query-sql="generateQuerySql"
      :get-sort-numb="getSortNumb"
      @handleSaveSql="handleSaveSql"
    ></setSearchWidgetAttrDlg>

    <!-- 内容文本属性配置弹窗 -->
    <setClickActionAndShowContentDlg ref="setClickActionAndShowContentDlg" :list-page-id="listPageId" :btn-config-arr="btnConfigArr"></setClickActionAndShowContentDlg>

    <!-- 过滤配置弹窗 -->
    <setFilterConfigDlg ref="setFilterConfigDlg" :list-page-id="listPageId" :btn-config-arr="btnConfigArr" @handleSave="handleSave"></setFilterConfigDlg>
  </el-dialog>
</template>

<script>
import setSearchWidgetAttrDlg from "./setSearchWidgetAttrDlg.vue";
import setClickActionAndShowContentDlg from "./setClickActionAndShowContentDlg.vue";
import setFilterConfigDlg from "./setFilterConfigDlg.vue";
import onlineCode from "/packages/completeTable/component/onlineCode.vue";
import { tableOptionsCodeExampleList } from "/utils/codeExampleList";
import { getSingleTableData, addTipsProps } from "../../../../baseConfig/tableBaseConfig";
export default {
  components: { setSearchWidgetAttrDlg, setClickActionAndShowContentDlg, setFilterConfigDlg, onlineCode },
  props: {
    getSortNumb: {
      type: Function,
      required: true,
      default: () => {}
    },
    listPageId: {
      type: String,
      default: () => {
        return "";
      }
    },
    generalRequest: {
      type: Function,
      default: () => {}
    },
    generateQuerySql: {
      type: Function,
      default: () => {}
    },
    btnConfigArr: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      codeExampleList: tableOptionsCodeExampleList,
      dialogVisible: false,
      showCodeEditor: false,
      curFn: "",
      codeEditorTil: "",
      formData: getSingleTableData(),
      tipsMap: addTipsProps
    };
  },

  computed: {
    codeExampleIsList() {
      return ["formatter", "renderHeader"].includes(this.curFn);
    }
  },

  methods: {
    openDlg(row) {
      this.formData = row;
      this.dialogVisible = true;
    },

    onSearchWidgetChange(val) {
      if (!val) {
        this.formData.searchWidgetConfig = {};
        this.formData.searchWidget = "";
      }
    },

    openCodeEditor(field, title) {
      this.curFn = field;
      this.codeEditorTil = title;
      this.showCodeEditor = true;
    },

    handleEditorInput(value) {
      this.formData[this.curFn] = value;
    },

    handleCloseCodeEditor() {
      this.showCodeEditor = false;
    },

    // 打开搜索组件配置弹窗
    openSearchWidgetConfig() {
      this.$refs.setSearchWidgetAttrDlg.openDlg(this.formData);
    },

    // 打开过滤配置弹窗
    openFiltersConfig() {
      this.$refs.setFilterConfigDlg.openDlg({
        filters: this.formData.filters,
        filtersConfig: this.formData.filtersConfig
      });
    },

    // 打开内容文本属性配置弹窗
    openContentTextAttr() {
      this.$refs.setClickActionAndShowContentDlg.openDlg(this.formData);
    },

    // 处理保存SQL
    handleSaveSql(listPageId, wholeSQL) {
      this.$emit("handleSaveSql", listPageId, wholeSQL);
    },

    // 处理保存筛选配置
    handleSave({ filters, filtersConfig }) {
      this.formData.filters = filters;
      this.formData.filtersConfig = filtersConfig;
    },

    handleConfirm() {
      this.$emit("handleSaveRow", this.formData);
      this.handleClose();
    },

    handleClose() {
      this.dialogVisible = false;
    }
  }
};
</script>
