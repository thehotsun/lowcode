<template>
  <div class="leftTreeRightTableWrap">
    <operate @handleSave="handleSave" @showTableAttrs="showTableAttrs" @showPreview="showPreview">
      <template slot="btn">
        <el-button size="mini" @click="showTabsAttrs">tabs属性设置</el-button>
      </template>
    </operate>
    <el-tabs v-model="activeName">
      <el-tab-pane v-for="(options, index) in tabsOptions" :key="index" :label="options.label" :name="index">
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
import { TabsAttrs } from "/baseConfig/tabsAttrDlg";

import { merge } from "lodash";
export default {
  components: { TableWidget, TreeWidget, TabsAttrDlg, operate, previewDlg },
  props: {
    mode: {
      type: Number,
      default() {
        return 1;
      }
    }
  },
  data() {
    return {
      leftwidth: "200px",
      tabsOptions: {},
      groupId: "",
      formCode: "",
      activeName: 0
    };
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
        const { tabsOptions = {}, tabTableOptionsArr = [] } = obj;
        this.tabsOptions = merge(new TabsAttrs(), tabsOptions);
        await this.$nextTick();
        tabTableOptionsArr.map((tableOptions, index) => {
          this.$refs.tableItemTab[index].init(isPreview, tableOptions, externalParams);
        });
      } else {
        console.warn("当前多tab页的options为空！");
      }
    },
    showTableAttrs() {
      this.$refs.TableWidget.$refs.tableAttrsDlg.showDlg();
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
      this.$refs.TabsAttrDlg.setTabsOptions(this.tabsOptions);
    },

    getRenderParams() {
      const tableWidgetArr = this.$refs.TableWidget;

      const tabTableOptionsArr = tableWidgetArr.map(tableWidge => {
        return tableWidge.getRenderParams();
      });

      return {
        tabTableOptionsArr,
        tabsOptions: this.tabsOptions,
        mode: this.mode
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
</style>
