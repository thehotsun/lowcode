import "./index.less";
import tableItem from "./component/tableItem";
import treeItem from "./component/treeItem";
import { merge, isEmpty } from "lodash";
import { TreeAttrs } from "/baseConfig/treeBaseConfig";
import { formatterWidthOrHeightStyle } from "/utils";
import tabs from "/mixins/tabs";

export default {
  name: "CompleteTable",
  componentName: "CompleteTable",
  components: {
    tableItem,
    treeItem
  },
  mixins: [tabs],
  props: {
    listPageIdProp: String,
    rawRelateIdProp: String,
    wrapHeightProp: [Number, String]
  },

  data() {
    return {
      pageLayout: "table",
      leftWidth: "200px",
      touch: {
        mouseDown: false,
        dragging: false,
        activeSplitter: null
      },
      tabsOptions: {},
      activeName: "0",
      wrapHeight: {
        height: ""
      }
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
    },
    getWrapHeight: {
      default: () => () => {
        console.warn("inject缺失getWrapHeight!");
        return {
          height: 0
        };
      }
    }
  },

  provide() {
    return {
      getWrapHeight: () => (this.pageLayout === "tabs-table" ? this.wrapHeight : this.getWrapHeight())
    };
  },

  watch: {
    pageLayout: {
      handler(val) {
        if (val === "tabs-table") {
          setTimeout(() => {
            try {
              this.wrapHeight.height = parseFloat(window.getComputedStyle(this.$refs.elTabs.$el.querySelector(".el-tabs__content")).height);
            } catch (error) {
              console.error("获取低代码table渲染elTabsDom高度报错，报错信息：", error);
            }
          }, 300);
        }
      }
    },
    activeName(val) {
      // eltable自己设置高度有问题，需要切换后重新触发布局方法
      setTimeout(() => {
        this.$refs[`tableItemTab${val}`].$refs.table.$refs.elTable.doLayout();
      });
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

    expose_getTableData() {
      switch (this.pageLayout) {
        case "table":
        case "tree-table":
          return this.$refs.tableItem.expose_getTableData();
        case "tabs-table":
          const {
            tabsOptions: { showLableInfo = [] }
          } = this;
          return showLableInfo?.map((_, index) => {
            this.$refs[`tableItemTab${index}`].expose_getTableData();
          });
        default:
          return this.$refs.tableItem.expose_getTableData();
      }
    },

    expose_setTableData(data) {
      switch (this.pageLayout) {
        case "table":
        case "tree-table":
          this.$refs.tableItem.expose_setTableData(data);
          break;
        case "tabs-table":
          const {
            tabsOptions: { showLableInfo = [] }
          } = this;
          showLableInfo?.map((_, index) => {
            this.$refs[`tableItemTab${index}`].expose_setTableData(data[index]);
          });
          break;
        default:
          this.$refs.tableItem.expose_setTableData(data);
          break;
      }
    },

    async expose_preview(data) {
      const { pageLayout = "table", ...otherData } = data;
      this.pageLayout = pageLayout;
      await this.$nextTick();
      if (pageLayout === "tree-table") {
        const { treeOptions = {}, ...tableOptions } = otherData;
        this.$refs.tableItem.expose_preview(tableOptions);
        this.$refs.treeItem.expose_preview(treeOptions);
        if (treeOptions.width) {
          this.leftWidth = formatterWidthOrHeightStyle(treeOptions.width);
        }
      } else if (pageLayout === "tabs-table") {
        const { tabTableOptionsArr = [], tabsOptions = {} } = otherData;
        this.tabsOptions = this.tabAttrsFormatter(tabsOptions);
        await this.$nextTick();
        tabTableOptionsArr.map((options, index) => {
          this.$refs[`tableItemTab${index}`].expose_preview(options);
        });
      } else {
        this.$refs.tableItem.expose_preview(otherData);
      }
    },

    async expose_refreshData(data) {
      await this.$refs.tableItem.expose_refreshData(null, data);
    },

    async expose_setSearchForm(...params) {
      console.log("expose_setSearchForm");
      await this.$refs.tableItem.expose_setSearchForm(...params);
    },
    async expose_enableAllBtn() {
      await this.$refs.tableItem.expose_enableAllBtn(otherData);
    },

    async init(isPreview, json, externalParams = {}, externalTriggerQueryTableData = false, tableDisbaled = false) {
      if (!json || isEmpty(json)) {
        json = await this.queryTableConfig();
      }
      const { pageLayout = "table" } = json;
      this.pageLayout = pageLayout;
      await this.$nextTick();
      switch (this.pageLayout) {
        case "table":
          this.defaultInit(isPreview, json, externalParams, externalTriggerQueryTableData, tableDisbaled);
          break;
        case "tree-table":
          this.leftTreeRightTableInit(isPreview, json, externalParams);
          break;
        case "tabs-table":
          this.tabsTableInit(isPreview, json, externalParams, externalTriggerQueryTableData);
          break;
        default:
          this.defaultInit(isPreview, json, externalParams, externalTriggerQueryTableData);
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
    async defaultInit(isPreview, json, externalParams, externalTriggerQueryTableData, tableDisbaled) {
      this.$refs.tableItem.init(isPreview, json, externalParams, externalTriggerQueryTableData, tableDisbaled);
    },
    // TODO externalParams不同怎么处理？
    async tabsTableInit(isPreview, json, externalParams = {}, externalTriggerQueryTableData) {
      const { tabTableOptionsArr, tabsOptions } = json;
      this.tabsOptions = this.tabAttrsFormatter(tabsOptions);
      await this.$nextTick();
      // for (let index = 0; index < tabTableOptionsArr.length; index++) {
      //   const el = this.$refs[`tabpane${index}`].$el;
      //   const display = window.getComputedStyle(el).display;
      //   if (display === "none") {
      //     const oldStyle = el.style.cssText;
      //     el.style.cssText = `display:block;position:absolute;z-index:-1000;`;
      //     setTimeout(() => {
      //       el.style.cssText = oldStyle;
      //     }, 400);
      //   }
      // }
      tabTableOptionsArr.map((tableOptions, index) => {
        this.$refs[`tableItemTab${index}`].init(isPreview, tableOptions, { ...externalParams, tabId: tableOptions.id }, externalTriggerQueryTableData);
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
    const {
      pageLayout,
      leftWidth,
      onMouseDown,
      tabsOptions: { attrs = {}, showLableInfo = [] },
      listPageIdProp,
      rawRelateIdProp
    } = this;

    // eslint-disable-next-line prefer-const
    let { activeName } = this;

    if (pageLayout === "tree-table") {
      return (
        <div class="completeTableWrap" ref="container">
          <div class="contentleft" style={{ width: leftWidth }}>
            <treeItem ref="treeItem"></treeItem>
          </div>
          <div class="splitpanes__splitter" onmousedown={onMouseDown}></div>
          <div class="contentRight" style={{ width: `calc(100% - ${leftWidth} - 7px)` }}>
            <tableItem ref="tableItem" rawRelateIdProp={rawRelateIdProp} listPageIdProp={listPageIdProp}></tableItem>
          </div>
        </div>
      );
    } else if (pageLayout === "tabs-table") {
      return (
        <el-tabs
          ref="elTabs"
          value={activeName}
          class={["top", "bottom"].includes(attrs.tabPosition) ? "tabsWrap flexDirColumn" : attrs.tabPosition === "right" ? "tabsWrap flexDirRowReverse" : "tabsWrap"}
          {...{
            attrs,
            on: {
              input: val => {
                this.activeName = val;
              }
            }
          }}
        >
          {showLableInfo.map((item, index) => (
            <el-tab-pane ref={"tabpane" + index} label={item.title} name={index + ""} class="panefull">
              <tableItem ref={"tableItemTab" + index} rawRelateIdProp={rawRelateIdProp} listPageIdProp={listPageIdProp}></tableItem>
            </el-tab-pane>
          ))}
        </el-tabs>
      );
    } else {
      return <tableItem ref="tableItem" rawRelateIdProp={rawRelateIdProp} listPageIdProp={listPageIdProp}></tableItem>;
    }
  }
};
