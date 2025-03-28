<template>
  <div class="leftTreeRightTableWrap">
    <operate
      :loading="loading"
      :disposeShowTableSetting="disposeShowTableSetting"
      @handleSave="handleSave"
      @showTableAttrs="showTableAttrs"
      @showPreview="showPreview"
      @jumpResource="jumpResource"
    >
      <template slot="btn">
        <el-button size="mini" @click="showTabsAttrs">tabs属性设置</el-button>
      </template>
    </operate>
    <el-tabs v-model="activeName" class="full">
      <el-tab-pane v-for="(item, index) in finalTabsOptions.showLableInfo" :key="index" :label="item.title" :name="'' + index" class="full">
        <TableWidget ref="tableItemTab"> </TableWidget>
      </el-tab-pane>
    </el-tabs>

    <TabsAttrDlg ref="TabsAttrDlg" @changeTabsAttrs="changeTabsAttrs"></TabsAttrDlg>

    <previewDlg ref="previewDlg"></previewDlg>
  </div>
</template>

<script>
import TableWidget from "../components/table-widget";
import TabsAttrDlg from "../components/dialogs/tabsAttrDlg";
import previewDlg from "../components/dialogs/previewDlg.vue";

import operate from "../components/operate.vue";
import { TabsAttrs } from "/baseConfig/tabsBaseConfigs";
import tabs from "/mixins/tabs";
import { mergeAndClean } from "/utils/index.js";
import tableDesignMixin from "../../../mixins/tableDesign";

export default {
  components: { TableWidget, TabsAttrDlg, operate, previewDlg },
  mixins: [tabs, tableDesignMixin],
  props: {
    pageLayout: {
      type: String,
      default() {
        return "tabs-table";
      }
    }
  },
  data() {
    return {
      leftwidth: "200px",
      tabsOptions: new TabsAttrs(),
      tabTableOptionsArr: [],
      groupId: "",
      formCode: "",
      activeName: "0",
      loading: false
    };
  },

  computed: {
    finalTabsOptions() {
      return this.tabAttrsFormatter(this.tabsOptions);
    }
  },

  watch: {},
  inject: ["getListConfigJSON", "saveListConfigJSON", "getPageInfo", "showTableSetting"],

  methods: {
    async init(id = "", formCode) {
      this.groupId = id;
      this.formCode = formCode;
      const { data } = await this.requestTableConfig(id);
      const showLableInfo = this.getPageInfo().tabs.map(item => {
        return {
          id: item.id,
          title: item.title
        };
      });
      if (data) {
        const obj = JSON.parse(data);
        console.log("parsejson", obj);
        const { tabsOptions = {}, tabTableOptionsArr = [] } = obj;
        // const { tabsOptions = {}, ...tableOptions } = obj;
        // const tabTableOptionsArr = [];
        // // tabTableOptionsArr.length = 3;
        // for (let index = 0; index < tabTableOptionsArr.length; index++) {
        //   tabTableOptionsArr[index] = cloneDeep(tableOptions);
        // }
        // tabTableOptionsArr.fill(cloneDeep(tableOptions));
        this.tabsOptions = mergeAndClean(new TabsAttrs(), tabsOptions);
        this.tabTableOptionsArr = showLableInfo.map(tab => {
          return tabTableOptionsArr.find(item => item.id === tab.id);
        });
      } else {
        this.tabsOptions = new TabsAttrs();
        this.tabTableOptionsArr = [];
        this.tabTableOptionsArr.length = showLableInfo.length;
        this.tabTableOptionsArr.fill(false);
      }
      this.tabsOptions.showLableInfo = showLableInfo;
      await this.$nextTick();
      this.initTableWidget(id, formCode, this.tabTableOptionsArr);
      if (this.tabTableOptionsArr.length) {
        await this.$nextTick();
        this.getBtnConfigOptions();
      }
    },

    initTableWidget(id, formCode, tabTableOptionsArr) {
      tabTableOptionsArr.map((tableOptions, index) => {
        this.$refs.tableItemTab?.[index]?.init(id, formCode, tableOptions || undefined, true);
      });
    },

    async getBtnConfigOptions() {
      console.log(this.$refs.tableItemTab.length, "getBtnConfigOptions");
      try {
        const arr = await this.$refs.tableItemTab?.[0]?.expose_getBtnConfigOptions();
        this.$refs.tableItemTab.map(instance => {
          instance.expose_setBtnConfigOptions(arr);
        });
      } catch (error) {
        console.error("getBtnConfigOptions:", error);
      }
    },

    disposeShowTableSetting() {
      this.showTableSetting(this.activeName);
    },

    showTableAttrs() {
      this.$refs.tableItemTab[this.activeName].showTableAttrsDlg();
    },

    requestTableConfig(id) {
      return this.getListConfigJSON(id);
    },

    showTabsAttrs() {
      this.$refs.TabsAttrDlg.showTabsAttrs(this.tabsOptions);
    },

    changeTabsAttrs(tabsOptions) {
      this.tabsOptions = tabsOptions;
    },

    getRenderParams() {
      const tableWidgetArr = this.$refs.tableItemTab;

      const tabTableOptionsArr = tableWidgetArr.map((tableWidge, index) => {
        return {
          ...tableWidge.getRenderParams(),
          id: this.tabsOptions.showLableInfo[index].id
        };
      });

      return {
        tabTableOptionsArr,
        tabsOptions: this.tabsOptions,
        pageLayout: this.pageLayout
      };
    },
    // 保存按钮事件
    async handleSubmitTableConfig() {
      this.loading = true;
      const renderParams = this.getRenderParams();
      const { tabTableOptionsArr } = renderParams;
      const actionList = [];
      tabTableOptionsArr.map(tabTableOption => {
        tabTableOption.formOptions?.map((item, index) => {
          if (item.authorize !== "defaultShow") {
            actionList.push({
              actionCode: `${this.formCode}:${item.btnId}:${item.authorize}`,
              actionName: `${this.getPageInfo().tabs[index].tableName}:${item.tagAttrs.value}`
            });
          }
        });
      });
      console.log("savejson", renderParams);
      return this.saveListConfigJSON(
        {
          json: JSON.stringify(renderParams),
          actionList
        },
        this.groupId
      ).then(data => {
        this.loading = false;
        if (data.result === "0") {
          this.$message.success("保存成功");
        } else {
          this.$message.warning("保存失败");
        }
      });
    }
  }
};
</script>

<style lang="less" scoped>
.leftTreeRightTableWrap {
  width: 100%;
  height: 100%;
}
.content {
  display: flex;
  width: 100%;
  height: 100%;
}
::v-deep .el-tabs__content {
  width: 100%;
  height: 100%;
}
.full {
  width: 100%;
  height: 100%;
}
</style>
