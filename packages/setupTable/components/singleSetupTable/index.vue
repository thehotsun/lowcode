<template>
  <el-container style="height: 100%">
    <el-header>
      <div class="operate">
        <el-button size='small' type="primary" @click="handleAdd(1)">新增一条</el-button>
        <el-button size='small' type="primary" @click="handleAdd(5)">新增五条</el-button>
        <el-button size='small' type="primary" :disabled="!selected.length" @click="handleAddParent">新增父级</el-button>
        <el-button size='small' type="danger" :disabled="!selected.length" @click="handleDelete">删除</el-button>
        <el-button size='small' type="" :disabled="checkUpBtnDisabled()" @click="handleUpAndDwon(true)">上移</el-button>
        <el-button size='small' type="" :disabled="checkDwonBtnDisabled()" @click="handleUpAndDwon(false)">下移</el-button>
        <slot name="btn"></slot>
      </div>
    </el-header>

    <el-main>
      <el-container style="height: 100%">
        <el-main>
          <base-render-table ref="table" :table-data="tableData" :table-options="tableOptions" edit-mode
            row-key="fieldName" @selection-change="selectListHandler" style="height: 100%;overflow:auto">
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
        </el-main>
      </el-container>
    </el-main>
    <el-dialog title="设置搜索控件属性" :visible.sync="dialogVisibleFrom" :close-on-click-modal="false"
      :close-on-press-escape="false" width="900px" :before-close="handleCloseFrom" append-to-body>
      <base-render-form ref="setupForm" :form-data="setupForm" :form-options="setupFormOptions" :use-dialog="false"
        :showFooter="false">
      </base-render-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleCloseFrom">取消</el-button>
        <el-button type="primary" @click="confirmFrom">确定</el-button>
      </span>
    </el-dialog>
  </el-container>
</template>

<script>

import BaseRenderTable from '../../../../packages/BaseRenderTable/index';
import BaseRenderForm from '../../../../packages/BaseRenderForm/index';
import { getSingleTableData, eidtConf as tableOptions } from '../../../../baseConfig/tableBaseConfig'
import { searchWidget } from '../../../../baseConfig/tableSelectConfigs';
import {
  str2obj, getSetupForm,
  getSetupFormOptions,
} from '../../../../utils';
import { cloneDeep } from "lodash"

export default {
  name: 'singleSetupTable',
  components: {
    BaseRenderTable,
    BaseRenderForm,
  },
  props: {
    rawTableData: Array,
    parseJson: {
      type: Function,
      require: true
    }
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
    // this.init()
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
      } else if (row.searchWidget === -1) {
        row.searchWidgetConfig = {}
        return this.$success('取消成功')
      }
      this.curRowData = row;
      this.dialogVisibleFrom = true;
      const searchWidgetName = searchWidget.find((widgetitem) => widgetitem.id === row.searchWidget)?.tagName;
      this.setupFormOptions = this.composeFormOptions(searchWidgetName);
      this.setupForm = Object.keys(row.searchWidgetConfig).length ? cloneDeep(row.searchWidgetConfig) : getSetupForm(searchWidgetName)
      if (this.setupForm.extraOption) this.setupForm.extraOption = JSON.stringify(this.setupForm.extraOption)
    },
    // 设置searchForm和装配fromOptions
    composeFormOptions (searchWidgetName) {
      let formOptions = [];
      // 只有搜索控件有值，才会添加到options中
      if (searchWidgetName) {
        formOptions = getSetupFormOptions(searchWidgetName)
      }
      return [{
        elRowAttrs: {
          gutter: 10
        },
        formItem: formOptions
      }];
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
      this.tableData = this.tableData.filter(tableItem => !this.selected.find(selectedItem => selectedItem === tableItem))
    },

    handleAddParent () {
      const { tableData, selected } = this;
      const parentNode = getSingleTableData()
      parentNode.fieldCode = 'placeholders'
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

<style lang="scss" scoped>
.wrap {
  width: 100%;
}

.operate {
  margin-left: 20px;
  margin-top: 20px;
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
</style>
