<template>
  <div class="wrap">
    <complete-table ref="table" :table-data="tableData" :table-options="tableOptions" edit-mode
      @selection-change="selectListHandler">
      <!-- 注意这里的slot值要和tableOptions中配置的slotName一致 -->
      <!-- #operator是简写，详细请查阅vue文档 -->
      <template #operator>
      </template>
    </complete-table>
  </div>
</template>

<script>

import completeTable from '@/CommonDP/utils/commonRender/components/completeTable';
import { showConf as tableOptions } from '@/CommonDP/utils/commonRender/baseConfig/tableBaseConfig';
export default {
  components: { completeTable },
  data () {
    return {
      dialogVisible: false,
      tableOptions,
      tableData: [
        { fieldCode: 'name', fieldName: '姓名', englishName: '', columnWidth: '', align: 2, show: true, sort: false, searchWidget: 0 },
        { fieldCode: 'age', fieldName: '年龄', englishName: '', columnWidth: '', align: 1, show: true, sort: false, searchWidget: 1 }, { fieldCode: 'gender', fieldName: '性别', englishName: '', columnWidth: '', align: 0, show: true, sort: true, searchWidget: 2 },
        { fieldCode: 'phone', fieldName: '手机号', englishName: '', columnWidth: '', align: 0, show: false, sort: false, searchWidget: 3 },
        { fieldCode: 'education', fieldName: '学历', englishName: '', columnWidth: '', align: 0, show: true, sort: false, searchWidget: 0 }
      ],
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

  }
};
</script>

<style lang="stylus" rel="stylesheet/stylus" scoped>

</style>
