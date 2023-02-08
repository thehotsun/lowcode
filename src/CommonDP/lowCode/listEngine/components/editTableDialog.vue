<template>
  <el-dialog :title="title" :visible.sync="dialogVisible" :close-on-click-modal="false" :close-on-press-escape="false"
    width="1400px" :before-close="handleClose">
    <div class="content">
      <setup-table ref="table" :table-data.sync="tableData" :table-options="tableOptions" edit-mode
        @selection-change="selectListHandler">
        <template #operator="{ row }">
          <el-button :disabled="row.searchWidget === ''" @click.stop.prevent="handleWidgetAttr(row)">
            设置控件属性
          </el-button>
        </template>
      </setup-table>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="confirm">确定</el-button>
    </span>
    <el-dialog title="设置搜索控件属性" :visible.sync="dialogVisibleFrom" :close-on-click-modal="false"
      :close-on-press-escape="false" width="900px" :before-close="handleClose" append-to-body>
      <base-render-form ref="setupForm" :form-data="setupForm" :form-options="setupFormOptions" :use-dialog="false">
      </base-render-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleCloseFrom">取消</el-button>
        <el-button type="primary" @click="confirmFrom">确定</el-button>
      </span>
    </el-dialog>
  </el-dialog>
</template>

<script>
import BaseRenderForm from '@/CommonDP/utils/commonRender/BaseRenderForm/index';
import { eidtConf as tableOptions, getSingleTableData } from '@/CommonDP/utils/commonRender/baseConfig/tableBaseConfig';
import setupTable from '@/CommonDP/utils/commonRender/components/setupTable';
import { align, searchWidget } from '@/CommonDP/utils/commonRender/baseConfig/tableSelectConfigs';
import { setPlaceholder, getWidgetOptions, getFormItemEmptyConfig, str2obj } from '@/CommonDP/utils/commonRender/utils';

export default {
  components: { setupTable, BaseRenderForm },
  data () {
    return {
      dialogVisible: false,
      tableOptions,
      tableData: [getSingleTableData(), getSingleTableData()],
      dialogVisibleFrom: false,
      setupForm: {
      },
      setupFormOptions: [],
      curRowData: {}
    }
  },
  props: {
    title: {
      type: String,
      default: '新增'
    }
  },
  methods: {
    expose_showDialog () {
      this.dialogVisible = true
    },
    handleClose () {
      this.dialogVisible = false
    },
    confirm () {
      this.$emit('refreshList')
    },
    onSave (row) {
      // 推出编辑清空状态
      row.$edit = false;
      this.$refs.table.expose_clearCurCellPro();
    },
    selectListHandler (val) {
      console.log(val);
    },
    handleWidgetAttr (row) {
      this.curRowData = row;
      this.dialogVisibleFrom = true;
      const searchWidgetName = searchWidget.find((widgetitem) => widgetitem.id === row.searchWidget)?.tagName;
      this.setupFormOptions = this.composeFormOptions(searchWidgetName);
      this.setupForm = this.getSetupForm(searchWidgetName)
    },
    // 设置searchForm和装配fromOptions
    composeFormOptions (searchWidgetName) {
      let formOptions = [];
      // 只有搜索控件有值，才会添加到options中
      if (searchWidgetName) {
        formOptions = this.getFormOptions(searchWidgetName)
      }
      return [{
        elRowAttrs: {
          gutter: 10
        },
        formItem: formOptions
      }];
    },

    getSetupForm (searchWidgetName) {
      switch (searchWidgetName) {
        case "el-input": case "el-date-picker": case "el-date-picker-range":
          return {
            formItemAttrs: {
              label: ''
            },
            tagAttrs: {
              placeholder: '',
            },
          }
        case "el-select":
          return {
            formItemAttrs: {
              label: ''
            },
            tagAttrs: {
              placeholder: '',
            },
            extraOption: '',
          }
        default:
          console.warn(`您输入的标签 ${searchWidgetName} 暂不支持！`);
          break;
      }
    },
    getSingleConfig (label, placeholder, formField, customAttr = {}, tagName = 'el-input') {
      const baseConfig = getFormItemEmptyConfig();
      baseConfig.formField = formField
      baseConfig.tagName = tagName
      baseConfig.formItemAttrs.label = label;
      baseConfig.tagAttrs.placeholder = placeholder;
      return _.merge(baseConfig, customAttr)
    },
    getFormOptions (searchWidgetName) {
      const { getSingleConfig } = this
      switch (searchWidgetName) {
        case "el-input": case "el-date-picker": case "el-date-picker-range":
          return [
            getSingleConfig('标签名：', '请输入标签名', 'formItemAttrs.label'), getSingleConfig('提示语：', '请输入提示语', 'tagAttrs.placeholder')]

        case "el-select":
          return [
            getSingleConfig('标签名：', '请输入标签名', 'formItemAttrs.label'), getSingleConfig('提示语：', '请输入提示语', 'tagAttrs.placeholder'), getSingleConfig('下拉选择列表', '请输入下拉选择列表', 'extraOption', {
              tagAttrs: {
                autosize: true,
                type: 'textarea',
                placeholder: '请输入类似{options: [],props: {key: "id",label: "cnName"}}的结构'
              },
            }),]

        default:
          console.warn(`您输入的标签 ${searchWidgetName} 暂不支持！`);
          break;
      }
    },

    handleCloseFrom () {
      this.dialogVisibleFrom = false;
      this.setupFormOptions = [];
      this.setupForm = {}
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

<style lang="stylus" rel="stylesheet/stylus" scoped>

</style>
