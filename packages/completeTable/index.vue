<template>
  <el-container>
    <el-header v-if="showSearchFrom">
      <base-render-form ref="form" :form-data="searchFrom" :form-options="formOptions" :showFooter="false"
        :use-dialog="false">
      </base-render-form>
    </el-header>

    <el-main>
      <el-container style="height: 100%">
        <el-header class="flex">
          <base-render-regular ref="btnForm" :render-options="btnRegularOptions" @btnClick="handleBtnClick">
          </base-render-regular>
        </el-header>
        <el-main>
          <base-render-table ref="table" :table-data="tableData" :table-options="tableOptions"
            @selection-change="selectListHandler">
            <!-- 注意这里的slot值要和tableOptions中配置的slotName一致 -->
            <!-- #operator是简写，详细请查阅vue文档 -->
            <template #operator="{ row }">
              <el-button v-if="row.$edit" @click="onSave(row)">
                保存
              </el-button>
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
    <el-dialog title="表单" :visible.sync="dialogVisibleForm" :close-on-click-modal="false" :close-on-press-escape="false"
      width="900px" :before-close="expose_hideDialog" append-to-body>
      <form-create :rule="rule" :option="option"></form-create>
    </el-dialog>
  </el-container>
</template>

<script>
// 为何将pagination放在这个组件？首先因为baseTable仅仅是作为table的渲染器存在的，不应涉及网络请求，而pagination最重要的功能就是通过网络请求更新数据，因此在哪里使用到了获取table数据的网络请求，在哪就应该将pagination放进去

import BaseRenderTable from '../BaseRenderTable/index';
import BaseRenderForm from '../BaseRenderForm/index';
import BaseRenderRegular from '../BaseRenderRegular/index';
import { align, searchWidget } from '../../baseConfig/tableSelectConfigs';
import { getElBtnConfig } from '../../baseConfig/widgetBaseConfig';
import { setPlaceholder, getWidgetOptions, setColSpan, exec } from '../../utils';
import { cloneDeep, merge } from "lodash";

export default {
  name: 'completeTable',
  components: {
    BaseRenderTable,
    BaseRenderForm,
    BaseRenderRegular
  },
  props: {
    requestTableData: {
      type: Function,
      require: true
    },
    requestFormData: {
      type: Function,
    },
    parseJson: {
      type: Function,
      require: true
    },
    requestTableConfig: {
      type: Function,
      require: true
    },
    requestFormConfig: {
      type: Function,
    },
    pageLayout: {
      type: Object,
      default: function () {
        ' ->, total,sizes, prev, pager, next,jumper'
      }
    }
  },
  data () {
    return {
      dialogVisibleForm: false,
      rule: [],
      option: [],
      // tabledata 属性值要做到和tableOptions中的prop相对应
      tableConfigJSON: [],
      tableOptions: [],
      tableData: [],
      formOptions: [],
      searchFrom: {},
      rawSearchFrom: {},
      page: {
        pageNum: 1,
        pageSize: 10,
        totalCount: 20
      },
      btnRegularOptions: [],
      btnConfigJSON: [],
      showSearchFrom: true,
      // 初始化是否显示分页
      showPagination: false,
    };
  },

  mounted () {
    // this.init()
  },

  methods: {
    expose_showDialog (formid) {
      this.dialogVisibleForm = true
      this.rule = [
        {
          "type": "input",
          "field": "QueTest",
          "title": "文件ID",
          "_fc_drag_tag": "input",
          "hidden": false,
          "display": true
        },
        {
          "type": "input",
          "field": "6z25y096d003",
          "title": "文件名称",
          "_fc_drag_tag": "input",
          "hidden": false,
          "display": true
        },
        {
          "type": "input",
          "field": "j395y096d00g",
          "title": "问题状态ID",
          "_fc_drag_tag": "input",
          "hidden": false,
          "display": true
        },
        {
          "type": "input",
          "field": "g721ng2jrm02j",
          "title": "问题状态名称",
          "_fc_drag_tag": "input",
          "hidden": false,
          "display": true
        },
        {
          "type": "input",
          "field": "gwz1ng2jrm0dq",
          "title": "问题描述",
          "_fc_drag_tag": "input",
          "hidden": false,
          "display": true
        },
        {
          "type": "input",
          "field": "w761ng2jrm0rp",
          "title": "修改人ID",
          "_fc_drag_tag": "input",
          "hidden": false,
          "display": true
        },
        {
          "type": "input",
          "field": "pfh1ng2jrm0uk",
          "title": "修改人",
          "_fc_drag_tag": "input",
          "hidden": false,
          "display": true
        },
        {
          "type": "InputNumber",
          "field": "QueTest",
          "title": "客户端类型",
          "hidden": false,
          "display": true
        },
        {
          "type": "input",
          "field": "r8b1ng2jrm0xf",
          "title": "操作人ID",
          "_fc_drag_tag": "input",
          "hidden": false,
          "display": true
        },
        {
          "type": "input",
          "field": "p0u1ng2jrm10a",
          "title": "创建人ID",
          "_fc_drag_tag": "input",
          "hidden": false,
          "display": true
        },
        {
          "type": "InputNumber",
          "field": "QueTest",
          "title": "是否删除",
          "hidden": false,
          "display": true
        },
        {
          "type": "DatePicker",
          "field": "QueTest",
          "title": "完成时间",
          "hidden": false,
          "display": true
        },
        {
          "type": "InputNumber",
          "field": "QueTest",
          "title": "金额",
          "hidden": false,
          "display": true
        },
        {
          "type": "InputNumber",
          "field": "QueTest",
          "title": "天数",
          "hidden": false,
          "display": true
        },
        {
          "type": "DatePicker",
          "field": "QueTest",
          "title": "createTime",
          "hidden": false,
          "display": true
        },
        {
          "type": "DatePicker",
          "field": "QueTest",
          "title": "ModifyTime",
          "hidden": false,
          "display": true
        }
      ];
      this.option = {
        "form": {
          "inline": false,
          "labelPosition": "right",
          "size": "mini",
          "labelWidth": "125px",
          "hideRequiredAsterisk": false,
          "showMessage": true,
          "inlineMessage": false
        },
        "row": {
          "gutter": 0,
          "tag": "div"
        },
        "submitBtn": true,
        "info": {
          "type": "popover"
        },
        "wrap": {},
        "resetBtn": true
      }
    },

    expose_hideDialog () {
      this.dialogVisibleForm = false
    },

    expose_preview ({ tableOptions, formOptions }) {
      this.tableConfigJSON = tableOptions;
      this.btnRegularOptions = this.composeBtnRegularOptions(formOptions);
      const tableData = {}
      this.composeData(tableData)
      this.tableData = [tableData];
    },

    // 保存表单
    onSubmit (data) {
      this.$emit('onSubmit', data);
      this.expose_hideDialog()
    },
    // 预览的时候用，创建一个全为空字符串的对象
    setEmptyTableData (emptyData = {}, fieldCode) {
      emptyData[fieldCode] = ''
    },

    async init () {
      this.queryTableData();
      await this.queryTableConfig();
      this.composeData()
    },

    composeData (emptyData) {
      this.formOptions = this.composeFromOptions(this.tableConfigJSON);
      this.tableOptions = this.tableConfigJSON.filter(item => item.show).map(item => {
        const obj = {}
        obj.prop = item.fieldCode
        emptyData && this.setEmptyTableData(emptyData, item.fieldCode)
        obj.label = item.fieldName
        obj.align = align.find(alignitem => alignitem.id === item.align).value
        obj['min-width'] = item.width
        obj.sortable = !!item.sort
        return obj
      })
    },

    // 由数据组成searchFrom
    setFromField (source, field) {
      this.$set(source, field, '');
    },

    // 设置searchFrom和装配fromOptions
    composeFromOptions (tableData) {
      this.showSearchFrom = false
      if (!tableData.length) return [];
      const { setFromField } = this;
      const formOptions = [];
      const length = tableData.length;
      tableData.map((item, index) => {
        const searchWidgetName = searchWidget.find((widgetitem) => widgetitem.id === item.searchWidget)?.tagName;
        // 只有搜索控件有值，才会添加到options中
        if (searchWidgetName) {
          setFromField(this.searchFrom, item.fieldCode);
          const options = getWidgetOptions(searchWidgetName, item)
          formOptions.push(merge(options, item.searchWidgetConfig));
        }
        // 如果循环到最后一个且存在其他筛选项，则复制一份最原始的form
        if (length - 1 === index && formOptions.length) {
          this.rawSearchFrom = cloneDeep(this.searchFrom);
          // 添加筛选和重置按钮
          formOptions.push(...this.getBtnConfig());
          this.showSearchFrom = true
        }
      });
      return [{
        elRowAttrs: {
          gutter: 10,
          type: "flex",
          align: 'middle',
          justify: 'start',
        },
        style: "flex-wrap: wrap",
        formItem: formOptions
      }];
    },


    getBtnConfig () {
      const filterConfig = getElBtnConfig('primary', this.handleFilter, '筛选');
      const resetConfig = getElBtnConfig('', this.handleReset, '重置');
      setColSpan(filterConfig, 2);
      setColSpan(resetConfig, 2);
      return [filterConfig,
        resetConfig];
    },


    handleFilter () {
      this.queryTableData();
    },
    handleReset () {
      this.searchFrom = cloneDeep(this.rawSearchFrom);
      this.queryTableData();
    },

    onSave (row) {
      // 推出编辑清空状态
      row.$edit = false;
      // this.$refs.table.expose_clearCurCellPro();
    },

    rowClick (val) {
      this.$emit(rowClick, val);
      console.log(val);
    },

    selectListHandler (val) {
      this.$emit(selectListHandler, val);
      console.log(val);
    },


    handleCurrentChange (val) {
      console.log(val, this.page);
      this.queryTableData();
    },

    queryTableData () {
      const params = {
        ...this.searchFrom,
        ...this.page
      };
      return this.requestTableData(params).then(res => {
        if (res.result === '0') {
          this.tableData = res.data
        } else {
          console.error(`queryTableData message: ${res}`);
        }
      }).catch(e => {
        console.error(`queryTableData error: ${e}`);
      });
    },

    queryTableConfig () {
      return this.requestTableConfig().then(res => {
        if (res.result === '0') {
          const { tableOptions, formOptions } = JSON.parse(res.data)
          this.tableConfigJSON = tableOptions;
          this.btnRegularOptions = this.composeBtnRegularOptions(formOptions)
        } else {
          console.error(`queryTableConfig message: ${res}`);
        }
      }).catch(e => {
        console.error(`queryTableConfig error: ${e}`);
      });
    },


    composeBtnRegularOptions (config) {
      return [{
        elRowAttrs: {
          gutter: 10,
          type: "flex",
          align: 'middle',
          justify: 'start',
        },
        style: "padding-left: 5px",
        formItem: config
      }]
    },

    exec,

    handleBtnClick ({ relateFrom,
      openType,
      openUrl,
      fn, }) {
      if (fn) {
        this.exec(fn)
      } else {
        if (openType === 0) {
          this.expose_showDialog(relateFrom)
        } else {
          this.$router.push(openUrl, relateFrom)
        }
      }
    }
  }
};
</script>  

<style lang="scss" scoped>
.wrap {
  width: 100%;
}

.edit {
  position: fixed;
  top: 20%;
  left: 0;
  right: 0;
  z-index: 999;
}

.flex {
  display: flex;
  align-items: center;
}
</style>
