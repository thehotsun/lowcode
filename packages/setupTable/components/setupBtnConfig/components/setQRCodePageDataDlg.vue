<template>
  <el-dialog
    v-if="showDlg"
    v-dialogDrag
    title="设置页面显示数据"
    :visible.sync="showDlg"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="800px"
    :before-close="handleClose"
    append-to-body
  >
    <div class="flex">
      <el-button type="" size="mini" @click="handleShow"> {{ onlyShow ? "列出全部字段" : "仅列出显示字段" }} </el-button>
      <el-input v-model="keyword" class="w200" placeholder="请输入标题或内容查询" size="small" clearable>
        <i slot="suffix" class="el-input__icon el-icon-search"></i>
      </el-input>
    </div>
    <div class="setQRCodePageDataDlg">
      <base-render-table
        ref="table"
        :key="tableKey"
        :table-data="finalTableData"
        :table-options="tableOptions"
        edit-mode
        :row-key="row => row.fieldCode || row.random"
        border
        class="fullHeight"
        :row-style="{ height: '40px' }"
        :cell-style="{ padding: '4px' }"
        height="500"
      >
      </base-render-table>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button type="" size="mini" @click="handleClose">取消</el-button>
        <el-button type="primary" size="mini" @click="handleConfirm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { cloneDeep } from "lodash";

const baseAttr = {
  tagName: "el-input",
  align: "center",
  "min-width": "80px",
  tagAttrs: {
    placeholder: "请输入",
    maxlength: ""
  },
  style: {
    width: "100%"
  }
};
export default {
  props: {},
  data() {
    return {
      onlyShow: false,
      keyword: "",
      tableKey: 1,
      showDlg: false, // 补全变量
      tableData: [], // 补全变量
      tableOptions: [
        {
          tagName: "i",
          label: "",
          align: "center",
          className: "iconfont icon-drag drag-option my-handle",
          style: "cursor: pointer",
          width: "50"
        },
        {
          ...baseAttr,
          label: "字段名称",
          prop: "fieldName",
          disabled: true,
          "min-width": "120"
        },
        {
          ...baseAttr,
          label: "标题",
          prop: "fieldDisplayName",
          disabled: true,
          "min-width": "150"
        },
        {
          ...baseAttr,
          label: "显示",
          prop: "show",
          "min-width": "70",
          tagName: "el-switch",
          sortable: true
        }
      ]
    };
  },
  computed: {
    finalTableData() {
      let tableData = this.tableData;
      if (this.onlyShow) {
        tableData = tableData.filter(item => item.show);
        console.log(tableData, "tableData");
      }
      if (this.keyword) {
        tableData = tableData.filter(item => item.fieldDisplayName.includes(this.keyword) || item.fieldName.includes(this.keyword));
      }
      return tableData;
    }
  },
  watch: {
    keyword() {
      this.$nextTick(() => {
        this.tableKey++;
        this.tableDataCopy = this.tableDataCopy.map(item => {
          const target = this.tableData.find(rawItem => rawItem.fieldName === item.fieldName);
          item.show = target.show;
          return item;
        });
        this.tableData = cloneDeep(this.tableDataCopy);
        setTimeout(() => {
          this.sortableInstance?.destroy();
          this.rowDrop();
        }, 200);
      });
    },
    onlyShow() {
      this.$nextTick(() => {
        this.tableKey++;
        this.tableDataCopy = this.tableDataCopy.map(item => {
          const target = this.tableData.find(rawItem => rawItem.fieldName === item.fieldName);
          item.show = target.show;
          return item;
        });
        this.tableData = cloneDeep(this.tableDataCopy);
        setTimeout(() => {
          this.sortableInstance?.destroy();
          this.rowDrop();
        }, 200);
      });
    }
  },
  inject: {
    getTableDesignFields: {
      default: () => () => {
        console.warn("inject缺失getTableDesignFields!");
      }
    },
    Sortable: {
      default: () => {}
    }
  },
  mounted() {},
  methods: {
    handleShow() {
      this.onlyShow = !this.onlyShow;
    },
    rowDrop() {
      // 此时找到的元素是要拖拽元素的父容器
      const dom = document.querySelector(".setQRCodePageDataDlg .el-table__body-wrapper tbody");
      this.sortableInstance = this.Sortable.create(dom, {
        handle: ".setQRCodePageDataDlg .my-handle",
        onEnd: e => {
          let { oldIndex, newIndex } = e;
          if (oldIndex === newIndex) return;
          if (this.onlyShow || this.keyword) {
            const target1 = this.finalTableData[oldIndex];
            oldIndex = this.tableDataCopy.findIndex(item => item.fieldName === target1.fieldName);
            const target2 = this.finalTableData[newIndex];
            newIndex = this.tableDataCopy.findIndex(item => item.fieldName === target2.fieldName);
          }
          const movedItem = this.tableDataCopy[oldIndex];

          // 先删除旧元素，再插入新位置
          this.tableDataCopy.splice(oldIndex, 1);

          // 注意：如果是从前往后（上移），因为已经删除一个元素，newIndex 要减 1
          const adjustedIndex = oldIndex < newIndex ? newIndex : newIndex;
          this.tableDataCopy.splice(adjustedIndex, 0, movedItem);

          this.$nextTick(() => {
            console.log(
              "tableData updated:",
              this.tableDataCopy.map(item => item.fieldDisplayName)
            );
          });
        }
      });
    },
    openDlg(tableData) {
      this.showDlg = true;
      const allFields = cloneDeep(
        this.getTableDesignFields().map(item => {
          return {
            fieldName: item.fieldCode,
            fieldDisplayName: item.fieldName,
            show: false
          };
        })
      );
      this.tableData = tableData?.length ? this.syncFields(allFields, tableData) : allFields;
      this.tableDataCopy = cloneDeep(this.tableData);
      this?.sortableInstance?.destroy();
      this.$nextTick(() => {
        this.rowDrop();
      });
    },
    syncFields(allFields, tableData) {
      const allMap = new Map(allFields.map(item => [item.fieldName, item]));

      // 更新已有项（保留排序）
      const updatedTable = tableData
        .filter(item => allMap.has(item.fieldName)) // 删除多余的
        .map(item => {
          const newItem = allMap.get(item.fieldName);
          return {
            ...item,
            fieldDisplayName: newItem.fieldDisplayName, // 更新显示名
            show: item.show // 保持原 show
          };
        });

      // 添加新增项（不在 tableData 中的）
      const addedFields = allFields.filter(item => !tableData.some(t => t.fieldName === item.fieldName));

      return [...updatedTable, ...addedFields];
    },

    handleClose() {
      this.showDlg = false;
      this.sortableInstance.destroy();
      this.sortableInstance = null;
    },

    handleConfirm() {
      this.$emit(
        "ok",
        this.tableDataCopy.map(item => this.tableData.find(i => i.fieldName === item.fieldName)).filter(item => item.show)
      );
      this.handleClose();
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
.fullHeight {
  height: 100%;
  overflow: auto;
}
.flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}
.w200 {
  width: 200px;
}
</style>
