<!-- 分页组件 -->
<template>
  <div>
    <el-pagination :current-page.sync="page.pageNum" :page-size="page.pageSize" :layout="pageLayout"
      :total="page.totalCount" :page-sizes="[10, 20, 50, 100]" size="small" background @size-change="handleSizeChange"
      @current-change="handleCurrentChange" />
  </div>
</template>
<script>
export default {
  props: {
    page: {
      type: Object,
      required: false,
      default: () => ({
        pageNum: "pageNum",
        pageSize: "pageSize",
        totalCount: "totalCount"
      })
    },
    type: { type: Number, default: 0, required: false } // 为处理一个界面多个表格
    // 如组织架构   1、部门下人员列表分页  2、添加人员列表分页
    // 我的待办   1、我的审批  2、我的任务
    // 我的创建   1、我的审批  2、我的任务
  },
  data() {
    return {
      pageLayout: "total,sizes, prev, pager, next,jumper" // 分页组件
    };
  },
  methods: {
    handleSizeChange(val) {
      if (this.type && this.type === 1) this.$emit("handleSizeChange", val);
      else if (this.type && this.type === 2) this.$emit("handleSizeChangeAdd", val);
      else this.$emit("handleSizeChange", val);
    },
    handleCurrentChange(val) {
      if (this.type && this.type === 1) this.$emit("handleCurrentChange", val);
      else if (this.type && this.type === 2) this.$emit("handleCurrentChangeAdd", val);
      else this.$emit("handleCurrentChange", val);
    }
  }
};
</script>

<style lang="scss" scoped>
</style>
