import "./index.less";
import tableItem from "./component/tableItem";
import treeItem from "./component/treeItem";
import { merge, isEmpty } from "lodash";
import { TreeAttrs } from "/baseConfig/treeBaseConfig";
import { formatterWidthOrHeightStyle } from "/utils";

export default {
  name: "CompleteTable",
  componentName: "CompleteTable",
  components: {
    tableItem,
    treeItem
  },
  props: {
    listPageIdProp: String,
    wrapHeightProp: [Number, String]
  },

  data() {
    return {
      mode: 0,
      leftWidth: "200px"
    };
  },

  computed: {
    listPageId() {
      return this.listPageIdProp || this.getListPageId();
    }
  },

  inject: {
    requestTableConfig: {
      default: () => () => {
        console.warn("inject缺失requestTableConfig!");
      }
    },
    getListPageId: {
      default: () => () => {
        console.warn("inject缺失getListPageId!");
      }
    }
  },
  created() {
    this.initEventHandler();
    // this.initTableAttrs();
  },
  mounted() {
    // this.init()
  },

  methods: {
    expose_CompleteTableInstance() {
      return this;
    },
    async init(isPreview, json, externalParams) {
      if (!json || isEmpty(json)) {
        json = await this.queryTableConfig();
      }
      const { mode = 0 } = json;
      this.mode = mode;
      await this.$nextTick();
      switch (this.mode) {
        case 0:
          this.defaultInit(isPreview, json, externalParams);
          break;
        case 1:
          this.leftTreeRightTableInit(isPreview, json, externalParams);
          break;
        default:
          this.defaultInit(isPreview, json, externalParams);
          break;
      }
    },

    async leftTreeRightTableInit(isPreview, json, externalParams) {
      const { treeOptions = {}, ...tableOptions } = json;

      const tree = merge(new TreeAttrs(), treeOptions);

      if (tree.width) {
        this.leftWidth = formatterWidthOrHeightStyle(tree.width);
      }
      this.$refs.tableItem.init(isPreview, tableOptions, externalParams);
      this.$refs.treeItem.init(isPreview, tree, externalParams);
    },
    async defaultInit(isPreview, json, externalParams) {
      this.$refs.tableItem.init(isPreview, json, externalParams);
    },
    tabsTableInit() {},

    queryTableConfig() {
      return this.requestTableConfig(this.listPageId)
        .then(res => {
          if (res.result === "0") {
            const data = JSON.parse(res.data);
            return data;
          } else {
            console.error(`queryTableConfig message: ${res}`);
          }
        })
        .catch(e => {
          console.error(`queryTableConfig error: ${e}`);
        });
    },

    initEventHandler() {
      this.$on("refreshTable", this.dispatcher);
    },
    dispatcher(params) {
      this.$refs.tableItem.queryTableData(params);
    }
  },

  render() {
    const { mode, leftWidth } = this;

    if (mode === 1) {
      return (
        <div class="completeTableWrap">
          <div class="" style={{ width: leftWidth }}>
            <treeItem ref="treeItem"></treeItem>
          </div>
          <div class="" style={{ width: `calc(100% - ${leftWidth})` }}>
            <tableItem ref="tableItem"></tableItem>
          </div>
        </div>
      );
    } else if (mode === 2) {
      return <div ref=""></div>;
    } else {
      return <tableItem ref="tableItem"></tableItem>;
    }
  }
};
