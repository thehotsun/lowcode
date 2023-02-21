<template>
  <el-container>
    <el-header v-if="showSearchFrom">
      <base-render-form ref="form" :form-data="searchFrom" :form-options="formOptions" :use-dialog="false">
      </base-render-form>
    </el-header>

    <el-main>
      <el-container style="height: 100%">
        <el-header class="flex">
          <base-render-regular ref="btnForm" :render-options="btnRegularOptions">
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
  </el-container>
</template>

<script>
// 为何将pagination放在这个组件？首先因为baseTable仅仅是作为table的渲染器存在的，不应涉及网络请求，而pagination最重要的功能就是通过网络请求更新数据，因此在哪里使用到了获取table数据的网络请求，在哪就应该将pagination放进去

import BaseRenderTable from '../BaseRenderTable/index';
import BaseRenderForm from '../BaseRenderForm/index';
import BaseRenderRegular from '../BaseRenderRegular/index';
import { align, searchWidget } from '../../baseConfig/tableSelectConfigs';
import { getElBtnConfig } from '../../baseConfig/widgetBaseConfig';
import { setPlaceholder, getWidgetOptions, setColSpan } from '../../utils';
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
    parseJson: {
      type: Function,
      require: true
    },
    requestTableConfig: {
      type: Function,
      require: true
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
      showSearchFrom: false,
      // 初始化是否显示分页
      showPagination: false,
    };
  },

  mounted () {
    this.init()
  },

  methods: {
    // exec (fn) {
    //   eval(fn);
    // },

    async init () {
      this.queryTableData();
      await this.queryTableConfig();
      this.formOptions = this.composeFromOptions(this.tableConfigJSON);
      this.tableOptions = this.tableConfigJSON.filter(item => item.show).map(item => {
        const obj = {}
        obj.prop = item.fieldCode
        obj.label = item.fieldName
        obj.align = align.find(alignitem => alignitem.id === item.align).value
        obj['min-width'] = item.width
        obj.sortable = !!item.sort
        return obj
      })
      // this.exec("console.warn(this.formOptions)");
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
      const options = config.map(item => {
        return getElBtnConfig('primary', this.handleFilter, item.btnName);
      })
      return [{
        elRowAttrs: {
          gutter: 10,
          type: "flex",
          align: 'middle',
          justify: 'start',
        },
        style: "padding-left: 5px",
        formItem: options
      }]
    },
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
