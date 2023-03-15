<template>
  <el-container style="height: 100%">
    <el-header style="margin: 20px 0" v-if="showSearchFrom">
      <base-render-form ref="form" :generalRequest="generalRequest" :form-data="searchFrom" :form-options="formOptions"
        :showFooter="false" :use-dialog="false">
      </base-render-form>
    </el-header>

    <el-main>
      <el-container style="height: 100%">
        <el-header class="flex" v-if="showBtns">
          <base-render-regular ref="btnForm" :render-options="btnRegularOptions" @btnClick="handleBtnClick">
          </base-render-regular>
        </el-header>
        <el-main>
          <base-render-table ref="table" :table-data="tableData" :table-options="tableOptions"
            :border="tableAttrs.isShowBorder" :stripe="tableAttrs.isShowStripe" :show-summary="tableAttrs.isShowSummary"
            :summary-method="tableAttrs.summaryMethod" :size="tableAttrs.size" @selection-change="selectListHandler">
            <!-- 注意这里的slot值要和tableOptions中配置的slotName一致 -->
            <!-- #operator是简写，详细请查阅vue文档 -->
            <template #operator="{ row }">
              <el-button v-if="row.$edit" @click="onSave(row)">
                保存
              </el-button>
            </template>
          </base-render-table>
        </el-main>
        <el-footer v-if="tableAttrs.showPagination">
          <el-pagination class="el-pagination" :layout="pageLayout" :current-page.sync="page.pageNo"
            :page-size="page.pageSize" :total="page.totalCount" :page-sizes="[10, 20, 50, 100]"
            @size-change="handleSizeChange" @current-change="handleCurrentChange"></el-pagination>
        </el-footer>
      </el-container>
    </el-main>
    <el-dialog title="表单" :visible.sync="dialogVisibleForm" :close-on-click-modal="false" :close-on-press-escape="false"
      width="900px" :before-close="expose_hideDialog" append-to-body>
      <FcView v-if="formId" :primaryKeyValue="primaryKeyValue" :isDisabled="onlyRead" :formId="formId" @submit="onSubmit">
      </FcView>
      <importFile v-else></importFile>
    </el-dialog>
  </el-container>
</template>

<script>
// 为何将pagination放在这个组件？首先因为baseTable仅仅是作为table的渲染器存在的，不应涉及网络请求，而pagination最重要的功能就是通过网络请求更新数据，因此在哪里使用到了获取table数据的网络请求，在哪就应该将pagination放进去

import BaseRenderTable from '../BaseRenderTable/index';
import BaseRenderForm from '../BaseRenderForm/index';
import BaseRenderRegular from '../BaseRenderRegular/index';
import importFile from './component/importFile.vue';
import { align, searchWidget } from '../../baseConfig/tableSelectConfigs';
import { getElBtnConfig } from '../../baseConfig/widgetBaseConfig';
import { setPlaceholder, getWidgetOptions, setColSpan, exec, getWidgetDefaultVal, str2obj, depthFirstSearchWithRecursive, execByFn, setTableAttrs } from '../../utils';
import { cloneDeep, merge } from "lodash";

export default {
  name: 'completeTable',
  components: {
    BaseRenderTable,
    BaseRenderForm,
    BaseRenderRegular,
    importFile
  },
  props: {
    requestTableData: {
      type: Function,
    },
    requestTablePaginationData: {
      type: Function,
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
    requestDownload: {
      type: Function,
    },
    requestBatchDel: {
      type: Function,
    },
    generalRequest: {
      type: Function,
    },
    // pageLayout: {
    //   type: String,
    //   default: function () {
    //     'total,sizes, prev, pager, next,jumper'
    //   }
    // },

    listPageId: String
  },
  data () {
    return {
      pageLayout: '->, total,sizes, prev, pager, next,jumper',
      dialogVisibleForm: false,
      rule: [],
      option: {},
      // tabledata 属性值要做到和tableOptions中的prop相对应
      tableConfigJSON: [],
      tableOptions: [],
      tableData: [],
      formOptions: [],
      searchFrom: {},
      rawSearchFrom: {},
      page: {
        pageNo: 1,
        pageSize: 10,
        totalCount: 0
      },
      btnRegularOptions: [],
      btnConfigJSON: [],
      showSearchFrom: true,
      showBtns: true,
      formId: '',
      primaryKeyValue: '',
      // 按钮代表的一系列事件完毕以后是否刷新列表
      isRefresh: false,
      // 选中的table数据
      selectList: [],
      keyField: '',
      onlyRead: false,
      tableAttrs: {
        // 初始化是否显示分页
        showPagination: false,
        isShowCheckbox: false,
        isShowIndex: false,
        isShowStripe: false,
        isShowBorder: false,
        isShowSummary: false,
        summaryMethod: this.getSummaries,
        size: ''
      }
    };
  },

  mounted () {
    // this.init()
  },

  methods: {
    expose_showDialog (formId) {
      this.dialogVisibleForm = true
      this.formId = formId
      // this.queryFormConfig(formId)
    },

    expose_hideDialog () {
      this.dialogVisibleForm = false;
      this.resetFromData()
    },

    expose_preview (data) {
      this.parseTableConfig(data)
      const tableData = {}
      this.composeData(tableData)
      this.tableData = [tableData];
    },

    getSummaries (param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        if (!values.every(value => isNaN(value))) {
          sums[index] = values.reduce((prev, curr) => {
            const value = Number(curr);
            if (!isNaN(value)) {
              return prev + curr;
            } else {
              return prev;
            }
          }, 0);
        } else {
          sums[index] = '';
        }
      });

      return sums;
    },

    resetFromData () {
      // this.rule = []
      // this.option = {}
      this.formId = ''
    },

    // queryFormConfig (formId) {
    //   this.requestFormConfig(formId).then(res => {
    //     const { rule, option } = JSON.parse(res.data);
    //     this.rule = rule;
    //     this.option = option;
    //   })
    // },

    // 保存表单
    async onSubmit (data) {
      this.$emit('onSubmit', data);
      this.expose_hideDialog()
      // await this.requestFormConfirm(this.formid, data)
      this.isRefresh && this.queryTableData();
    },
    // 预览的时候用，创建一个全为空字符串的对象
    setEmptyTableData (emptyData = {}, fieldCode) {
      emptyData[fieldCode] = ''
    },

    async init () {
      await this.queryTableConfig();
      this.queryTableData();
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
        obj.translate = item.translate
        item.fixed && (obj.fixed = item.fixed)
        // 某些函数转换
        const fnProps = ['sort-method'];
        fnProps.map((prop) => {
          if (item[prop]) {
            obj[prop] = execByFn(item[prop]);
          }
        });
        return obj
      })
      if (this.tableAttrs.isShowIndex) {
        this.tableOptions.unshift({
          type: "index",
          width: "50",
          label: "序号",
          align: "center"
        })
      }
      if (this.tableAttrs.isShowCheckbox) {
        this.tableOptions.unshift({
          type: "selection",
          width: "55",
          align: "center"
        })
      }
    },

    // 由数据组成searchFrom
    setFromField (source, fieldCode, formOptions, searchWidgetName) {
      this.$set(source, fieldCode, getWidgetDefaultVal(formOptions, searchWidgetName));
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
          // this.$set(this.searchFrom, item.fieldCode, '');
          setFromField(this.searchFrom, item.fieldCode, item.searchWidgetConfig, searchWidgetName);
          const options = getWidgetOptions(searchWidgetName, item)
          console.log(depthFirstSearchWithRecursive(item.searchWidgetConfig), item.searchWidgetConfig);
          formOptions.push(merge(options, depthFirstSearchWithRecursive(item.searchWidgetConfig)));
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
      this.page.pageNo = 1;
      this.queryTableData();
    },

    handleReset () {
      this.searchFrom = cloneDeep(this.rawSearchFrom);
      this.page.pageNo = 1;
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
      this.$emit('selectListHandler', val);
      console.log(val);
      this.selectList = val;
    },


    handleCurrentChange (val) {
      console.log(val, this.page);
      this.queryTableData();
    },

    handleSizeChange (val) {
      console.log(val, this.page);
      this.page.pageSize = val
      this.queryTableData();
    },

    queryTableData () {
      return (this.tableAttrs.showPagination ? this.requestTablePaginationData(this.searchFrom, this.page) : this.requestTableData(this.searchFrom)).then(res => {
        if (res.result === '0') {
          this.tableData = res.data
          if (this.tableAttrs.showPagination) {
            this.page.totalCount = res.totalCount;
          }
        } else {
          console.error(`queryTableData message: ${res}`);
        }
      }).catch(e => {
        console.error(`queryTableData error: ${e}`);
      });
    },

    parseTableConfig (data) {
      const { tableOptions, formOptions,
        keyField } = data
      setTableAttrs(data, this.tableAttrs)
      if (formOptions?.length) {
        this.btnRegularOptions = this.composeBtnRegularOptions(formOptions);
      } else {
        this.showBtns = false
      }
      this.tableConfigJSON = tableOptions;
      this.keyField = keyField;
    },

    queryTableConfig () {
      return this.requestTableConfig().then(res => {
        if (res.result === '0') {
          const data = JSON.parse(res.data);
          this.parseTableConfig(data)

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

    handleBtnClick ({ relateFrom = '',
      openType = '',
      openUrl = '',
      fn = '', isRefresh = false, defaultFn = '', btnType = '' }) {
      console.log(defaultFn, 'defaultFn');
      this.isRefresh = isRefresh;
      if (fn) {
        this.exec(fn)
      } else {
        switch (btnType) {
          case 'add':
            if (openType === 0) {
              this.expose_showDialog(relateFrom)
              this.onlyRead = false;
              this.primaryKeyValue = ''
            } else {
              this.$router.push(openUrl, relateFrom)
            }
            break;
          case 'check':
          case 'edit':
            if (this.selectList.length === 1) {
              this.primaryKeyValue = this.selectList[0][this.keyField];
              if (openType === 0) {
                this.expose_showDialog(relateFrom)
                this.onlyRead = btnType === 'check'
              } else {
                this.$router.push(openUrl, relateFrom)
              }
            } else { this.$warn("请确认只选中了一个值") }
            break;
          case 'download':
            this.download(this.selectList.map(item => item[this.keyField]))
            break;
          case 'batchDel':
            this.batchDel(this.selectList.map(item => item[this.keyField]))
            break;
          default:
            break;
        }

      }
    },

    download (list = []) {
      this.requestDownload({ json: list.length ? JSON.stringify(list) : '', listPageId: this.listPageId }).then(response => {
        const link = document.createElement('a');
        const blob = response;
        link.style.display = 'none';
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', '导出表格');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
    },
    batchDel (list = []) {
      this.requestBatchDel({ primaryKeyValueList: list, listPageId: this.listPageId }).then(res => {
        if (res.result === '0') {
          this.queryTableData()
        }
      })
    },
  },

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
