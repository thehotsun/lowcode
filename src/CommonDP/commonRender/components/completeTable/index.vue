<template>
  <el-container>
    <el-header>
      <base-render-form ref="form" :form-data="searchFrom" :form-options="formOptions" :use-dialog="false">
      </base-render-form>
    </el-header>

    <el-main>
      <el-container style="height: 100%">
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
    <div class="edit">
      <codemirror v-if="showCodemirror" ref="jsonEditor" v-model="jsCode" :options="cmOptions" />
    </div>
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
import { align, searchWidget } from '../../baseConfig/tableSelectConfigs';
import { getElBtnConfig } from '../../baseConfig/widgetBaseConfig';
import { setPlaceholder, getWidgetOptions, setColSpan } from '../../utils';
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
    showPagination: Boolean
  },
  data () {
    return {
      // tabledata 属性值要做到和tableOptions中的prop相对应
      tableConfig: [{ "fieldCode": "xxx", "fieldName": "我问问", "englishName": "ccc", "columnWidth": 90, "align": 1, "show": true, "sort": false, "searchWidget": 0, "searchWidgetConfig": { "formItemAttrs": { "label": "34" }, "tagAttrs": { "placeholder": "55" } }, "$edit": false }, { "fieldCode": "yyy", "fieldName": "我看看", "englishName": "fff", "columnWidth": 100, "align": 1, "show": true, "sort": false, "searchWidget": 1, "searchWidgetConfig": { "formItemAttrs": { "label": "我" }, "tagAttrs": { "placeholder": "请输入我" }, "extraOption": { "options": [{ "id": "123", "cnName": "hi好" }, { "id": "1", "cnName": "好" }] } }, "$edit": false }],
      tableOptions: [],
      tableData: [
        {
          xxx: 22,
          yyy: 33
        }
      ],
      formOptions: [],
      searchFrom: {},
      rawSearchFrom: {},
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
      showCodemirror: false
    };
  },

  // watch: {
  //   tableConfig: {
  //     deep: true,
  //     handler: function (val) {
  //       this.formOptions = this.composeFromOptions(val);
  //     }
  //   }
  // },

  mounted () {
    this.formOptions = this.composeFromOptions(this.tableConfig);
    // const sample = tableOptions[0]
    this.tableOptions = this.tableConfig.filter(item => item.show).map(item => {
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

  methods: {
    // exec (fn) {
    //   eval(fn);
    // },

    init () {

    },



    // 由数据组成searchFrom
    setFromField (source, field) {
      this.$set(source, field, '');
    },

    // 设置searchFrom和装配fromOptions
    composeFromOptions (tableData) {
      const { setFromField } = this;
      const formOptions = [];
      const length = tableData.length;
      tableData.map((item, index) => {
        const searchWidgetName = searchWidget.find((widgetitem) => widgetitem.id === item.searchWidget)?.tagName;
        // 只有搜索控件有值，才会添加到options中
        if (searchWidgetName) {
          setFromField(this.searchFrom, item.fieldCode);
          const options = getWidgetOptions(searchWidgetName, item)
          formOptions.push(_.merge(options, item.searchWidgetConfig));
        }
        // 如果循环到最后一个，则复制一份最原始的form
        if (length - 1 === index) {
          this.rawSearchFrom = _.cloneDeep(this.searchFrom);
          // 添加筛选和重置按钮
          formOptions.push(...this.getBtnConfig());
        }
      });
      return [{
        elRowAttrs: {
          gutter: 10
        },
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
      this.searchFrom = _.cloneDeep(this.rawSearchFrom);
      this.queryTableData();
    },

    onSave (row) {
      // 推出编辑清空状态
      row.$edit = false;
      // this.$refs.table.expose_clearCurCellPro();
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
      console.log(val);
    },


    handleCurrentChange (val) {
      console.log(val, this.page);
      this.queryTableData();
    },

    // TODO
    queryTableData () {
      const params = {
        ...this.searchFrom,
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
    }
  }
};
</script>

<style lang="less" scoped>
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
</style>
