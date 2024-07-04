import "./index.less";
import { pick } from "lodash";
import { str2obj, str2Fn } from "/utils";
import emitter from "/utils/emitter";

export default {
  name: "BaseRenderTree",
  mixins: [emitter],
  props: {
    treeOptions: {
      type: Object,
      default() {
        return {};
      }
    },
    treeData: {
      type: Array,
      default() {
        return [];
      }
    },
    preview: {
      type: Boolean,
      default() {
        return;
      }
    }
  },
  data() {
    return {
      filterText: "",
      defaultProps: {
        children: "children",
        label: "label"
      }
    };
  },
  computed: {
    treeAttrs() {
      const { treeOptions, defaultProps, filterNode } = this;
      const { filter } = treeOptions;

      const baseField = ["lazy", "nodeKey", "showCheckbox", "expandOnClickNode", "defaultExpandAll", "accordion", "iconClass", "currentNodeKey"];
      const baseAttrs = pick(treeOptions, baseField);

      const str2objFieldArr = ["props", "defaultCheckedKeys", "defaultExpandedKeys"];
      const str2FnFieldArr = ["renderContent", "filterFn", "loadFn"];

      const transformObj = {};
      str2objFieldArr.map(field => {
        if (treeOptions[field]) {
          transformObj[field] = str2obj(treeOptions[field]);
        }
      });
      str2FnFieldArr.map(field => {
        if (treeOptions[field]) {
          transformObj[field] = str2Fn(treeOptions[field]);
        }
      });

      const { props, renderContent, filterFn, loadFn, defaultExpandedKeys, defaultCheckedKeys } = transformObj;
      if (defaultExpandedKeys) {
        baseAttrs.defaultExpandedKeys = defaultExpandedKeys;
      }

      if (defaultCheckedKeys) {
        baseAttrs.defaultCheckedKeys = defaultCheckedKeys;
      }

      baseAttrs.props = props || defaultProps;
      if (filter) {
        baseAttrs.filterNodeMethod = filterFn || filterNode;
      }
      if (loadFn) {
        baseAttrs.load = loadFn;
      }

      if (renderContent) {
        const {
          components = {},
          data = () => {
            return {};
          },
          computed = {},
          watch = {},
          methods = {},
          template
        } = renderContent();
        console.log(renderContent(), "renderContent()");
        // eslint-disable-next-line no-undef
        const formatterComponent = Vue.extend({
          components: components,
          props: { node: Object, data: Object, store: Object },
          data,
          computed,
          watch,
          methods,
          // eslint-disable-next-line no-undef
          render: Vue.compile(template || "").render
        });
        baseAttrs.renderContent = function(_, { _self, node, data, store }) {
          return _(formatterComponent, {
            props: { node, data, store }
          });
        };
      }
      console.log(baseAttrs, "baseAttrs");
      return baseAttrs;
    },

    dataTransitionFn() {
      if (this.treeOptions.dataTransitionFn) {
        return str2Fn(this.treeOptions.dataTransitionFn);
      }
    },
    labelField() {
      return this.treeAttrs.props.label || "label";
    },
    treeListeners() {
      const { treeOptions, treeNodeClick } = this;
      const listeners = {};
      const str2FnFieldArr = ["nodeClick"];

      const transformObj = {};
      str2FnFieldArr.map(field => {
        if (treeOptions[field]) {
          transformObj[field] = str2Fn(treeOptions[field]).bind(this);
        }
      });

      const { nodeClick } = transformObj;
      if (!this.preview) {
        listeners["node-click"] = nodeClick || treeNodeClick;
      }
      return listeners;
    },
    finalTreeData() {
      if (this.dataTransitionFn) {
        return this.dataTransitionFn(this.treeData);
      }
      return this.treeData;
    }
  },
  watch: {
    filterText(val) {
      this.$refs.tree.filter(val);
    }
  },
  methods: {
    filterNode(value, data) {
      if (!value) return true;
      return data[this.labelField].indexOf(value) !== -1;
    },
    treeNodeClick(data) {
      this.dispatch("CompleteTable", "refreshTable", {
        [this.treeOptions.deliveryField]: data[this.treeOptions.deliveryField]
      });
    }
  },
  render() {
    const {
      finalTreeData,
      treeOptions: { filter },
      treeAttrs,
      treeListeners
    } = this;
    return (
      <div class="baseRenderTreeContainer">
        {filter ? <el-input v-model={this.filterText} size="small" placeholder="输入关键字进行过滤"></el-input> : ""}

        <el-tree
          ref="tree"
          highlight-current
          data={finalTreeData}
          {...{
            attrs: {
              ...treeAttrs
            },
            on: {
              ...treeListeners
            }
          }}
        ></el-tree>
      </div>
    );
  }
};
