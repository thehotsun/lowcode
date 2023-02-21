<template>
  <el-container>
    <!-- <el-header>
              <div class="operate">
                <el-button size='small' type="primary" @click="handleAdd(1)">新增一条</el-button>
                <el-button size='small' type="primary" @click="handleAdd(5)">新增五条</el-button>
                <el-button size='small' type="danger" :disabled="!selected.length" @click="handleDelete">删除</el-button>
                <el-button size='small' type="" :disabled="checkUpBtnDisabled()" @click="handleUpAndDwon(-1)">上移</el-button>
                <el-button size='small' type="" :disabled="checkDwonBtnDisabled()" @click="handleUpAndDwon(1)">下移</el-button>
                <el-button size='small' type="primary" @click.stop.prevent="handleOpenFormDesign()">
                  新增功能按钮
                </el-button>
                <slot name="btn"></slot>
              </div>
            </el-header> -->

    <el-main>
      <el-container style="height: 100%">
        <el-main>
          <base-render-table ref="table" :table-data="tableData" :table-options="tableOptions" edit-mode
            @selection-change="selectListHandler" style="height: 450px;overflow:auto">
            <!-- 注意这里的slot值要和tableOptions中配置的slotName一致 -->
            <!-- #operator是简写，详细请查阅vue文档 -->
            <template #setupWidget="{ row }">
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
    <!-- <el-dialog title="表单设计器" :visible.sync="designerDialog" :close-on-click-modal="false"
              :close-on-press-escape="false"  width="92%" top="8vh" :before-close="handleClose" append-to-body>
              <fc-designer ref="fcdesigner" @saveData="onFromDesignSave"></fc-designer>
            </el-dialog> -->
  </el-container>
</template>

<script>

import BaseRenderTable from '../BaseRenderTable/index';
import BaseRenderForm from '../BaseRenderForm/index';
import { getSingleTableData ,  eidtConf as tableOptions } from '../../baseConfig/tableBaseConfig'
import { align, searchWidget } from '../../baseConfig/tableSelectConfigs';
import { setPlaceholder, getWidgetOptions, getFormItemEmptyConfig, str2obj } from '../../utils';


export default {
  name: 'setupTable',
  components: {
    BaseRenderTable,
    BaseRenderForm,
  },
  props: {
    tableData: Array,
    parseJson: {
      type: Function,
      require: true
    },
  },
  data () {
    return {
      tableOptions,
      selected: [],
      formDesignData: {},
      designerDialog: false
    };
  },

  mounted () {
    // this.init()
  },

  methods: {

    expose_getFormDesignData () {
      return this.formDesignData
    },

    init () {
      this.tableData = [getSingleTableData(), getSingleTableData()]
    },

    checkUpBtnDisabled () {
      return this.selected.length === 0 || this.selected.some(item => this.tableData.indexOf(item) === 0)
    },

    checkDwonBtnDisabled () {
      const length = this.tableData.length
      return this.selected.length === 0 || this.selected.some(item => this.tableData.indexOf(item) === length - 1)
    },

    // TODO 选择多个进行上移或者下移（考虑情况太多，暂时不做）
    handleUpAndDwon (offset) {
      const { tableData, selected } = this;
      if (selected.length > 1) {
        return this.$warn('暂时只支持单个操作')
      }
      let index = tableData.indexOf(selected[0])
      var temp = tableData[index + offset]
      this.$set(tableData, index + offset, tableData[index])
      this.$set(tableData, index, temp)
    },

    handleAdd (time) {
      for (let index = 0; index < time; index++) {
        this.tableData.push(getSingleTableData())
      }
    },

    handleDelete () {
      this.tableData = this.tableData.filter(tableItem => !this.selected.find(selectedItem => selectedItem === tableItem))
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

    // handleOpenFormDesign () {
    //   this.designerDialog = true;
    //   // this.setDesigner()
    // },
    // // 打开设计器
    // setDesigner () {
    //   this.$refs.fcdesigner.setRule(this.parseJson(JSON.stringify(FcDesignerRule)));
    //   this.$refs.fcdesigner.setOption(this.parseJson(JSON.stringify(FcDesignerOptions)));
    // },

    // handleClose () {
    //   this.designerDialog = false;
    // },

    // onFromDesignSave (FcDesignerRule, FcDesignerOptions) {
    //   this.formDesignData = {
    //     FcDesignerRule,
    //     FcDesignerOptions,
    //   }
    //   this.handleClose()
    // }
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
