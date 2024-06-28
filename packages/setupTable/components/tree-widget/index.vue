<template>
  <div class="tree-container">
    <el-container>
      <base-render-tree v-if="initiated" :tree-data="treeData" :tree-options="treeOptions"></base-render-tree>
    </el-container>
  </div>
</template>

<script>
import { merge, pick } from "lodash";
import BaseRenderTree from "/packages/BaseRenderTree";
export default {
  name: "TreeWidget",
  components: { BaseRenderTree },
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
      initiated: false,
      treeData: [
        { label: "一级 1", s: "1", children: [{ label: "二级 1-1", s: "11", children: [{ label: "三级 1-1-1", s: "111" }] }] },
        {
          label: "一级 2",
          children: [
            { label: "二级 2-1", children: [{ label: "三级 2-1-1" }] },
            { label: "二级 2-2", children: [{ label: "三级 2-2-1" }] }
          ]
        },
        {
          label: "一级 3",
          children: [
            { label: "二级 3-1", children: [{ label: "三级 3-1-1" }] },
            { label: "二级 3-2", children: [{ label: "三级 3-2-1" }] }
          ]
        }
      ],
      treeOptions: {},
      currentKey: ""
    };
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
      }
    },

    setTreeData(data) {
      this.treeData = data;
      this.currentKey = data[0].id;
    },

    getTreeData() {
      return this.treeData;
    },

    getTreeOptions() {
      return this.treeOptions;
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
