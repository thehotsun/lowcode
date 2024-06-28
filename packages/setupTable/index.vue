<template>
  <div class="flexWrap">
    <defaultTable v-if="mode === 0" :ref="refDic['0']"> </defaultTable>
    <leftTreeRightTable v-if="mode === 1" :ref="refDic['1']"></leftTreeRightTable>
    <tabsTable v-if="mode === 2" :ref="refDic['2']"></tabsTable>
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
      mode: 0,
      refDic: {
        "0": "defaultTable",
        "1": "leftTreeRightTable",
        "2": "tabsTable"
      }
    };
  },

  created() {},

  methods: {
    async init(id = "", formCode) {
      this.mode = this.getPageInfo()?.mode || 0;
      await this.$nextTick();
      this.$refs[this.refDic[this.mode]].init(id, formCode);
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
