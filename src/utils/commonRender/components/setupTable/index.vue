<template>
  <el-container>
    <el-header>
      <div class="operate">
        <el-button size='small' type="primary" @click="handleAdd">新增一条</el-button>
        <el-button size='small' type="danger" :disabled="!selected.length" @click="handleDelete">删除</el-button>
      </div>
    </el-header>

    <el-main>
      <el-container style="height: 100%">
        <el-main>
          <base-render-table ref="table" :table-data="tableData" :table-options="tableOptions" edit-mode
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
    <el-button style="position:fixed;right:0;top:0;" @click="handleSubmit">提交</el-button>
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
import { getElBtnConfig } from '../../baseConfig/widgetBaseConfig';
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
      showCodemirror: false,
      selected: []
    };
  },

  mounted () {
    this.formOptions = this.composeFromOptions();
  },

  methods: {
    // 设置searchFrom和装配fromOptions
    composeFromOptions () {
      const formOptions = this.getBtnConfig()
      return [{
        elRowAttrs: {
          gutter: 10
        },
        formItem: formOptions
      }];
    },

    getBtnConfig () {
      const filterConfig = getElBtnConfig('primary', this.handleAdd, '添加');
      const resetConfig = getElBtnConfig('', this.handleDelete, '删除');
      this.setColSpan(filterConfig, 2);
      this.setColSpan(resetConfig, 2);
      return [filterConfig,
        resetConfig];
    },

    setColSpan (data, span) {
      if (data.elColAttrs) {
        data.elColAttrs.span = span;
      } else {
        data.elColAttrs = {
          span: span
        };
      }
    },

    handleAdd () {
      this.queryTableData();
    },
    handleDelete () {

      this.searchFrom = _.cloneDeep(this.rawSearchFrom);
      this.queryTableData();
    },

    onSave (row) {
      // 推出编辑清空状态
      row.$edit = false;
      this.$refs.table.expose_clearCurCellPro();
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
