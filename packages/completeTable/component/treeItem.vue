<template>
  <div class="tree-container">
    <base-render-tree v-if="initiated" :tree-data="treeData" :tree-options="treeOptions" :is-preview="isPreview" :style="{ style: treeOptions.style }"></base-render-tree>
  </div>
</template>

<script>
import BaseRenderTree from "/packages/BaseRenderTree";
import tree from "/mixins/tree";
export default {
  name: "CompleteTreeItem",
  components: { BaseRenderTree },
  mixins: [tree],
  props: {
    options: {
      type: Object,
      default() {
        return {};
      }
    }
  },
  data() {
    return {
      isPreview: false,
      currentKey: ""
    };
  },

  created() {},
  mounted() {},
  methods: {
    async expose_preview(data) {
      this.init(true, data);
      this.previewMode = true;
    },
    async init(isPreview, treeOptions, externalParams = {}) {
      this.resetAllData();
      await this.$nextTick();
      this.isPreview = !!isPreview;
      this.externalParams = externalParams;
      if (treeOptions) {
        this.treeOptions = treeOptions;
        this.$nextTick(() => {
          this.initiated = true;
        });
      } else {
        console.warn("当前树没有配置options！");
      }
      this.queryTreeData();
    },

    resetAllData() {},

    refreshData(data) {
      this.externalParams = data;
      this.queryTreeData();
    },

    refresh() {
      this.queryTreeData();
    }
  }
};
</script>
<style lang="less" scoped>
.tree-container {
  width: 100%;
  height: 100%;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}
.operate {
  height: 74px;
  display: flex;
  align-items: start;
}
// ::v-deep .el-main {
//   padding: 0 20px 10px 20px;
// }
</style>
