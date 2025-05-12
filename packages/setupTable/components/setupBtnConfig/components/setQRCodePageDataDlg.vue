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
    <div class="setQRCodePageDataDlg">
      <base-render-table
        ref="table"
        :table-data="tableData"
        :table-options="tableOptions"
        edit-mode
        :row-key="row => row.fieldCode || row.random"
        border
        class="fullHeight"
        :row-style="{ height: '40px' }"
        :cell-style="{ padding: '4px' }"
        height="100%"
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
          prop: "fieldCode",
          disabled: true,
          "min-width": "120"
        },
        {
          ...baseAttr,
          label: "标题",
          prop: "fieldName",
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
    rowDrop() {
      // 此时找到的元素是要拖拽元素的父容器
      const dom = document.querySelector(".setQRCodePageDataDlg .el-table__body-wrapper tbody");
      this.Sortable.create(dom, {
        handle: ".setQRCodePageDataDlg .my-handle",
        onEnd: e => {
          // e.oldIndex为拖动一行原来的位置，e.newIndex为拖动后新的位置
          const targetRow = this.tableData[e.oldIndex];
          const substitute = this.tableData[e.newIndex];
          const oldIndex = this.tableData.indexOf(targetRow);
          const newIndex = this.tableData.indexOf(substitute);
          this.tableData.splice(oldIndex, 1);
          this.tableData.splice(newIndex, 0, targetRow);
          console.log(e.oldIndex, e.newIndex);
        }
      });
    },
    openDlg(tableData) {
      this.showDlg = true;
      this.tableData = tableData?.length ? tableData : cloneDeep(this.getTableDesignFields());
      this.$nextTick(() => {
        this.rowDrop();
      });
    },
    handleClose() {
      this.showDlg = false;
    },

    handleConfirm() {
      this.$emit("ok", this.tableData);
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
</style>
