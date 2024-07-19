<template>
  <div class="leftTreeRightTableWrap">
    <operate @handleSave="handleSave" @showTableAttrs="showTableAttrs" @showPreview="showPreview">
      <template slot="btn">
        <el-button size="mini" @click="showTabsAttrs">tabs属性设置</el-button>
      </template>
    </operate>
    <el-tabs v-model="activeName" class="full">
      <el-tab-pane v-for="(name, index) in finalTabsOptions.showLableInfo" :key="index" :label="name" :name="'' + index" class="full">
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

import { merge, cloneDeep } from "lodash";
export default {
  components: { TableWidget, TabsAttrDlg, operate, previewDlg },
  mixins: [tabs],
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
      activeName: "0"
    };
  },

  computed: {
    finalTabsOptions() {
      return this.tabAttrsFormatter(this.tabsOptions);
    }
  },

  watch: {
    // "tabsOptions.showLableInfo": {
    //   handler(val) {
    //     console.warn("finalTabsOptions.showLableInfo", val);
    //     this.$nextTick(() => {});
    //     this.initTableWidget(id, formCode, this.tabTableOptionsArr);
    //   }
    // }
  },
  inject: ["getListConfigJSON", "saveListConfigJSON"],

  methods: {
    async init(id = "", formCode) {
      this.groupId = id;
      this.formCode = formCode;
      const { data } = await this.requestTableConfig(id);
      if (data) {
        const obj = JSON.parse(data);
        console.log("parsejson", obj);
        // const { tabsOptions = {},  tabTableOptionsArr = [] } = obj;
        const { tabsOptions = {}, ...tableOptions } = obj;
        const tabTableOptionsArr = [];
        tabTableOptionsArr.length = 3;
        for (let index = 0; index < tabTableOptionsArr.length; index++) {
          tabTableOptionsArr[index] = cloneDeep(tableOptions);
        }
        // tabTableOptionsArr.fill(cloneDeep(tableOptions));
        this.tabsOptions = merge(new TabsAttrs(), tabsOptions);
        this.tabTableOptionsArr = tabTableOptionsArr;
        await this.$nextTick();
        this.initTableWidget(id, formCode, tabTableOptionsArr);
        await this.$nextTick();
        this.getBtnConfigOptions();
      } else {
        console.warn("当前多tab页的options为空！");
      }
    },

    initTableWidget(id, formCode, tabTableOptionsArr) {
      tabTableOptionsArr.map((tableOptions, index) => {
        // 需要判断是否是新增状态，而且后期还要考虑和tab页对应问题
        this.$refs.tableItemTab?.[index]?.init(id, formCode, tableOptions || false, true);
      });
    },

    async getBtnConfigOptions() {
      console.log(this.$refs.tableItemTab.length, "getBtnConfigOptions");
      const arr = await this.$refs.tableItemTab?.[0]?.expose_getBtnConfigOptions();
      console.warn(arr, "getBtnConfigOptions", this.$refs.tableItemTab.length);
      this.$refs.tableItemTab.map(instance => {
        instance.expose_setBtnConfigOptions(arr);
      });
    },

    showTableAttrs() {
      this.$refs.TableWidget.showTableAttrsDlg();
    },

    showPreview() {
      const renderParams = this.getRenderParams();
      this.$refs.previewDlg.showDlg(renderParams);
    },
    handleSave() {
      this.handleSubmitTableConfig();
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
      const tableWidgetArr = this.$refs.TableWidget;

      const tabTableOptionsArr = tableWidgetArr.map(tableWidge => {
        return tableWidge.getRenderParams();
      });

      return {
        tabTableOptionsArr,
        tabsOptions: this.tabsOptions,
        pageLayout: this.pageLayout
      };
    },
    // 保存按钮事件
    handleSubmitTableConfig() {
      const renderParams = this.getRenderParams();
      // TODO 多个列表的多个按钮
      const actionList = [];
      renderParams.formOptions?.map(item => {
        if (item.authorize !== "defaultShow") {
          actionList.push({
            actionCode: `${this.formCode}:${item.btnId}:${item.authorize}`,
            actionName: item.tagAttrs.value
          });
        }
      });
      console.log("savejson", renderParams);
      return this.saveListConfigJSON(
        {
          json: JSON.stringify(renderParams),
          actionList
        },
        this.groupId
      ).then(data => {
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
