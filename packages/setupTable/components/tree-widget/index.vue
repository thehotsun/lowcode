<template>
  <div class="tree-container">
    <el-container>
      <base-render-tree v-if="initiated" :key="random" ref="baseTree" :tree-data="treeData" :tree-options="treeOptions"></base-render-tree>
    </el-container>
  </div>
</template>

<script>
import BaseRenderTree from "/packages/BaseRenderTree";
import tree from "/mixins/tree";
export default {
  name: "TreeWidget",
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
      currentKey: "",
      random: +new Date()
    };
  },

  inject: {
    enterpriseId: {
      default: () => ""
    },
    getPrjInfo: {
      default: () => () => {
        console.warn("inject缺失getPrjInfo!");
      }
    },
    generalRequest: {
      default: () => () => {
        console.warn("inject缺失generalRequest!");
      }
    },
    requestTreeData: {
      default: () => () => {
        console.warn("inject缺失requestTreeData!");
      }
    }
  },

  watch: {
    treeOptions: {
      deep: true,
      handler() {
        this.queryTreeData();
        this.random = +new Date();
      }
    }
  },

  created() {},
  mounted() {},
  methods: {
    init(id, formCode, treeOptions) {
      if (treeOptions) {
        this.treeOptions = treeOptions;
        this.$nextTick(() => {
          this.initiated = true;
        });
      } else {
        this.initiated = true;
      }
      this.queryTreeData();
    },

    setTreeData(data) {
      this.treeData = data;
      this.currentKey = data[0].id;
    },

    setTreeOptions(treeOptions) {
      this.treeOptions = treeOptions;
    }
  }
};
</script>
<style lang="less" scoped>
.tree-container {
  margin: 2px;

  .form-widget-list {
    min-height: 28px;
  }
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
::v-deep .el-main {
  padding: 0 20px 10px 20px;
}
</style>
