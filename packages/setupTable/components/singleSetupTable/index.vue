<template>
  <div class="wrap" style="height: 100%;">
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
        <template #setupFilterArr="{ row }">
          <el-button type="text" icon="el-icon-edit" :class="checkIsConfig(row) ? 'colorRed' : ''" @click.stop.prevent="handleFilterAttr(row)">
            {{ checkIsConfig(row) ? "修改" : "设置" }}
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

    <setClickActionAndShowContentDlg ref="setClickActionAndShowContentDlg" :list-page-id="listPageId" :btn-config-arr="btnConfigArr"></setClickActionAndShowContentDlg>

    <setFilterConfigDlg ref="setFilterConfigDlg" :list-page-id="listPageId" :btn-config-arr="btnConfigArr" @handleSave="handleSave"></setFilterConfigDlg>
  </div>
</template>

<script>
import BaseRenderTable from "../../../../packages/BaseRenderTable/index";

import { getSingleTableData, editConf as tableOptions, FiltersConfig } from "../../../../baseConfig/tableBaseConfig";
import { isEqual } from "lodash";
import setSearchWidgetAttrDlg from "./setSearchWidgetAttrDlg.vue";
import setSearchFieldDlg from "./setSearchFieldDlg.vue";
import setClickActionAndShowContentDlg from "./setClickActionAndShowContentDlg.vue";
import setFilterConfigDlg from "./setFilterConfigDlg.vue";
export default {
  name: "SingleSetupTable",
  components: {
    BaseRenderTable,
    setSearchWidgetAttrDlg,
    setSearchFieldDlg,
    setClickActionAndShowContentDlg,
    setFilterConfigDlg
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
    rawFuzzyFieldSearchConfig: {
      type: Object,
      default: () => {
        return {};
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
      isEqual,
      tableOptions,
      selected: [],
      formDesignData: {},
      rawFiltersConfig: new FiltersConfig(),
      curRowData: {},
      tableData: [],
      flatTableData: [],
      filterShowField: false,
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
      const setParentId = (children, parentId, parent) => {
        children.forEach(child => {
          child.parentId = parentId;
          child.parent = parent;
          if (child.children?.length) {
            setParentId(child.children, child.fieldCode, child);
          }
        });
      };
      this.tableData = val.map(item => {
        const newItem = {
          ...getSingleTableData(),
          ...item
        };
        if (newItem?.children?.length) {
          setParentId(newItem.children, newItem.fieldCode, newItem);
        }
        return newItem;
      });
      this.flatTableData = this.getFlatTableData(this.tableData);
    },
    rawFuzzyFieldSearchConfig(val) {
      if (val) {
        this.originFuzzyFieldSearchConfig = val;
      } else {
        this.originFuzzyFieldSearchConfig = {
          placeholder: "",
          searchFieldList: []
        };
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

    getFlatTableData(treeData = this.tableData) {
      const result = [];

      const traverse = nodes => {
        nodes.forEach(node => {
          result.push(node); // 添加当前节点
          if (node.children?.length) {
            traverse(node.children); // 递归子节点
          }
        });
      };

      traverse(treeData);
      return result;
    },

    checkIsConfig(row) {
      return row.filters || !isEqual({ ...new FiltersConfig(), ...row.filtersConfig }, this.rawFiltersConfig);
    },

    updateOriginFuzzyFieldSearchConfig(obj) {
      this.originFuzzyFieldSearchConfig = obj;
    },

    handleContentTextAttr(row) {
      this.curRowData = row;
      this.$refs.setClickActionAndShowContentDlg.openDlg(row);
    },

    handleSave({ filters, filtersConfig }) {
      this.curRowData.filters = filters;
      this.curRowData.filtersConfig = filtersConfig;
    },

    handleFilterAttr(row) {
      this.curRowData = row;
      this.$refs.setFilterConfigDlg.openDlg(row);
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

    handleSummaryRow() {},

    handleFuzzySearch() {
      this.$refs.setSearchFieldDlg.openDlg(this.tableData, this.originFuzzyFieldSearchConfig);
    },

    rowDrop() {
      // 此时找到的元素是要拖拽元素的父容器
      const dom = document.querySelector(".renderwrap .el-table__body-wrapper tbody");
      this.Sortable.create(dom, {
        handle: ".renderwrap .my-handle",
        onMove: evt => {
          const targetRowFieldCode = evt.dragged.querySelectorAll(".cell")[2].innerText;
          const substituteFieldCode = evt.related.querySelectorAll(".cell")[2].innerText;
          // console.log(evt, targetRowFieldCode, substituteFieldCode);
          const oldRow = this.flatTableData.find(item => item.fieldCode === targetRowFieldCode || item.random === targetRowFieldCode);
          const newRow = this.flatTableData.find(item => item.fieldCode === substituteFieldCode || item.random === substituteFieldCode);
          // console.log(oldRow, newRow);
          // 判断是否为同一个父节点（假设你有 parentId 字段）
          return oldRow.parentId === newRow.parentId;
        },
        onEnd: e => {
          if (e.oldIndex === e.newIndex) {
            return;
          }
          const listEl = e.from.querySelectorAll("tr");
          const targetRowEl = e.item;
          const substituteEl = listEl[e.oldIndex > e.newIndex ? e.newIndex + 1 : e.newIndex - 1];
          const targetRowFieldCode = targetRowEl.querySelectorAll(".cell")[2].innerText;
          const substituteFieldCode = substituteEl.querySelectorAll(".cell")[2].innerText;
          // e.oldIndex为拖动一行原来的位置，e.newIndex为拖动后新的位置
          // const targetRow = this.finalTableData[e.oldIndex];
          // const substitute = this.finalTableData[e.newIndex];
          const oldIndex = this.tableData.findIndex(item => item.fieldCode === targetRowFieldCode || item.random === targetRowFieldCode);
          const newIndex = this.tableData.findIndex(item => item.fieldCode === substituteFieldCode || item.random === substituteFieldCode);
          console.log(e.oldIndex, e.newIndex);

          if (oldIndex !== -1 && newIndex !== -1) {
            const [targetRow] = this.tableData.splice(oldIndex, 1);
            this.tableData.splice(newIndex, 0, targetRow);
            console.log(targetRowFieldCode, substituteFieldCode, oldIndex, newIndex, this.tableData);
          } else {
            const targetRow = this.flatTableData[e.oldIndex];
            const substitute = this.flatTableData[e.newIndex];
            console.log("targetRow, substitute,", targetRow, substitute);

            const oldIndex = targetRow.parent.children.findIndex(item => item === targetRow);
            const newIndex = substitute.parent.children.findIndex(item => item === substitute);
            targetRow.parent.children.splice(oldIndex, 1);
            substitute.parent.children.splice(newIndex, 0, targetRow);
            console.log(oldIndex, newIndex, targetRow.parent);
          }

          this.flatTableData = this.getFlatTableData(this.tableData);
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
        item.parent = parentNode;
        item.parentId = parentNode.fieldCode;
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
      this.flatTableData = this.getFlatTableData(this.tableData);
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
              const children = (item.children || []).map(child => {
                child.parent = undefined;
                child.parentId = undefined;
                return child;
              });
              tableData.splice(index, 1, ...children);
            });
          this.flatTableData = this.getFlatTableData(this.tableData);
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

    // 设置查询控件表单确认事件
    searchOptionsChange() {
      this.$emit("searchOptionsChange");
    },

    handleSaveSql(listPageId, wholeSQL) {
      this.saveSql(listPageId, wholeSQL);
    },

    handleHideAll() {
      this.tableData.forEach(row => (row.show = false));
    },

    handleShowAll() {
      this.tableData.forEach(row => (row.show = true));
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
  padding-top: 0px !important;
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
  padding: 10px 20px 0 20px;
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
