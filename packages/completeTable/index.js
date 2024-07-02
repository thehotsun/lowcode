import "./index.less";
import tableItem from "./component/tableItem";
import treeItem from "./component/treeItem";
import { cloneDeep, omit, merge, isEmpty } from "lodash";

export default {
  name: "CompleteTable",
  components: {
    tableItem,
    treeItem
  },
  props: {
    listPageIdProp: String,
    rawRelateIdProp: String,
    wrapHeightProp: [Number, String]
  },

  data() {
    return {
      mode: 0
    };
  },

  computed: {},
  methods: {
    async init(isPreview, json, externalParams) {
      this.resetAllData();
      await this.$nextTick();
      this.previewMode = !!isPreview;
      if (!json || isEmpty(json)) {
        await this.queryTableConfig();
      } else {
        this.parseTableConfig(json);
        await this.$nextTick();
      }
      if (isPreview) {
        const tableSingleData = {};
        this.composeData(tableSingleData);
        this.tableData = [];
        for (let index = 0; index < 10; index++) {
          this.tableData.push(tableSingleData);
        }
      } else {
        this.composeData();
        try {
          // 有些参数通过sessionStorage传递
          var jumpParams = JSON.parse(sessionStorage.getItem("lowcodeTableThisPageJumpParams"));
          // 只接受对象参数
          var isObj = Object.prototype.toString.call(jumpParams) === "[object Object]";
          sessionStorage.removeItem("lowcodeTableThisPageJumpParams");
        } catch (error) {
          console.error(error);
        }
        if (externalParams && isObj) {
          this.refreshData({ ...externalParams, ...jumpParams });
        } else if (externalParams) {
          this.refreshData(externalParams);
        } else if (isObj) {
          this.refreshData(jumpParams);
        } else {
          this.queryTableData();
        }
      }
      setTimeout(() => {
        try {
          this.headerHeight =
            parseFloat(window.getComputedStyle(this.$refs.elHeader.$el).height) +
            (this.showSearchFrom ? parseFloat(window.getComputedStyle(this.$refs.elHeaderSearchFrom.$el).height) + 20 : 0);
          console.log(this.headerHeight, " this.headerHeight");
        } catch (error) {
          console.error("获取低代码table header高度报错，报错信息：", error);
        }
      }, 1000);
    }
  },
  provide() {
    return {
      getTableRenderInstance: () => this.expose_CompleteTableInstance(),
      getWrapHeight: () => 0
    };
  },
  created() {
    this.initTableAttrs();
  },
  mounted() {
    // this.init()
  },

  inject: {},

  methods: {
    expose_CompleteTableInstance() {
      return this;
    }
  },

  render() {
    const { mode } = this;

    const curPageListeners = {
      "update:currentPage": val => {
        this.page.pageNo = val;
      },
      "size-change": handleSizeChange,
      "current-change": handleCurrentChange
    };
    const tableEvent = tableAttrs.clickRowShowDetialDialog
      ? {
          "row-click": showCheckDialog,
          "selection-change": selectListHandler,
          clickBtn: tableCellClick
        }
      : {
          "row-dblclick": showCheckDialog,
          "selection-change": selectListHandler,
          clickBtn: tableCellClick
        };

    if (mode === 1) {
      return (
        <div class="completeTableWrap" ref="">
          <treeItem ref="treeItem"></treeItem>
          <tableItem ref="tableItem"></tableItem>
        </div>
      );
    } else if (mode === 2) {
      return <div ref=""></div>;
    } else {
      return <tableItem ref="tableItem"></tableItem>;
    }
  }
};
