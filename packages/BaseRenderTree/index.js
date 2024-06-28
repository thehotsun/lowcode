import "./index.less";
import { omit, pick } from "lodash";
import { str2obj, str2Fn } from "/utils";
import { h } from "vue";

export default {
  name: "BaseRenderTree",
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

      const baseField = ["lazy", "nodeKey", "showCheckbox", "expandOnClickNode", "defaultExpandAll"];
      const baseAttrs = pick(treeOptions, baseField);

      const str2objFieldArr = ["props"];
      const str2FnFieldArr = ["dataTransitionFn", "renderContent", "filterFn"];

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

      const { props, renderContent, filterFn } = transformObj;

      baseAttrs.props = props || defaultProps;
      if (filter) {
        baseAttrs.filterNodeMethod = filterFn || filterNode;
      }
      if (renderContent) {
        const { components = {}, data = () => {}, computed = {}, watch = {}, methods = {}, template } = renderContent();
        const formatterComponent = Vue.extend({
          components: components,
          props: { node: Object, data: Object, store: Object },
          data,
          computed,
          watch,
          methods,
          render: Vue.compile(template || "").render
        });
        baseAttrs.renderContent = (_, { node, data, store }) => {
          return h(formatterComponent, {
            props: { node, data, store }
          });
        };
      }
      return baseAttrs;
    },
    labelField() {
      return this.treeAttrs.props.label;
    },
    treeListeners() {}
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
    }
  },
  render() {
    const {
      filterText,
      treeData,
      treeOptions: { filter, style },
      treeAttrs,
      treeListeners
    } = this;
    return (
      <div class="baseRenderTreeContainer" style={style}>
        {filter ? <el-input v-model={filterText} size="small" placeholder="输入关键字进行过滤"></el-input> : ""}

        <el-tree
          ref="tree"
          highlight-current
          data={treeData}
          {...{
            treeAttrs,
            on: treeListeners
          }}
        ></el-tree>
      </div>
    );
  }
};
