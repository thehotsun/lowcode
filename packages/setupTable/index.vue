<template>
  <div class="flexWrap">
    <defaultTable v-if="pageLayout === 'table'" ref="table"> </defaultTable>
    <leftTreeRightTable v-if="pageLayout === 'tree-table'" ref="tree-table"></leftTreeRightTable>
    <tabsTable v-if="pageLayout === 'tabs-table'" ref="tabs-table"></tabsTable>
  </div>
</template>

<script>
import leftTreeRightTable from "./layout/leftTreeRightTable.vue";
import tabsTable from "./layout/tabsTable.vue";
import defaultTable from "./layout/defaultTable.vue";
export default {
  name: "SetupTable",
  components: {
    tabsTable,
    leftTreeRightTable,
    defaultTable
  },

  inject: {
    getPageInfo: {
      default: () => () => {}
    }
  },

  data() {
    return {
      pageLayout: "table"
    };
  },

  created() {},

  methods: {
    async init(id = "", formCode) {
      this.pageLayout = this.getPageInfo()?.pageLayout || "table";
      await this.$nextTick();
      this.$refs[this.pageLayout].init(id, formCode);
    }
  }
};
</script>

<style lang="less" scoped>
.flexWrap {
  width: 100%;
  height: 100%;
  display: flex;
}
</style>
