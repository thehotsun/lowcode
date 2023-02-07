<template>
  <el-container>
    <el-header>
      <div class="operate">
        <el-button size='small' type="primary" @click="handleAdd(1)">新增一条</el-button>
        <el-button size='small' type="primary" @click="handleAdd(5)">新增五条</el-button>
        <el-button size='small' type="danger" :disabled="!selected.length" @click="handleDelete">删除</el-button>
        <el-button size='small' type="" :disabled="checkUpBtnDisabled()" @click="handleUpAndDwon(-1)">上移</el-button>
        <el-button size='small' type="" :disabled="checkDwonBtnDisabled()" @click="handleUpAndDwon(1)">下移</el-button>
        <slot name="btn"></slot>
      </div>
    </el-header>

    <el-main>
      <el-container style="height: 100%">
        <el-main>
          <base-render-table ref="table" :table-data="tableData" :table-options="tableOptions" edit-mode
            @selection-change="selectListHandler" style="height: 450px;overflow:auto">
            <!-- 注意这里的slot值要和tableOptions中配置的slotName一致 -->
            <!-- #operator是简写，详细请查阅vue文档 -->
            <template #operator="{ row }">
              <el-button v-if="row.$edit" @click.stop.prevent="onSave(row)">
                保存
              </el-button>
              <el-button :disabled="row.searchWidget === ''" @click.stop.prevent="handleWidgetAttr(row)">
                设置控件属性
              </el-button>
              <slot name="operator"></slot>
            </template>
          </base-render-table>
        </el-main>
        <el-footer v-if="showPagination">
          <el-pagination class="el-pagination" :layout="pageLayout" :total="page.totalCount"
            :current-page.sync="page.pageNum" :page-size="page.pageSize"
            @current-change="handleCurrentChange"></el-pagination>
        </el-footer>
      </el-container>
    </el-main>
    <div class="edit">
      <codemirror v-if="showCodemirror" ref="jsonEditor" v-model="jsCode" :options="cmOptions" />
    </div>
    <el-dialog title="设置搜索控件属性" :visible.sync="dialogVisible" :close-on-click-modal="false"
      :close-on-press-escape="false" width="900px" :before-close="handleClose" append-to-body>
      <base-render-form ref="setupForm" :form-data="setupForm" :form-options="setupFormOptions" :use-dialog="false">
      </base-render-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="confirm">确定</el-button>
      </span>
    </el-dialog>
  </el-container>
</template>

<script>
// BaseRenderTable组件内置了expose_getElTableInstance方法，可以通过调用此组件的这个方法获取el-table的实例，例如
// const elTableInstance = this.$refs.table.expose_getElTableInstance()

// BaseRenderTable组件内置了expose_getSelectionList方法，可以通过调用此组件的这个方法获取当前table多选时被选中的列表数据

// BaseRenderTable组件内置了expose_getCurRow方法，可以通过调用此组件的这个方法获取当前table被点击高亮行的数据

// 此三个方法都可以通过传入attrs的方式进行覆盖例如
// @row-click="onRowClick"
// @selection-change="selectListHandler"

// 其他非内置方法则也通过此方式进行事件监听
// @current-change="handleCurrentChange

// 为何将pagination放在这个组件？首先因为baseTable仅仅是作为table的渲染器存在的，不应涉及网络请求，而pagination最重要的功能就是通过网络请求更新数据，因此在哪里使用到了获取table数据的网络请求，在哪就应该将pagination放进去

import BaseRenderTable from '../../BaseRenderTable/index';
import BaseRenderForm from '../../BaseRenderForm/index';
import { getSingleTableData } from '../../baseConfig/tableBaseConfig'
import { align, searchWidget } from '../../baseConfig/tableSelectConfigs';
import { setPlaceholder, getWidgetOptions, getFormItemEmptyConfig, str2obj } from '../../utils';
import _ from "lodash";
import { codemirror } from 'vue-codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/keymap/sublime'; // sublime编辑器效果
import "codemirror/theme/dracula.css";// 配置里面也需要theme设置为monokai
import "codemirror/mode/vue/vue.js"; // 配置里面也需要mode设置为vue
import 'codemirror/addon/selection/active-line'; // 光标行背景高亮，配置里面也需要styleActiveLine设置为true

export default {
  components: {
    BaseRenderTable,
    BaseRenderForm,
    codemirror
  },
  props: {
    tableOptions: Array,
    showPagination: Boolean
  },
  data () {
    return {
      // tabledata 属性值要做到和tableOptions中的prop相对应
      tableData: [
        { fieldCode: 'name', fieldName: '姓名', englishName: '', columnWidth: '', align: 2, show: true, sort: false, searchWidget: 0 },
        { fieldCode: 'age', fieldName: '年龄', englishName: '', columnWidth: '', align: 1, show: true, sort: false, searchWidget: 1 }, { fieldCode: 'gender', fieldName: '性别', englishName: '', columnWidth: '', align: 0, show: true, sort: true, searchWidget: 2 },
        { fieldCode: 'phone', fieldName: '手机号', englishName: '', columnWidth: '', align: 0, show: false, sort: false, searchWidget: 3 },
        { fieldCode: 'education', fieldName: '学历', englishName: '', columnWidth: '', align: 0, show: true, sort: false, searchWidget: 0 }
      ],
      formOptions: [],
      searchForm: {},
      rawSearchForm: {},
      pageLayout: ' ->, total,sizes, prev, pager, next,jumper', // 分页组件
      page: {
        pageNum: 1,
        pageSize: 10,
        totalCount: 20
      },
      jsCode: '',
      cmOptions: {
        tabSize: 4, // tab的空格个数
        theme: 'dracula', // 主题样式
        lineNumbers: true, // 是否显示行数
        lineWrapping: true, // 是否自动换行
        styleActiveLine: true, // line选择是是否加亮
        matchBrackets: true, // 括号匹配
        mode: "vue", // 实现javascript代码高亮
        readOnly: false// 只读
      },
      showCodemirror: false,
      selected: [],
      dialogVisible: false,
      setupForm: {

      },
      setupFormOptions: [],
      curRowData: {}
    };
  },

  mounted () {
    this.init()
  },

  methods: {

    init () {
      this.tableData = [getSingleTableData(), getSingleTableData()]
    },

    // 由数据组成searchForm
    setFormField (source, field) {
      this.$set(source, field, '');
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

    handleWidgetAttr (row) {
      this.curRowData = row;
      this.dialogVisible = true;
      const searchWidgetName = searchWidget.find((widgetitem) => widgetitem.id === row.searchWidget)?.tagName;
      this.setupFormOptions = this.composeFormOptions(searchWidgetName);
      this.setupForm = this.getSetupForm(searchWidgetName)
    },

    handleSubmit () {
      console.log(JSON.parse(JSON.stringify(this.tableData)));
      this.$router.push({
        name: 'test1'
      });
    },

    rowClick (val) {
      console.log(val);
    },

    selectListHandler (val) {
      this.selected = val;
      console.log(val);
    },


    handleCurrentChange (val) {
      console.log(val, this.page);
      this.queryTableData();
    },

    // TODO
    queryTableData () {
      const params = {
        ...this.searchForm,
        ...this.page
      };
      console.log('queryTableData', JSON.parse(JSON.stringify(params)));
      // this.tableData.push(this.tableData[0])
    },

    inputChange (content) {
      this.$nextTick(() => {
        console.log("code:" + this.code);
        console.log("content:" + content);
      });
    },

    handleClose () {
      this.dialogVisible = false;
      this.setupFormOptions = [];
      this.setupForm = {}
    },

    confirm () {
      if (this.setupForm.extraOption) {
        this.setupForm.extraOption = str2obj(this.setupForm.extraOption)
      }
      this.curRowData.searchWidgetConfig = this.setupForm
      this.handleClose();
    },
  }
};
</script>

<style lang="less" scoped>
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
