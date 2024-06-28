<template>
  <div class="tree-container">
    <el-container>
      <el-main style="align-items: baseline;">
        <el-input v-if="treeOptions.filter" v-model="filterText" size="small" placeholder="输入关键字进行过滤"></el-input>
        <el-tree v-if="initiated" ref="tree" highlight-current :data="treeData" v-bind="attrs" :style="treeOptions.style">
          <span slot-scope="{ node }">
            <span>{{ node.label }}</span>
          </span>
        </el-tree>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { str2obj, str2Fn } from "/utils";
import { merge, pick } from "lodash";

export default {
  name: "TreeWidget",
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
        { label: "一级 1", children: [{ label: "二级 1-1", children: [{ label: "三级 1-1-1" }] }] },
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
      currentKey: "",
      filterText: "",
      defaultProps: {
        children: "children",
        label: "label"
      }
    };
  },
  computed: {
    attrs() {
      const str2objFieldArr = ["props"];
      const str2FnFieldArr = ["dataTransitionFn", "renderContent", "filterFn"];
      str2objFieldArr.map(field => {
        if (this.treeOptions[field]) {
          this.treeOptions[field] = str2obj(this.treeOptions[field]);
        }
      });
      str2FnFieldArr.map(field => {
        if (this.treeOptions[field]) {
          this.treeOptions[field] = str2Fn(this.treeOptions[field]);
        }
      });

      const baseField = ["lazy", "nodeKey", "showCheckbox", "expandOnClickNode", "defaultExpandAll"];
      const baseAttrs = pick(this.treeOptions, baseField);
      baseAttrs.props = this.treeOptions.props || this.defaultProps;
      if (this.treeOptions.filter) {
        baseAttrs.filterNodeMethod = this.treeOptions.filterFn || this.filterNode;
      }
      if (this.treeOptions.renderContent) {
        baseAttrs.renderContent = this.treeOptions.renderContent;
      }
      return baseAttrs;
    }
  },
  watch: {
    filterText(val) {
      this.$refs.tree.filter(val);
    }
  },
  created() {},
  mounted() {},
  methods: {
    init(id, formCode, treeOptions) {
      if (treeOptions) {
        this.treeOptions = treeOptions;
        this.initiated = true;
      }
    },
    showTreeAttrs() {
      this.dialogVisibleTreeAttrs = true;
    },
    handleCloseTreeAttrs() {
      this.dialogVisibleTreeAttrs = false;
    },
    filterNode(value, data) {
      if (!value) return true;
      return data.label.indexOf(value) !== -1;
    },

    getNativeTree() {
      return this.$refs.tree;
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
  padding:0 20px 10px 20px;
}
</style>
