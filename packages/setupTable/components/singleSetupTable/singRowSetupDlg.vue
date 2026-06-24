<template>
  <el-dialog
    v-dialogDrag
    title="设置更多"
    :visible.sync="dialogVisible"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="900px"
    class="singRowSetupDlg"
    append-to-body
  >
    <div class="flex">
      <el-form ref="form" :model="formData" label-width="120px" class="setup-form">
        <el-form-item label="字段名称">
          <el-input v-model="formData.fieldName" placeholder="请输入字段名称"></el-input>
        </el-form-item>

        <el-form-item label="是否显示">
          <el-switch v-model="formData.show"></el-switch>
        </el-form-item>

        <el-form-item label="列宽">
          <el-input-number v-model="formData.columnWidth" controls-position="right"></el-input-number>
        </el-form-item>

        <el-form-item label="对齐方式">
          <el-radio-group v-model="formData.align">
            <el-radio :label="0">左对齐</el-radio>
            <el-radio :label="1">居中</el-radio>
            <el-radio :label="2">右对齐</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="固定列位置">
          <el-radio-group v-model="formData.fixed">
            <el-radio label="">不固定</el-radio>
            <el-radio label="left">左侧固定</el-radio>
            <el-radio label="right">右侧固定</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="是否作为搜索组件">
          <el-switch v-model="formData.isSearchWidget"></el-switch>
          <el-button v-if="formData.isSearchWidget" type="primary" size="small" @click="openSearchWidgetConfig">设置</el-button>
        </el-form-item>

        <el-form-item label="是否支持排序">
          <el-switch v-model="formData.sort"></el-switch>
        </el-form-item>

        <el-form-item label="排序函数">
          <el-input v-model="formData['sort-method']" placeholder="请输入排序方法"></el-input>
        </el-form-item>

        <el-form-item label="筛选数组">
          <el-button type="primary" size="small" @click="openFiltersConfig">设置</el-button>
        </el-form-item>

        <el-form-item label="筛选函数">
          <el-input v-model="formData['filter-method']" placeholder="请输入过滤方法"></el-input>
        </el-form-item>

        <el-form-item label="是否单行显示">
          <el-switch v-model="formData['show-overflow-tooltip']"></el-switch>
        </el-form-item>

        <el-form-item label="列表渲染函数">
          <el-input v-model="formData.formatter" placeholder="请输入渲染函数"></el-input>
        </el-form-item>

        <el-form-item label="自定义表头渲染">
          <el-input v-model="formData.renderHeader" placeholder="请输入表头渲染函数"></el-input>
        </el-form-item>

        <el-form-item label="点击行为">
          <el-button type="primary" size="small" @click="openContentTextAttr">设置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </span>

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
import { cloneDeep } from "lodash";
import setSearchWidgetAttrDlg from "./setSearchWidgetAttrDlg.vue";
import setClickActionAndShowContentDlg from "./setClickActionAndShowContentDlg.vue";
import setFilterConfigDlg from "./setFilterConfigDlg.vue";
export default {
  components: { setSearchWidgetAttrDlg, setClickActionAndShowContentDlg, setFilterConfigDlg },
  props: {
    getSortNumb: {
      type: Function,
      require: true,
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
      dialogVisible: false,
      formData: {
        fieldCode: "id",
        fieldName: "主键",
        show: false,
        columnWidth: 110,
        align: 1,
        fixed: "",
        searchWidget: "",
        isSearchWidget: false,
        searchWidgetConfig: {},
        sort: true,
        "sort-method": "",
        filters: "",
        filtersConfig: {
          isFilter: false,
          isSplit: false,
          splitChar: ",",
          customHandler: "",
          limitShowWord: false,
          maxlength: 10
        },
        "filter-method": "",
        "show-overflow-tooltip": true,
        formatter: "",
        renderHeader: "",
        listeners: {},
        contentTextAttrArr: []
      }
    };
  },

  watch: {},
  methods: {
    openDlg(row) {
      this.formData = cloneDeep(row);
      this.dialogVisible = true;
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

    handleCloseContentTextAttr() {
      this.dialogVisible = false;
    },

    // 处理搜索选项变更
    searchOptionsChange() {
      this.$emit("searchOptionsChange");
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
      this.searchOptionsChange();
      this.handleClose();
    },

    handleClose() {
      this.dialogVisible = false;
    }
  }
};
</script>

<style lang="less" scoped></style>
