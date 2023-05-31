<template>
  <div class="wrap" style="height: 100%; backg">
    <!-- <el-header> -->
    <div class="operate">
      <!-- <el-button size='small' type="primary" @click="handleAdd(1)">新增一条</el-button> -->
      <!-- <el-button size='small' type="primary" @click="handleAdd(5)">新增五条</el-button> -->
      <el-button size="small" type="default" :disabled="!selected.length" @click="handleAddParent">新增父级</el-button>
      <el-button size="small" type="default" :disabled="!selected.length" @click="handleDelParent">删除父级</el-button>
      <el-button size="small" type="default" @click="handleFuzzySearch">设置搜索字段</el-button>
      <el-button size="small" type="default" @click="handleSummaryRow">设置统计行</el-button>
      <el-button size="small" type="default" @click="handleHideAll">隐藏所有</el-button>
      <el-button size="small" type="default" @click="handleShowAll">显示所有</el-button>
      <el-checkbox v-model="filterShowField" size="small" style="margin-left: 10px;">仅列出显示字段</el-checkbox>

      <!-- <el-button size='small' type="danger" :disabled="!selected.length" @click="handleDelete">删除</el-button> -->
      <!-- <el-button size='small' type="" :disabled="checkUpBtnDisabled()" @click="handleUpAndDwon(true)">上移</el-button>
        <el-button size='small' type="" :disabled="checkDwonBtnDisabled()" @click="handleUpAndDwon(false)">下移</el-button> -->
      <slot name="btn"></slot>
    </div>
    <!-- </el-header> -->

    <!-- <el-main> -->
    <div class="renderwrap">
      <!-- <el-main> -->
      <base-render-table ref="table" :table-data="finalTableData" :table-options="tableOptions" edit-mode
        row-key="fieldCode" border @selection-change="selectListHandler" :row-style="{ height: '40px' }"
        :cell-style="{ padding: '4px' }" height="100%" style="height: 100%;overflow:auto">
        <!-- 注意这里的slot值要和tableOptions中配置的slotName一致 -->
        <!-- #operator是简写，详细请查阅vue文档 -->
        <template #setupWidget="{ row }">
          <el-button type="text" icon="el-icon-edit" :disabled="row.isSearchWidget === false"
            @click.stop.prevent="handleWidgetAttr(row)">
            设置
          </el-button>
          <slot name="setupWidget" :row="row"></slot>
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
    <el-dialog title="设置搜索控件属性" :visible.sync="dialogVisibleFrom" :close-on-click-modal="false"
      :close-on-press-escape="false" width="1450px" v-dialogDrag :before-close="handleCloseFrom" append-to-body>
      <div class="flex">
        <div class="left">
          <base-render-form ref="setupForm" :form-data="setupForm" :form-options="setupFormOptions" :use-dialog="false"
            :showFooter="false" v-if="dialogVisibleFrom">
            <template #searchWidget>
              <el-select v-model="setupForm.searchWidgetType" @change="changeWidget" placeholder="请选择控件类型" filterable>
                <el-option v-for="item in searchWidget" :key="item.id" :label="item.cnName" :value="item.id">
                </el-option>
              </el-select>
            </template>
            <template #selectDic="{ formData }">
              <el-select :value="formData.request.url" @change="changeFormData($event, formData)" placeholder="请选择字典项"
                filterable clearable="">
                <el-option v-for="item in dicCodeList" :key="item.dicCode" :label="item.dicName" :value="item.dicCode">
                  <span class="code">{{ item.dicCode.split('dicCode=')[1] }}</span>
                  <span>{{ item.dicName }}</span>
                </el-option>
              </el-select>
              <el-button @click="requestDicCodeListData">刷新</el-button>
            </template>
          </base-render-form>
          <el-form>
            <el-form-item label-width="106px" label="生成sql片段：">
              <el-input v-model="suggestSQL" :autosize="{ minRows: 4, maxRows: 10 }" type="textarea" placeholder=""
                readonly></el-input>
            </el-form-item>
            <el-form-item label="">
              <div style="color: #787878;">提示：生成的sql片段仅供参考</div>
            </el-form-item>
          </el-form>
        </div>
        <div class="right">
          <code-editor ref="ace" v-model="wholeSQL"></code-editor>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleCloseFrom">取消</el-button>
        <el-button type="primary" @click="confirmFrom">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="设置搜索字段" :visible.sync="dialogVisibleFuzzyFrom" :close-on-click-modal="false"
      :close-on-press-escape="false" width="1450px" v-dialogDrag :before-close="handleCloseFuzzyFrom" append-to-body>
      <div class="flex">
        <div class="left">
          <el-form label-position="top">
            <el-form-item required label="搜索字段列表：">
              <el-checkbox-group class="fieldList" v-model="fuzzyFieldSearchConfig.searchFieldList"
                @change="fuzzySearchFieldListChange">
                <el-checkbox v-for="row in tableData" :label="row.fieldCode" :key="row.fieldCode">{{ row.fieldName
                }}</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item required label="提示文本：">
              <el-input v-model="fuzzyFieldSearchConfig.placeholder" placeholder="请输入提示文本"></el-input>
            </el-form-item>
            <el-form-item label-width="106px" label="生成sql片段：">
              <el-input v-model="suggestSQL" :autosize="{ minRows: 4, maxRows: 10 }" type="textarea" placeholder=""
                readonly></el-input>
            </el-form-item>
            <el-form-item label="">
              <div style="color: #787878;">提示：生成的sql片段仅供参考</div>
            </el-form-item>
          </el-form>
        </div>
        <div class="right">
          <code-editor ref="ace" v-model="wholeSQL"></code-editor>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleCloseFuzzyFrom">取消</el-button>
        <el-button type="primary" @click="confirmFuzzyFrom">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>

import BaseRenderTable from '../../../../packages/BaseRenderTable/index';
import BaseRenderForm from '../../../../packages/BaseRenderForm/index';
import { getSingleTableData, editConf as tableOptions } from '../../../../baseConfig/tableBaseConfig'
import { searchWidget } from '../../../../baseConfig/tableSelectConfigs';
import codeEditor from '../../../components/sqlCodeMirror';

import {
  str2obj, getSetupForm,
  getSetupFormOptions, setPlaceholder
} from '../../../../utils';
import { cloneDeep } from "lodash"
import Sortable from "sortablejs"
import { merge } from "lodash"

export default {
  name: 'singleSetupTable',
  components: {
    BaseRenderTable,
    BaseRenderForm,
    codeEditor
  },
  props: {
    listPageId: String,
    rawTableData: Array,
    generalRequest: {
      type: Function,
    },
    generateQuerySql: {
      type: Function,
      require: true
    },
    saveSql: {
      type: Function,
      require: true
    },
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
      tableData: [],
      dicCodeList: [],
      searchWidget,
      suggestSQL: '',
      wholeSQL: '',
      filterShowField: false,
      fuzzyFieldSearchConfig: {
        placeholder: '',
        searchFieldList: []
      },
      _originFuzzyFieldSearchConfig: {},
      dialogVisibleFuzzyFrom: false
    };
  },

  computed: {
    finalTableData () {
      return this.filterShowField ? this.tableData.filter(item => item.show) : this.tableData
    }
  },

  watch: {
    rawTableData (val) {
      this.tableData = val;
      if (!this.fuzzyFieldSearchConfig.searchFieldList.length) {
        this.fuzzyFieldSearchConfig.searchFieldList = [val[0].fieldCode];
        this.setFuzzySearchPlaceholder();
      }
    },
  },

  created () {
    const that = this
    const target = this.tableOptions.find(item => item.prop === 'isSearchWidget')
    target.listeners.change = (row, val) => {
      // 如果不显示查询控件，则清空当前控件配置
      if (!val) {
        // 当前函数的row为tabledata中此行的row
        row.searchWidgetConfig = {}
        row.searchWidget = ''
      }
      that.$emit('searchOptionsChange');
    }
  },

  mounted () {
    this.rowDrop()
    this.requestDicCodeListData()
  },

  methods: {
    expose_getTableData () {
      return this.tableData
    },


    expose_getFuzzyFieldSearchConfig () {
      return this.fuzzyFieldSearchConfig
    },


    expose_setFuzzyFieldSearchConfig (obj) {
      this._originFuzzyFieldSearchConfig = obj
      this.fuzzyFieldSearchConfig = cloneDeep(obj)
    },

    expose_getFormDesignData () {
      return this.formDesignData
    },

    init () {
      this.tableData = []
    },

    setFuzzySearchPlaceholder () {
      const searchFieldList = this.fuzzyFieldSearchConfig.searchFieldList
      const fieldNameList = (searchFieldList.length > 2 ? searchFieldList.slice(0, 2) : searchFieldList).map(fieldCode => this.tableData.find(item => item.fieldCode === fieldCode).fieldName)
      fieldNameList
      this.fuzzyFieldSearchConfig.placeholder = `输入${fieldNameList.join('、')}${searchFieldList.length > 2 ? '等' : ''}进行搜索`
    },

    handleShowField () {
      this.filterShowField = !this.filterShowField
    },

    requestDicCodeListData () {
      this.generalRequest('/dic/list', 'get').then((res) => {
        this.dicCodeList = res.data.map(item => {
          item.dicCode = `/dic/item/list?dicCode=${item.dicCode}`
          return item
        });
      });
    },

    changeWidget (val) {
      const target = searchWidget.find((widgetitem) => widgetitem.id === val);
      const searchWidgetName = target?.tagName;
      const sqlType = target?.sqlType;
      this.suggestSQL = ''
      this.querySql(sqlType)
      this.setupForm = this.getDefaultValueForm(searchWidgetName, this.curRowData.fieldName)
      this.setupFormOptions = this.composeFormOptions(searchWidgetName, this.curRowData);
    },

    changeFormData (value, formData) {
      console.log(formData, value);
      // 防止用户赋值给没有声明的属性值，导致其变为非响应式数据
      this.$set(formData.request, 'url', `${value}`);
    },
    querySql (type = 'input', isFuzzySearch) {
      const params = {
        listPageId: this.listPageId,
        displayDataType: type,
        fieldNameList: isFuzzySearch ? this.fuzzyFieldSearchConfig.searchFieldList : [this.curRowData.fieldCode]
      }
      this.generateQuerySql(params).then(res => {
        this.$refs.ace.codeValue = this.wholeSQL = res.data.querySql
        this.$refs.ace.aceEditor.setValue(this.wholeSQL)
        this.suggestSQL = res.data.querySqlFragment;
      })
    },

    // 处理设置控件属性事件
    handleWidgetAttr (row) {
      this.curRowData = row;
      this.dialogVisibleFrom = true;
      const target = searchWidget.find((widgetitem) => widgetitem.id === row.searchWidget);
      const searchWidgetName = target?.tagName;
      const sqlType = target?.sqlType || 'input';
      this.querySql(sqlType)
      this.setupFormOptions = this.composeFormOptions(searchWidgetName, row);
      const searchWidgetConfig = row.searchWidgetConfig
      const defaultForm = this.getDefaultValueForm(searchWidgetName, row.fieldName)
      if (Object.keys(searchWidgetConfig).length) {
        this.setupForm = merge(defaultForm, cloneDeep(searchWidgetConfig))
        // 针对字典项的特殊处理
        if (typeof this.setupForm.extraOption?.labelTranslateType === 'number') {
          this.setupForm.extraOption = JSON.stringify(this.setupForm.extraOption)
        }
      } else {
        this.setupForm = defaultForm
      }
    },

    getSortNumb () {
      let number = 0
      this.tableData.filter(item => typeof item.searchWidget === 'number' && item.isSearchWidget).map(item => {
        if (item.searchWidgetConfig.sortNumb > number) {
          number = item.searchWidgetConfig.sortNumb
        }
      })
      return number + 2
    },

    getDefaultValueForm (searchWidgetName = 'el-input', fieldName) {
      const form = getSetupForm(searchWidgetName)
      form.formItemAttrs.label = fieldName;
      form.tagAttrs.placeholder = setPlaceholder(searchWidgetName, fieldName);
      form.sortNumb = this.getSortNumb()
      // 针对字典项的特殊处理
      if (typeof form.extraOption?.labelTranslateType === 'number') {
        form.extraOption = JSON.stringify(form.extraOption)
      }
      return form
    },
    // 填充options的label
    supplementLabel (props, options) {
      const { key, label } = props
      return options.map(item => {
        const obj = {}
        obj[key] = item[key]
        obj[label] = `${item[label]}(${item[key]})`
        return obj
      })
    },

    // 设置searchForm和装配fromOptions
    composeFormOptions (searchWidgetName = 'el-input', row) {
      let formOptions = [];
      // 只有搜索控件有值，才会添加到options中
      if (searchWidgetName) {
        formOptions = getSetupFormOptions(searchWidgetName)
      }
      // 如果是输入框，则考虑关联其他字段，在这里进行填充 el-select的options
      // if (searchWidgetName === 'el-input') {
      //   const target = formOptions.find(item => item.formField === 'relateOtherField')
      //   const options = this.tableData.filter(item => item.fieldCode !== row.fieldCode && item.searchWidget === '' && item.show);
      //   const props = { key: 'fieldCode', label: 'fieldName' }
      //   target.extraOption = {
      //     props,
      //     // 去除自己和已存在筛选框的和未显示的
      //     options: this.supplementLabel(props, options)
      //   }
      // }
      // 由于查询sql接口需要区分单选多选，因此el-select el-cascader 和 dictionary 的多选按钮需要触发相应接口
      if (['el-select', 'el-cascader', 'dictionary'].includes(searchWidgetName)) {
        const target = formOptions.find(item => ['tagAttrs.multiple', 'tagAttrs.props.multiple'].includes(item.formField))
        target.listeners.change = (val) => this.querySql(val ? 'jy-dict-list' : 'jy-dict')
      }
      return [{
        elRowAttrs: {
          gutter: 10
        },
        formItem: formOptions
      }];
    },

    fuzzySearchFieldListChange () {
      this.querySql('input', true);
      this.setFuzzySearchPlaceholder();
    },
    handleSummaryRow () { },

    handleFuzzySearch () {
      this.dialogVisibleFuzzyFrom = true;
      this.querySql('input', true);
    },

    rowDrop () {
      // 此时找到的元素是要拖拽元素的父容器
      const dom = document.querySelector('.el-table__body-wrapper tbody');
      Sortable.create(dom, {
        handle: ".renderwrap .my-handle",
        onEnd: e => {
          //e.oldIndex为拖动一行原来的位置，e.newIndex为拖动后新的位置
          const targetRow = this.finalTableData[e.oldIndex]
          const substitute = this.finalTableData[e.newIndex]
          const oldIndex = this.tableData.indexOf(targetRow)
          const newIndex = this.tableData.indexOf(substitute)
          this.tableData.splice(oldIndex, 1);
          this.tableData.splice(newIndex, 0, targetRow);
          console.log(e.oldIndex, e.newIndex);
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
      const index = tableData.indexOf(selected[0])
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
      }).then(() => {
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
      this.setupForm = {}
      this.setupFormOptions = []
      this.wholeSQL = ''
      this.suggestSQL = ''
    },
    // 设置查询控件表单确认事件
    confirmFrom () {
      this.saveSql(this.listPageId, this.wholeSQL);
      if (this.setupForm.extraOption) {
        this.setupForm.extraOption = str2obj(this.setupForm.extraOption)
      }
      // 将已确认的setupForm更新到tabledata的数据上
      this.curRowData.searchWidgetConfig = this.setupForm
      this.curRowData.searchWidget = this.setupForm.searchWidgetType
      this.handleCloseFrom();
      this.$emit('searchOptionsChange')
    },

    handleCloseFuzzyFrom (resetConfig = true) {
      if (resetConfig) this.fuzzyFieldSearchConfig = cloneDeep(this._originFuzzyFieldSearchConfig)
      this.dialogVisibleFuzzyFrom = false;
      this.wholeSQL = ''
      this.suggestSQL = ''
    },

    confirmFuzzyFrom () {
      this.saveSql(this.listPageId, this.wholeSQL);
      this.handleCloseFuzzyFrom(false);
      this._originFuzzyFieldSearchConfig = cloneDeep(this.fuzzyFieldSearchConfig);
      this.$emit('confirmFuzzyFrom', fuzzyFieldSearchConfig)
    },

    handleHideAll () {
      this.tableData.forEach(row => (row.show = false));
    },

    handleShowAll () {
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

.code {
  float: right;
  color: #999;
}

.sql {
  width: 350px;
  min-height: 70px;
  font-size: 14px;
  line-height: 20px;
  border: 1px solid #DCDFE6;
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
