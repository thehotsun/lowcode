<template>
  <div class="wrap">
    <base-render-table ref="table" :tableData="tableData" :tableOptions="tableOptions" border
      @selection-change="selectListHandler" @current-change="handleCurrentChange">

      <!-- 注意这里的slot值要和tableOptions中配置的slotName一致 -->
      <!-- #operator是简写，详细请查阅vue文档 -->
      <template #operator="{ row }">
        <el-button v-if="row.$edit" @click="onSave(row)">
          保存
        </el-button>
      </template>

    </base-render-table>
  </div>
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

import BaseRenderTable from '../packages/BaseRenderTable/index';
import tableOptions from './tableOptions2'
import _ from 'lodash'
import { align, searchWidget } from '../baseConfig/tableSelectConfigs';
export default {
  components: {
    BaseRenderTable
  },
  data () {
    return {
      // tabledata 属性值要做到和tableOptions中的prop相对应
      tableData1: [{ fieldCode: 'name', fieldName: '姓名', englishName: '', columnWidth: '', align: 2, show: true, sort: false, searchWidget: 0, }, { fieldCode: 'age', fieldName: '年龄', englishName: '', columnWidth: '', align: 1, show: true, sort: false, searchWidget: 0, }, { fieldCode: 'gender', fieldName: '性别', englishName: '', columnWidth: '', align: 0, show: true, sort: true, searchWidget: 0, }, { fieldCode: 'phone', fieldName: '手机号', englishName: '', columnWidth: '', align: 0, show: false, sort: false, searchWidget: 0, }, { fieldCode: 'education', fieldName: '学历', englishName: '', columnWidth: '', align: 0, show: true, sort: false, searchWidget: 0, },],
      tableOptions,
      tableData: [{
        name: '阿三',
        age: '22',
        gender: '男',
        phone: 1111,
        education: '小学'
      }, {
        name: '阿三',
        age: '22',
        gender: '男',
        phone: 1111,
        education: '小学'
      }, {
        name: '阿三',
        age: '22',
        gender: '男',
        phone: 1111,
        education: '小学'
      }, {
        name: '阿三',
        age: '22',
        gender: '男',
        phone: 1111,
        education: '小学'
      }]
    }
  },
  mounted () {
    const sample = tableOptions[0]
    const newTableOptions = []
    this.tableData1.filter(item => item.show).map(item => {
      const obj = _.cloneDeep(sample)
      obj.prop = item.fieldCode
      obj.label = item.fieldName
      obj.align = align.find(alignitem => alignitem.id === item.align).value 
      obj['min-width'] = item.width
      obj.sortable = !!item.sort
      newTableOptions.push(obj)
    })
    this.tableOptions = newTableOptions
  },

  methods: {
    onSave (row) {
      // 推出编辑清空状态
      row.$edit = false;
      this.$refs.table.expose_clearCurCellPro()
    },

    handleSubmit () {
      console.log(JSON.parse(JSON.stringify(this.tableData)));
    },

    rowClick (val) {
      console.log(val);
    },

    selectListHandler (val) {
      console.log(val);
    },

    handleCurrentChange (val) {
      console.log(val);
    },
  }
}
</script>


<style lang="less" scoped>
.wrap {
  width: 100%;
}
</style>