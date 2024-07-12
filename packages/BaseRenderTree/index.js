import "./index.less";
import { pick } from "lodash";
import { str2obj, str2Fn, findInTree } from "/utils";
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
    isPreview: {
      type: Boolean,
      default() {
        return false;
      }
    }
  },
  data() {
    return {
      filterText: "",
      defaultProps: {
        children: "children",
        label: "label"
      },
      currentNodeKey: ""
    };
  },
  computed: {
    treeAttrs() {
      const { treeOptions, filterNode, isPreview } = this;
      if (isPreview) {
        const baseField = ["showCheckbox", "expandOnClickNode", "accordion", "iconClass"];
        const baseAttrs = pick(treeOptions, baseField);
        baseAttrs.nodeKey = "id";
        return baseAttrs;
      } else {
        const { filter, propsChildren, propsLabel, currentNodeKey } = treeOptions;

        const baseField = ["lazy", "nodeKey", "showCheckbox", "expandOnClickNode", "defaultExpandAll", "accordion", "iconClass"];

        const baseAttrs = pick(treeOptions, baseField);
        baseAttrs.currentNodeKey = currentNodeKey || this.currentNodeKey;

        const str2objFieldArr = ["defaultCheckedKeys", "defaultExpandedKeys"];
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

        const { renderContent, filterFn, loadFn, defaultExpandedKeys, defaultCheckedKeys } = transformObj;
        if (defaultExpandedKeys) {
          baseAttrs.defaultExpandedKeys = defaultExpandedKeys;
        }

        if (defaultCheckedKeys) {
          baseAttrs.defaultCheckedKeys = defaultCheckedKeys;
        }

        baseAttrs.props = {
          children: propsChildren,
          label: propsLabel
        };
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
      }
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
      if (!this.isPreview) {
        listeners["node-click"] = nodeClick || treeNodeClick;
      }
      return listeners;
    },
    finalTreeData() {
      let data;
      if (this.dataTransitionFn) {
        data = this.dataTransitionFn(this.treeData);
      } else {
        data = this.treeData;
      }
      const { currentNodeKeyFirst, currentNodeKey, nodeKey } = this.treeOptions;

      if (currentNodeKeyFirst) {
        this.$nextTick(() => {
          this.$refs.tree.setCurrentKey(data[0][nodeKey]);
        });
      }

      if (currentNodeKey) {
        if (findInTree(data, nodeKey, currentNodeKey)) {
          this.$refs.tree.setCurrentKey(currentNodeKey);
        } else {
          // 如果是我写死的值，则不产生这个警告
          if (!data[0].originalVal) {
            console.warn("设置了当前高亮，但是并未在数组中找到当前节点");
          }
        }
      }

      return data;
    }
  },
  watch: {
    filterText(val) {
      this.$refs.tree.filter(val);
    },
    finalTreeData: {
      handler() {
        const {
          treeOptions: { currentNodeKey, currentNodeKeyFirst, nodeKey },
          treeData,
          isPreview
        } = this;
        if ((currentNodeKey || currentNodeKeyFirst) && !isPreview) {
          const data = findInTree(treeData, nodeKey, currentNodeKey) || treeData[0];
          setTimeout(() => {
            this.treeListeners["node-click"](data);
          }, 300);
        }
      }
    }
  },
  methods: {
    filterNode(value, data) {
      if (!value) return true;
      return data[this.labelField].indexOf(value) !== -1;
    },
    treeNodeClick(data) {
      this.dispatch("CompleteTable", "refreshTable", data, data[this.treeOptions.deliveryField]);
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
        {filter ? <el-input v-model={this.filterText} class="padding10" size="small" placeholder="输入关键字进行过滤"></el-input> : ""}
        <div class="treeWrap">
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
      </div>
    );
  }
};
