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
      leftWidth: "200px",
      touch: {
        mouseDown: false,
        dragging: false,
        activeSplitter: null
      },
      tabs: [],
      activeName: 0
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

    async expose_preview(data) {
      const { treeOptions = {}, mode = 0, ...tableOptions } = data;
      this.mode = mode;
      await this.$nextTick();
      if (mode === 1) {
        this.$refs.tableItem.expose_preview(tableOptions);
        this.$refs.treeItem.expose_preview(treeOptions);
      } else if (mode === 2) {
        console.log();
      } else {
        this.$refs.tableItem.expose_preview(tableOptions);
      }
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
        case 2:
          this.tabsTableInit(isPreview, json, externalParams);
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
      this.$refs.tableItem.init(isPreview, tableOptions, externalParams, true);
      this.$refs.treeItem.init(isPreview, tree, externalParams);
    },
    async defaultInit(isPreview, json, externalParams) {
      this.$refs.tableItem.init(isPreview, json, externalParams);
    },
    // TODO externalParams不同怎么处理？
    tabsTableInit(isPreview, json, externalParams) {
      const {
        tabTableOptions: { tabTableOptionsArr, tabsOptions }
      } = json;
      this.tabs = tabsOptions;
      tabTableOptionsArr.map((tableOptions, index) => {
        this.$refs.tableItemTab[index].init(isPreview, tableOptions, externalParams);
      });
    },

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
    dispatcher(allData, primaryKeyValue) {
      this.$refs.tableItem.queryTableData(allData);
    },

    bindEvents() {
      document.addEventListener("mousemove", this.onMouseMove, { passive: false });
      document.addEventListener("mouseup", this.onMouseUp);
      document.onselectstart = function() {
        return false;
      };
    },
    unbindEvents() {
      document.removeEventListener("mousemove", this.onMouseMove, { passive: false });
      document.removeEventListener("mouseup", this.onMouseUp);
      document.onselectstart = null;
    },
    onMouseDown(event) {
      this.bindEvents();
      this.touch.mouseDown = true;
    },

    onMouseMove(event) {
      if (this.touch.mouseDown) {
        event.preventDefault();
        this.touch.dragging = true;
        this.leftWidth = this.getCurrentMouseDrag(event).x + "px";
        console.log(this.getCurrentMouseDrag(event));
      }
    },

    getCurrentMouseDrag(event) {
      const rect = this.$refs.container.getBoundingClientRect();
      const { clientX } = "ontouchstart" in window && event.touches ? event.touches[0] : event;

      return {
        x: clientX - rect.left
      };
    },

    onMouseUp() {
      this.touch.mouseDown = false;
      setTimeout(() => {
        this.touch.dragging = false;
        this.unbindEvents();
      }, 100);
    }
  },

  render() {
    const { mode, leftWidth, onMouseDown, tabs, activeName } = this;

    if (mode === 1) {
      return (
        <div class="completeTableWrap" ref="container">
          <div class="contentleft" style={{ width: leftWidth }}>
            <treeItem ref="treeItem"></treeItem>
          </div>
          {/* <div class="splitpanes__splitter" onmousedown={onMouseDown}></div> */}
          <div class="" style={{ width: `calc(100% - ${leftWidth})` }}>
            <tableItem ref="tableItem"></tableItem>
          </div>
        </div>
      );
    } else if (mode === 2) {
      return (
        <el-tabs v-model={activeName}>
          {tabs.map((tab, index) => (
            <el-tab-pane label={tab.label} name={index}>
              <tableItem ref="tableItemTab"></tableItem>
            </el-tab-pane>
          ))}
        </el-tabs>
      );
    } else {
      return <tableItem ref="tableItem"></tableItem>;
    }
  }
};
