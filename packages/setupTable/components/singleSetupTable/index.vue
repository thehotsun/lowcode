<template>
  <div class="wrap" style="height: 100%; backg">
    <div class="operate">
      <el-button size="small" type="default" @click="handleAdd(1)">新增操作列</el-button>
      <el-button size="small" type="default" :disabled="!selected.length" @click="handleAddParent">新增父级</el-button>
      <el-button size="small" type="default" :disabled="!selected.length" @click="handleDelParent">删除父级</el-button>
      <el-button size="small" type="default" @click="handleFuzzySearch">设置搜索字段</el-button>
      <el-button size="small" type="default" @click="handleSummaryRow">设置统计行</el-button>
      <el-button size="small" type="default" @click="handleHideAll">隐藏所有</el-button>
      <el-button size="small" type="default" @click="handleShowAll">显示所有</el-button>
      <el-button size="small" type="danger" :disabled="!selected.length" @click="handleDelete">删除</el-button>
      <el-checkbox v-model="filterShowField" size="small" class="marginLeft10">仅列出显示字段</el-checkbox>

      <!-- <el-button size='small' type="" :disabled="checkUpBtnDisabled()" @click="handleUpAndDwon(true)">上移</el-button>
        <el-button size='small' type="" :disabled="checkDwonBtnDisabled()" @click="handleUpAndDwon(false)">下移</el-button> -->
      <slot name="btn"></slot>
    </div>

    <!-- <el-main> -->
    <div class="renderwrap">
      <!-- <el-main> -->
      <base-render-table
        ref="table"
        :table-data="finalTableData"
        :table-options="tableOptions"
        edit-mode
        :row-key="row => row.fieldCode || row.random"
        border
        class="fullHeight"
        :row-style="{ height: '40px' }"
        :cell-style="{ padding: '4px' }"
        height="100%"
        @selection-change="selectListHandler"
      >
        <!-- 注意这里的slot值要和tableOptions中配置的slotName一致 -->
        <!-- #operator是简写，详细请查阅vue文档 -->
        <template #setupWidget="{ row }">
          <el-button type="text" icon="el-icon-edit" :disabled="row.isSearchWidget === false" @click.stop.prevent="handleWidgetAttr(row)">
            设置
          </el-button>
          <slot name="setupWidget" :row="row"></slot>
        </template>
        <template #setupContentText="{ row }">
          <el-button
            type="text"
            icon="el-icon-edit"
            :class="row.contentTextAttrArr && row.contentTextAttrArr.length ? 'colorRed' : ''"
            @click.stop.prevent="handleContentTextAttr(row)"
          >
            {{ row.contentTextAttrArr && row.contentTextAttrArr.length ? "修改" : "设置" }}
          </el-button>
          <slot name="setupContentText" :row="row"></slot>
        </template>
        // TODO
        <template #setupFilterArr="{ row }">
          <el-button
            type="text"
            icon="el-icon-edit"
            :class="row.contentTextAttrArr && row.contentTextAttrArr.length ? 'colorRed' : ''"
            @click.stop.prevent="handleContentTextAttr(row)"
          >
            {{ row.contentTextAttrArr && row.contentTextAttrArr.length ? "修改" : "设置" }}
          </el-button>
          <slot name="setupContentText" :row="row"></slot>
        </template>

        <!-- <template #operator="{ row }">
          <el-button v-if="row.$edit" @click.stop.prevent="onSave(row)">
            保存
          </el-button>
          <slot name="operator" :row="row"></slot>
        </template> -->
      </base-render-table>
      <!-- </el-main> -->
    </div>
    <!-- </el-main> -->

    <el-dialog
      v-dialogDrag
      title="设置点击行为和展示内容"
      :visible.sync="dialogVisibleContentTextAttr"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      width="900px"
      :before-close="handleCloseContentTextAttr"
      append-to-body
    >
      <div class="flex">
        <el-tabs v-model="editableTabsValue" type="card" editable @edit="handleTabsEdit">
          <el-tab-pane v-for="item in editableTabs" :key="item.name" :label="item.title" :name="item.name">
            <el-form ref="form" :model="contentTextAttrForm" label-width="160px">
              <el-form-item label="关联按钮：">
                <el-tooltip slot="label" class="fontSize14" effect="dark" content="此渲染内容的点击行为相当于选中当前行后立刻点击关联的这个按钮" placement="top-start">
                  <span>关联按钮<i style=";width: 20px;" class="el-icon-question"></i>：</span>
                </el-tooltip>
                <el-select v-model="contentTextAttrForm.clickEvent.relateBtnId" placeholder="请选择关联按钮" filterable clearable="">
                  <el-option v-for="btnItem in btnConfigArr" :key="btnItem.btnId" :label="btnItem.tagAttrs.value" :value="btnItem.btnId"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="字体大小：">
                <el-input-number v-model="contentTextAttrForm.fontSize" :min="1" :max="100"></el-input-number>
              </el-form-item>
              <el-form-item label="字体样式：">
                <el-checkbox v-model="contentTextAttrForm.isBold">变粗</el-checkbox>
                <el-checkbox v-model="contentTextAttrForm.isItalic">斜体</el-checkbox>
                <el-checkbox v-model="contentTextAttrForm.isStrikethrough">删除线</el-checkbox>
                <el-checkbox v-model="contentTextAttrForm.isUnderline">下划线</el-checkbox>
                <el-checkbox v-model="contentTextAttrForm.cursor" true-label="pointer" false-label="inherit">
                  <el-tooltip class="fontSize14" effect="dark" content="鼠标移动到内容上是否展示一个小手的标识" placement="top-start">
                    <span>显示点击标识<i style="width: 20px;" class="el-icon-question"></i></span>
                  </el-tooltip>
                </el-checkbox>
              </el-form-item>
              <el-form-item label="字体颜色：">
                <div class="flexCenter">
                  <el-color-picker v-model="contentTextAttrForm.color"></el-color-picker>
                  <span style="margin-left: 10px">
                    快捷按钮：
                  </span>
                  <el-button type="text" style="color: #409eff;" @click="setColor('#409eff')">主要-蓝色</el-button>
                  <el-button type="text" style="color: #67c23a;" @click="setColor('#67c23a')">成功-绿色</el-button>
                  <el-button type="text" style="color: #e6a23c;" @click="setColor('#e6a23c')">警告-橙色</el-button>
                  <el-button type="text" style="color: #f56c6c;" @click="setColor('#f56c6c')">危险-红色</el-button>
                  <el-button type="text" style="color: #909399;" @click="setColor('#909399')">信息-灰色</el-button>
                </div>
              </el-form-item>

              <el-form-item label="显示文本：">
                <el-tooltip
                  slot="label"
                  class="fontSize14"
                  effect="dark"
                  content="新增操作列输入什么展示什么，如果不输入则不展示。非新增操作列如果输入显示文本，则会覆盖原本prop的值, 如果不想展示任何文本，请输入一个空格"
                  placement="top-start"
                >
                  <span>显示文本<i style="width: 20px" class="el-icon-question"></i>：</span>
                </el-tooltip>
                <el-input v-model="contentTextAttrForm.textVal"></el-input>
              </el-form-item>
              <el-form-item label="图标：">
                <el-tooltip slot="label" class="fontSize14" effect="dark" content="如果选择图标，则会覆盖原本prop的值" placement="top-start">
                  <span>图标<i style="width: 20px" class="el-icon-question"></i>：</span>
                </el-tooltip>
                <icon-picker v-model="contentTextAttrForm.iconName"></icon-picker>
              </el-form-item>
              <el-form-item label="图标位置：">
                <el-radio-group v-model="contentTextAttrForm.iconPosition">
                  <el-radio label="front">icon前置</el-radio>
                  <el-radio label="behind">icon后置</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="图标样式：">
                <el-tooltip slot="label" class="fontSize14" effect="dark" content="用于设置icon行内样式，大部分使用场景为设置和另一渲染内容或文字的间距" placement="top-start">
                  <span>图标样式<i style="width: 20px" class="el-icon-question"></i>：</span>
                </el-tooltip>
                <el-input v-model="contentTextAttrForm.iconStyle"></el-input>
              </el-form-item>
              <el-form-item label="文字样式：">
                <el-tooltip slot="label" class="fontSize14" effect="dark" content="用于设置文字样式，大部分使用场景为设置和另一渲染内容或icon的间距" placement="top-start">
                  <span>文字样式<i style="width: 20px" class="el-icon-question"></i>：</span>
                </el-tooltip>
                <el-input v-model="contentTextAttrForm.textStyle"></el-input>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleCloseContentTextAttr">取消</el-button>
        <el-button type="primary" @click="confirmContentTextAttr">确定</el-button>
      </span>
    </el-dialog>
    <setSearchWidgetAttrDlg
      ref="setSearchWidgetAttrDlg"
      :general-request="generalRequest"
      :list-page-id="listPageId"
      :generate-query-sql="generateQuerySql"
      @searchOptionsChange="searchOptionsChange"
      @handleSaveSql="handleSaveSql"
    ></setSearchWidgetAttrDlg>
    <setSearchFieldDlg
      ref="setSearchFieldDlg"
      :list-page-id="listPageId"
      @handleSaveSql="handleSaveSql"
      @updateOriginFuzzyFieldSearchConfig="updateOriginFuzzyFieldSearchConfig"
    ></setSearchFieldDlg>
  </div>
</template>

<script>
import BaseRenderTable from "../../../../packages/BaseRenderTable/index";

import { getSingleTableData, editConf as tableOptions, ContentTextAttrForm } from "../../../../baseConfig/tableBaseConfig";

import IconPicker from "../setupBtnConfig/components/iconPicker";

import { cloneDeep, merge } from "lodash";
import setSearchWidgetAttrDlg from "./setSearchWidgetAttrDlg.vue";
import setSearchFieldDlg from "./setSearchFieldDlg.vue";
export default {
  name: "SingleSetupTable",
  components: {
    BaseRenderTable,
    IconPicker,
    setSearchWidgetAttrDlg,
    setSearchFieldDlg
  },
  props: {
    listPageIdProp: {
      type: String,
      default: () => {
        return "";
      }
    },
    rawTableData: {
      type: Array,
      default: () => {
        return [];
      }
    },
    btnConfigArr: {
      type: Array,
      default: () => {
        return [];
      }
    },
    generalRequest: {
      type: Function,
      default: () => {}
    },
    generateQuerySql: {
      type: Function,
      require: true,
      default: () => {}
    },
    saveSql: {
      type: Function,
      require: true,
      default: () => {}
    }
  },
  data() {
    return {
      tableOptions,
      selected: [],
      formDesignData: {},
      setupForm: {},
      curRowData: {},
      tableData: [],
      suggestSQL: "",
      wholeSQL: "",
      filterShowField: false,
      dialogVisibleContentTextAttr: false,
      editableTabsValue: "0",
      editableTabs: [
        {
          title: "渲染内容1",
          name: "0",
          contentTextAttrForm: new ContentTextAttrForm()
        }
      ],
      contentTextAttrForm: new ContentTextAttrForm(),
      originFuzzyFieldSearchConfig: {
        placeholder: "",
        searchFieldList: []
      }
    };
  },

  computed: {
    finalTableData() {
      return this.filterShowField ? this.tableData.filter(item => item.show) : this.tableData;
    },
    listPageId() {
      return this.listPageIdProp || this.getListPageId();
    }
  },

  inject: ["queryGenerateMultiFieldSql", "Sortable", "getListPageId"],

  watch: {
    rawTableData(val) {
      this.tableData = val;
    },
    editableTabsValue: {
      handler(val) {
        this.contentTextAttrForm = this.editableTabs[val].contentTextAttrForm;
        console.log(this.contentTextAttrForm, val, this.editableTabs[val].contentTextAttrForm, "2");
      }
    }
  },

  created() {
    const that = this;
    const target = this.tableOptions.find(item => item.prop === "isSearchWidget");
    target.listeners.change = (row, val) => {
      // 如果不显示查询控件，则清空当前控件配置
      if (!val) {
        // 当前函数的row为tabledata中此行的row
        row.searchWidgetConfig = {};
        row.searchWidget = "";
      }
      that.$emit("searchOptionsChange");
    };
  },

  mounted() {
    this.rowDrop();
  },

  methods: {
    expose_getTableData() {
      return this.tableData;
    },

    expose_getFuzzyFieldSearchConfig() {
      return this.originFuzzyFieldSearchConfig;
    },

    expose_setFuzzyFieldSearchConfig(obj) {
      this.originFuzzyFieldSearchConfig = obj;
    },

    expose_getFormDesignData() {
      return this.formDesignData;
    },

    init() {
      this.tableData = [];
    },

    updateOriginFuzzyFieldSearchConfig(obj) {
      this.originFuzzyFieldSearchConfig = obj;
    },

    handleShowField() {
      this.filterShowField = !this.filterShowField;
    },

    handleContentTextAttr(row) {
      this.curRowData = row;
      this.editableTabsValue = "0";
      if (row.contentTextAttrArr && row.contentTextAttrArr.length) {
        this.editableTabs = [];
        row.contentTextAttrArr.map((contentTextAttr, index) => {
          this.editableTabs.push({
            title: "渲染内容" + (index + 1),
            name: index + "",
            contentTextAttrForm: merge(new ContentTextAttrForm(), cloneDeep(contentTextAttr))
          });
        });
      } else {
        this.editableTabs = [
          {
            title: "渲染内容1",
            name: "0",
            contentTextAttrForm: new ContentTextAttrForm()
          }
        ];
      }
      this.contentTextAttrForm = this.editableTabs[this.editableTabsValue].contentTextAttrForm;
      console.log("1", this.editableTabs[this.editableTabsValue].contentTextAttrForm);
      this.dialogVisibleContentTextAttr = true;
    },
    // 处理设置控件属性事件
    handleWidgetAttr(row) {
      this.curRowData = row;
      this.$refs.setSearchWidgetAttrDlg.openDlg(row);
    },

    getSortNumb() {
      let number = 0;
      this.tableData
        .filter(item => typeof item.searchWidget === "number" && item.isSearchWidget)
        .map(item => {
          if (item.searchWidgetConfig.sortNumb > number) {
            number = item.searchWidgetConfig.sortNumb;
          }
        });
      return number + 2;
    },

    // 填充options的label
    supplementLabel(props, options) {
      const { key, label } = props;
      return options.map(item => {
        const obj = {};
        obj[key] = item[key];
        obj[label] = `${item[label]}(${item[key]})`;
        return obj;
      });
    },

    handleSummaryRow() {},

    handleFuzzySearch() {
      this.$refs.setSearchFieldDlg.openDlg(this.tableData, this.originFuzzyFieldSearchConfig);
    },

    rowDrop() {
      // 此时找到的元素是要拖拽元素的父容器
      const dom = document.querySelector(".el-table__body-wrapper tbody");
      this.Sortable.create(dom, {
        handle: ".renderwrap .my-handle",
        onEnd: e => {
          // e.oldIndex为拖动一行原来的位置，e.newIndex为拖动后新的位置
          const targetRow = this.finalTableData[e.oldIndex];
          const substitute = this.finalTableData[e.newIndex];
          const oldIndex = this.tableData.indexOf(targetRow);
          const newIndex = this.tableData.indexOf(substitute);
          this.tableData.splice(oldIndex, 1);
          this.tableData.splice(newIndex, 0, targetRow);
          console.log(e.oldIndex, e.newIndex);
        }
      });
    },

    checkUpBtnDisabled() {
      return this.selected.length === 0 || this.selected.some(item => this.tableData.indexOf(item) === 0);
    },

    checkDwonBtnDisabled() {
      const length = this.tableData?.length;
      return this.selected.length === 0 || this.selected.some(item => this.tableData.indexOf(item) === length - 1);
    },

    // TODO 选择多个进行上移或者下移（考虑情况太多，暂时不做）
    handleUpAndDwon(up) {
      const { tableData, selected } = this;
      if (selected.length > 1) {
        return this.$warn("暂时只支持单个操作");
      }
      const index = tableData.indexOf(selected[0]);
      const prev = tableData.slice(0, index);
      const next = tableData.slice(index + 1);
      if (up) {
        prev.splice(prev.length - 2, 0, selected[0]);
      } else {
        next.splice(1, 0, selected[0]);
      }
      this.tableData = prev.concat(next);
    },

    handleAdd(time) {
      for (let index = 0; index < time; index++) {
        this.tableData.push(
          getSingleTableData({ fieldName: "操作", show: true, sort: false, "show-overflow-tooltip": false, isCustom: true, random: `${Math.floor(Math.random() * 4000 + 1000)}` })
        );
      }
    },

    handleDelete() {
      if (this.selected.some(item => !item.isCustom)) {
        return this.$warn("不可删除非新增列！");
      }
      this.$confirm(`确认删除选中的数据吗?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.tableData = this.tableData.filter(tableItem => !this.selected.find(selectedItem => selectedItem === tableItem));
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除"
          });
        });
    },

    handleAddParent() {
      const { tableData, selected } = this;
      const parentNode = getSingleTableData();
      parentNode.fieldCode = "placeholders" + Math.floor(Math.random() * 4000 + 1000);
      selected.map((item, idx) => {
        const index = tableData.indexOf(item);
        if (parentNode.children) {
          parentNode.children.push(item);
        } else {
          parentNode.children = [item];
        }
        if (!idx) {
          tableData.splice(index, 1, parentNode);
        } else {
          tableData.splice(index, 1);
        }
      });
    },

    handleDelParent() {
      this.$confirm(`确认删除父级数据吗?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          const { tableData, selected } = this;
          selected
            .filter(item => item.children)
            .map(item => {
              const index = tableData.indexOf(item);
              const children = item.children || [];
              tableData.splice(index, 1, ...children);
            });
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除"
          });
        });
    },

    onSave(row) {
      // 推出编辑清空状态
      row.$edit = false;
      // this.$refs.table.expose_clearCurCellPro();
    },

    rowClick(val) {
      console.log(val);
    },

    selectListHandler(val) {
      this.selected = val;
      console.log(val);
    },

    handleCloseFrom() {
      this.dialogVisibleFrom = false;
      this.setupForm = {};
      this.setupFormOptions = [];
      this.wholeSQL = "";
      this.suggestSQL = "";
    },
    // 设置查询控件表单确认事件
    searchOptionsChange() {
      this.$emit("searchOptionsChange");
    },

    handleSaveSql(listPageId, wholeSQL) {
      this.saveSql(listPageId, wholeSQL);
    },

    handleCloseContentTextAttr() {
      this.dialogVisibleContentTextAttr = false;
    },

    confirmContentTextAttr() {
      this.curRowData.contentTextAttrArr = this.editableTabs.map(tab => tab.contentTextAttrForm);
      this.handleCloseContentTextAttr();
    },

    handleHideAll() {
      this.tableData.forEach(row => (row.show = false));
    },

    handleShowAll() {
      this.tableData.forEach(row => (row.show = true));
    },
    setColor(color) {
      this.contentTextAttrForm.color = color;
    },
    handleTabsEdit(targetName, action) {
      if (action === "add") {
        const newTabName = this.editableTabs.length;
        this.editableTabs.push({
          title: "渲染内容" + (newTabName + 1),
          name: newTabName + "",
          contentTextAttrForm: new ContentTextAttrForm()
        });
        this.editableTabsValue = newTabName + "";
      }
      if (action === "remove") {
        this.editableTabs = this.editableTabs
          .filter(tab => tab.name !== targetName)
          .map((tab, index) => {
            tab.name = `${index}`;
            tab.title = "渲染内容" + (index + 1);
            return tab;
          });
        const activeName = this.editableTabsValue;
        if (activeName > targetName) {
          this.editableTabsValue = --this.editableTabsValue + "";
        }
        if (activeName === targetName) {
          if (activeName === this.editableTabs.length + "") {
            this.editableTabsValue = --this.editableTabsValue + "";
          } else {
            this.contentTextAttrForm = this.editableTabs[this.editableTabsValue].contentTextAttrForm;
          }
        }
      }
    }
  }
};
</script>

<style lang="less" scoped>
.wrap {
  height: 100%;
  background: #fff;
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

.flexCenter {
  display: flex;
  align-items: center;
}

.code {
  float: right;
  color: #999;
}

.colorRed {
  color: #ef5b5b;
}

.sql {
  width: 350px;
  min-height: 70px;
  font-size: 14px;
  line-height: 20px;
  border: 1px solid #dcdfe6;
}

.operate {
  margin-left: 20px;
  padding-top: 20px;
  display: flex;
  // justify-content: center;
  align-items: center;
}

.edit {
  position: fixed;
  top: 20%;
  left: 0;
  right: 0;
  z-index: 999;
}

.renderwrap {
  height: calc(100% - 20px);
  padding: 20px;
}

.marginLeft10 {
  margin-left: 10px;
}

.fullHeight {
  height: 100%;
  overflow: auto;
}

.color78 {
  color: #787878;
}

.fontSize14 {
  font-size: 14px;
}
</style>
