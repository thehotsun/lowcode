<template>
  <div class="wrap" style="height: 100%; backg">
    <!-- <el-header> -->
    <div class="operate">
      <!-- <el-button size='small' type="primary" @click="handleAdd(1)">新增一条</el-button> -->
      <!-- <el-button size='small' type="primary" @click="handleAdd(5)">新增五条</el-button> -->
      <el-button size='small' type="primary" :disabled="!selected.length" @click="handleAddParent">新增父级</el-button>
      <el-button size='small' type="danger" :disabled="!selected.length" @click="handleDelParent">删除父级</el-button>
      <!-- <el-button size='small' type="danger" :disabled="!selected.length" @click="handleDelete">删除</el-button> -->
      <!-- <el-button size='small' type="" :disabled="checkUpBtnDisabled()" @click="handleUpAndDwon(true)">上移</el-button>
        <el-button size='small' type="" :disabled="checkDwonBtnDisabled()" @click="handleUpAndDwon(false)">下移</el-button> -->
      <slot name="btn"></slot>
    </div>
    <!-- </el-header> -->

    <!-- <el-main> -->
    <div class="renderwrap">
      <!-- <el-main> -->
      <base-render-table ref="table" :table-data="tableData" :table-options="tableOptions" edit-mode row-key="fieldCode"
        border @selection-change="selectListHandler" :row-style="{ height: '40px' }" :cell-style="{ padding: '4px' }"
        height="100%" style="height: 100%;overflow:auto">
        <!-- 注意这里的slot值要和tableOptions中配置的slotName一致 -->
        <!-- #operator是简写，详细请查阅vue文档 -->
        <template #setupWidget="{ row }">
          <el-button :disabled="row.searchWidget === ''" @click.stop.prevent="handleWidgetAttr(row)">
            设置
          </el-button>
          <slot name="setupWidget" :row="row"></slot>
        </template>
        <template #operator="{ row }">
          <el-button v-if="row.$edit" @click.stop.prevent="onSave(row)">
            保存
          </el-button>
          <slot name="operator" :row="row"></slot>
        </template>
      </base-render-table>
      <!-- </el-main> -->
    </div>
    <!-- </el-main> -->
    <el-dialog title="设置搜索控件属性" :visible.sync="dialogVisibleFrom" :close-on-click-modal="false"
      :close-on-press-escape="false" width="500px" v-dialogDrag :before-close="handleCloseFrom" append-to-body>
      <base-render-form ref="setupForm" :form-data="setupForm" :form-options="setupFormOptions" :use-dialog="false"
        :showFooter="false">
      </base-render-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleCloseFrom">取消</el-button>
        <el-button type="primary" @click="confirmFrom">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>

import BaseRenderTable from '../../../../packages/BaseRenderTable/index';
import BaseRenderForm from '../../../../packages/BaseRenderForm/index';
import { getSingleTableData, editConf as tableOptions } from '../../../../baseConfig/tableBaseConfig'
import { searchWidget } from '../../../../baseConfig/tableSelectConfigs';
import {
  str2obj, getSetupForm,
  getSetupFormOptions, setPlaceholder
} from '../../../../utils';
import { cloneDeep } from "lodash"
import Sortable from "sortablejs"

export default {
  name: 'singleSetupTable',
  components: {
    BaseRenderTable,
    BaseRenderForm,
  },
  props: {
    rawTableData: Array,
  },
  data () {
    return {
      tableOptions,
      selected: [],
      formDesignData: {},
      dialogVisibleFrom: false,
      setupForm: {
      },
      setupFormOptions: [],
      curRowData: {},
      tableData: []
    };
  },

  watch: {
    rawTableData (val) {
      this.tableData = val;
    },
  },

  mounted () {
    this.rowDrop()
  },

  methods: {
    expose_getTableData () {
      return this.tableData
    },

    expose_getFormDesignData () {
      return this.formDesignData
    },

    init () {
      this.tableData = []
    },

    handleWidgetAttr (row) {
      if (row.searchWidget === '') {
        return this.$warn('请先选择控件')
      }
      this.curRowData = row;
      this.dialogVisibleFrom = true;
      const searchWidgetName = searchWidget.find((widgetitem) => widgetitem.id === row.searchWidget)?.tagName;
      this.setupFormOptions = this.composeFormOptions(searchWidgetName, row);
      const searchWidgetConfig = row.searchWidgetConfig
      this.setupForm = Object.keys(searchWidgetConfig).length ? cloneDeep(searchWidgetConfig) : this.getDefaultValueForm(searchWidgetName, row.fieldName)
      if (this.setupForm.extraOption) this.setupForm.extraOption = JSON.stringify(this.setupForm.extraOption)
    },

    getDefaultValueForm (searchWidgetName, fieldName) {
      const form = getSetupForm(searchWidgetName)
      form.formItemAttrs.label = fieldName;
      form.tagAttrs.placeholder = setPlaceholder(searchWidgetName, fieldName);
      return form
    },

    supplementLabel (props, options) {
      const { key, label } = props
      return options.map(item => {
        item[label] = `${item[label]}(${item[key]})`
        return item
      })
    },

    // 设置searchForm和装配fromOptions
    composeFormOptions (searchWidgetName, row) {
      let formOptions = [];
      // 只有搜索控件有值，才会添加到options中
      if (searchWidgetName) {
        formOptions = getSetupFormOptions(searchWidgetName)
      }
      // 如果是输入框，则考虑关联其他字段，在这里进行填充 el-select的options
      if (searchWidgetName === 'el-input') {
        const target = formOptions.find(item => item.formField === 'relateOtherField')
        const options = this.tableData.filter(item => item.fieldCode !== row.fieldCode && item.searchWidget === '' && item.show);
        const props = { key: 'fieldCode', label: 'fieldName' }
        target.extraOption = {
          props,
          // 去除自己和已存在筛选框的和未显示的
          options: this.supplementLabel(props, options)
        }
      }
      return [{
        elRowAttrs: {
          gutter: 10
        },
        formItem: formOptions
      }];
    },

    rowDrop () {
      // 此时找到的元素是要拖拽元素的父容器
      const tbody = document.querySelector('.el-table__body-wrapper tbody');
      let tableData = this.tableData;
      Sortable.create(tbody, {
        ghostClass: 'sortable-ghost',
        setData: function (dataTransfer) {
          dataTransfer.setData('Text', '')
        },
        onEnd: e => {
          //e.oldIndex为拖动一行原来的位置，e.newIndex为拖动后新的位置
          const targetRow = tableData.splice(e.oldIndex, 1)[0];
          tableData.splice(e.newIndex, 0, targetRow);
        }
      })
    },

    checkUpBtnDisabled () {
      return this.selected.length === 0 || this.selected.some(item => this.tableData.indexOf(item) === 0)
    },

    checkDwonBtnDisabled () {
      const length = this.tableData?.length
      return this.selected.length === 0 || this.selected.some(item => this.tableData.indexOf(item) === length - 1)
    },

    // TODO 选择多个进行上移或者下移（考虑情况太多，暂时不做）
    handleUpAndDwon (up) {
      const { tableData, selected } = this;
      if (selected.length > 1) {
        return this.$warn('暂时只支持单个操作')
      }
      let index = tableData.indexOf(selected[0])
      const prev = tableData.slice(0, index);
      const next = tableData.slice(index + 1);
      if (up) {
        prev.splice(prev.length - 2, 0, selected[0])
      } else {
        next.splice(1, 0, selected[0])
      }
      this.tableData = prev.concat(next)
    },

    handleAdd (time) {
      for (let index = 0; index < time; index++) {
        this.tableData.push(getSingleTableData())
      }
    },

    handleDelete () {
      this.$confirm(`确认删除选中的数据吗?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then((result) => {
        this.tableData = this.tableData.filter(tableItem => !this.selected.find(selectedItem => selectedItem === tableItem))
      }).catch((err) => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        });
      });
    },

    handleAddParent () {
      const { tableData, selected } = this;
      const parentNode = getSingleTableData()
      parentNode.fieldCode = 'placeholders' + Math.floor(Math.random() * 4000 + 1000)
      selected.map((item, idx) => {
        const index = tableData.indexOf(item)
        if (parentNode.children) {
          parentNode.children.push(item)
        } else {
          parentNode.children = [item]
        }
        if (!idx) {
          tableData.splice(index, 1, parentNode)
        } else {
          tableData.splice(index, 1)
        }
      })
    },

    handleDelParent () {
      this.$confirm(`确认删除父级数据吗?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then((result) => {
        const { tableData, selected } = this;
        selected.filter(item => item.children).map((item, idx) => {
          const index = tableData.indexOf(item)
          const children = item.children || []
          tableData.splice(index, 1, ...children)
        })
      }).catch((err) => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        });
      });

    },

    onSave (row) {
      // 推出编辑清空状态
      row.$edit = false
      // this.$refs.table.expose_clearCurCellPro();
    },

    rowClick (val) {
      console.log(val);
    },

    selectListHandler (val) {
      this.selected = val;
      console.log(val);
    },

    handleCloseFrom () {
      this.dialogVisibleFrom = false;
    },

    confirmFrom () {
      if (this.setupForm.extraOption) {
        this.setupForm.extraOption = str2obj(this.setupForm.extraOption)
      }
      this.curRowData.searchWidgetConfig = this.setupForm
      this.handleCloseFrom();
    },
  }
};
</script>

<style lang="less" scoped>
.wrap {
  height: 100%;
  background: #fff;
  margin-top: 10px;
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
</style>
