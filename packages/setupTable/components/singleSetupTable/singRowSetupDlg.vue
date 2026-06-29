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
    <el-form :model="formData" label-width="120px" class="setup-form">
      <!-- 1-2 字段名称 | 标题 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="字段名称">
            <span>{{ formData.fieldCode }}</span>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="标题">
            <el-input v-model="formData.fieldName" placeholder="请输入标题" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 3-4 显示 | 列宽 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="显示">
            <el-switch v-model="formData.show" style="vertical-align: middle;" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="列宽">
            <el-input-number v-model="formData.columnWidth" :min="50" :max="600" :step="10" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 5-6 对齐 | 是否固定 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="对齐">
            <el-select v-model="formData.align" style="width: 100%;" clearable>
              <el-option v-for="item in alignOptions" :key="item.id" :value="item.id" :label="item.cnName" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否固定">
            <el-select v-model="formData.fixed" style="width: 100%;" clearable>
              <el-option v-for="item in fixedOptions" :key="item.id" :value="item.id" :label="item.cnName" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 7-8 启用查询 | 查询设置 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="启用查询">
            <el-switch v-model="formData.isSearchWidget" style="vertical-align: middle;" @change="onSearchWidgetChange" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="查询设置">
            <div class="form-item-row" style="width: 100%;">
              <template v-if="formData.isSearchWidget && searchWidgetDisplayLabel">
                <span class="form-item-ellipsis">{{ searchWidgetDisplayLabel }}</span>
              </template>
              <el-button
                type="text"
                size="small"
                icon="el-icon-edit"
                :class="formData.isSearchWidget && searchWidgetDisplayLabel ? 'color-red' : ''"
                :disabled="!formData.isSearchWidget"
                @click="openSearchWidgetConfig"
                >{{ formData.isSearchWidget && searchWidgetDisplayLabel ? "修改" : "设置" }}</el-button
              >
              <el-tooltip :content="tipsMap.searchWidget">
                <i class="el-icon-question form-help-icon" />
              </el-tooltip>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 13 单行显示 | 14 点击行为 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="单行显示">
            <div class="form-item-row">
              <el-switch v-model="formData['show-overflow-tooltip']" />
              <el-tooltip :content="tipsMap['show-overflow-tooltip']">
                <i class="el-icon-question form-help-icon" />
              </el-tooltip>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="点击行为">
            <div class="form-item-row" style="width: 100%;">
              <template v-if="contentTextAttrDisplayLabel">
                <span class="form-item-ellipsis">{{ contentTextAttrDisplayLabel }}</span>
              </template>
              <el-button type="text" size="small" icon="el-icon-edit" :class="contentTextAttrDisplayLabel ? 'color-red' : ''" @click="openContentTextAttr">{{
                contentTextAttrDisplayLabel ? "修改" : "设置"
              }}</el-button>
              <el-tooltip :content="tipsMap.singleFormatter">
                <i class="el-icon-question form-help-icon" />
              </el-tooltip>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 9 排序 | 11 筛选数组 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="排序">
            <div class="form-item-row">
              <el-switch v-model="formData.sort" />
              <el-tooltip :content="tipsMap.sort">
                <i class="el-icon-question form-help-icon" />
              </el-tooltip>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="筛选数组">
            <div class="form-item-row">
              <el-button type="text" size="small" icon="el-icon-edit" @click="openFiltersConfig">设置</el-button>
              <el-tooltip :content="tipsMap.filters">
                <i class="el-icon-question form-help-icon" />
              </el-tooltip>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 枚举展示（最后） -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="枚举展示">
            <div class="form-item-row" style="width: 100%;">
              <div class="form-item-ellipsis">{{ selectedEnumDisplayLabel }}</div>
              <el-button type="text" size="small" icon="el-icon-edit" :class="selectedEnumDisplayLabel ? 'color-red' : ''" @click="openDicTreeDlg">{{
                selectedEnumDisplayLabel ? "修改" : "设置"
              }}</el-button>
              <el-button v-if="formData.enumDisplayConfig.dicCode" type="text" icon="el-icon-delete" size="small" @click="clearEnumDic">清除</el-button>
              <el-tooltip :content="tipsMap.enumDisplayConfig">
                <i class="el-icon-question form-help-icon" />
              </el-tooltip>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 10 排序函数（独占一行） -->
      <el-row>
        <el-col :span="24">
          <el-form-item label="排序函数">
            <div class="form-item-block">
              <el-input v-model="formData['sort-method']" placeholder="请输入排序方法" readonly @click.native="openCodeEditor('sort-method', '排序方法')"> </el-input>
              <el-tooltip :content="tipsMap['sort-method']">
                <i class="el-icon-question form-help-icon" />
              </el-tooltip>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 12 筛选函数（独占一行） -->
      <el-row>
        <el-col :span="24">
          <el-form-item label="筛选函数">
            <div class="form-item-block">
              <el-input v-model="formData['filter-method']" placeholder="请输入过滤方法" readonly @click.native="openCodeEditor('filter-method', '过滤方法')"> </el-input>
              <el-tooltip :content="tipsMap['filter-method']">
                <i class="el-icon-question form-help-icon" />
              </el-tooltip>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 15 列表渲染函数（独占一行） -->
      <el-row>
        <el-col :span="24">
          <el-form-item label="列表渲染函数">
            <div class="form-item-block">
              <el-input v-model="formData.formatter" placeholder="请输入渲染函数" readonly @click.native="openCodeEditor('formatter', '列表渲染函数')"> </el-input>
              <el-tooltip :content="tipsMap.formatter">
                <i class="el-icon-question form-help-icon" />
              </el-tooltip>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 16 表头渲染函数（独占一行） -->
      <el-row>
        <el-col :span="24">
          <el-form-item label="表头渲染函数">
            <div class="form-item-block">
              <el-input v-model="formData.renderHeader" placeholder="请输入表头渲染函数" readonly @click.native="openCodeEditor('renderHeader', '表头渲染函数')"> </el-input>
              <el-tooltip :content="tipsMap.renderHeader">
                <i class="el-icon-question form-help-icon" />
              </el-tooltip>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

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
      @searchOptionsChange="searchOptionsChange"
      @handleSaveSql="handleSaveSql"
    ></setSearchWidgetAttrDlg>

    <!-- 内容文本属性配置弹窗 -->
    <setClickActionAndShowContentDlg ref="setClickActionAndShowContentDlg" :list-page-id="listPageId" :btn-config-arr="btnConfigArr"></setClickActionAndShowContentDlg>

    <!-- 过滤配置弹窗 -->
    <setFilterConfigDlg ref="setFilterConfigDlg" :list-page-id="listPageId" :btn-config-arr="btnConfigArr" @handleSave="handleSave"></setFilterConfigDlg>

    <!-- 枚举字典树选择弹窗 -->
    <enum-dic-tree-dlg ref="dicTreeDlg" :general-request="generalRequest" @confirm="onEnumDicSelected" />
  </el-dialog>
</template>

<script>
import setSearchWidgetAttrDlg from "./setSearchWidgetAttrDlg.vue";
import setClickActionAndShowContentDlg from "./setClickActionAndShowContentDlg.vue";
import setFilterConfigDlg from "./setFilterConfigDlg.vue";
import enumDicTreeDlg from "./enumDicTreeDlg.vue";
import onlineCode from "/packages/completeTable/component/onlineCode.vue";
import { tableOptionsCodeExampleList } from "/utils/codeExampleList";
import { getSingleTableData, addTipsProps } from "../../../../baseConfig/tableBaseConfig";
import { searchWidget, align, fixed } from "../../../../baseConfig/tableSelectConfigs";
export default {
  components: { setSearchWidgetAttrDlg, setClickActionAndShowContentDlg, setFilterConfigDlg, enumDicTreeDlg, onlineCode },
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
      tipsMap: addTipsProps,
      alignOptions: align,
      fixedOptions: fixed
    };
  },

  computed: {
    codeExampleIsList() {
      return ["formatter", "renderHeader"].includes(this.curFn);
    },
    selectedEnumDisplayLabel() {
      const config = this.formData.enumDisplayConfig;
      return config.dicCode ? `${config.dicName}(${config.dicCode})` : "";
    },
    searchWidgetDisplayLabel() {
      const type = this.formData.searchWidgetConfig?.searchWidgetType;
      if (type == null || type === "") return "";
      const item = searchWidget.find(w => w.id === type);
      return item ? item.cnName : "";
    },
    contentTextAttrDisplayLabel() {
      if (!this.formData.contentTextAttrArr?.length) return "";
      return this.formData.contentTextAttrArr
        .map(item => item.textVal)
        .filter(Boolean)
        .join(",");
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
      this.searchOptionsChange();
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

    // ========== 枚举展示相关 ==========

    // 打开字典树选择弹窗
    openDicTreeDlg() {
      this.$refs.dicTreeDlg.openDlg(this.formData.enumDisplayConfig);
    },

    // 字典树弹窗确认选中
    onEnumDicSelected({ groupId, groupName }) {
      this.formData.enumDisplayConfig.dicCode = groupId;
      this.formData.enumDisplayConfig.dicName = groupName;
    },

    // 清除枚举字典选择
    clearEnumDic() {
      this.formData.enumDisplayConfig.dicCode = "";
      this.formData.enumDisplayConfig.dicName = "";
    },

    // 设置查询控件表单确认事件
    searchOptionsChange() {
      this.$emit("searchOptionsChange");
    }
  }
};
</script>

<style lang="less" scoped>
/* 内联flex行：用于需要与label垂直对齐的行（<el-col span=12 内） */
.form-item-row {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

/* 块级flex行：用于独占整行的控件（<el-col span=24），自然占满宽度 */
.form-item-block {
  display: flex;
  align-items: center;
}

/* flex子项宽度跟随内容，空间不足时收缩并显示省略号 */
.form-item-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

/* 有值时按钮变红 */
.color-red {
  color: #ef5b5b;
}

/* 帮助图标 */
.form-help-icon {
  margin-left: 4px;
  cursor: pointer;
  color: #909399;
}
</style>
