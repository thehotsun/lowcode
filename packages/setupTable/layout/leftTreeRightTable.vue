<template>
  <div class="leftTreeRightTableWrap">
    <operate @handleSave="handleSave" @showTableAttrs="showTableAttrs" @showPreview="showPreview">
      <template slot="btn">
        <el-button size="mini" @click="showTreeAttrs">树属性设置</el-button>
      </template>
    </operate>
    <div class="content">
      <div class="" :style="{ width: leftwidth }">
        <TreeWidget ref="TreeWidget"></TreeWidget>
      </div>
      <div class="" :style="{ width: `calc(100% - ${leftwidth})` }">
        <TableWidget ref="TableWidget"> </TableWidget>
      </div>
    </div>

    <TreeAttrDlg ref="TreeAttrDlg"></TreeAttrDlg>

    <previewDlg ref="previewDlg"></previewDlg>
  </div>
</template>

<script>
import TableWidget from "../components/table-widget";
import TreeWidget from "../components/tree-widget";
import TreeAttrDlg from "../components/dialogs/treeAttrDlg";
import previewDlg from "../components/dialogs/previewDlg.vue";

import operate from "../components/operate.vue";
import { TreeAttrs } from "/baseConfig/treeBaseConfig";

import { merge } from "lodash";
export default {
  components: { TableWidget, TreeWidget, TreeAttrDlg, operate, previewDlg },
  data() {
    return {
      leftwidth: "200px",
      treeOptions: {},
      groupId: "",
      formCode: ""
    };
  },
  inject: ["getListConfigJSON", "saveListConfigJSON"],

  methods: {
    async init(id = "", formCode) {
      this.groupId = id;
      this.formCode = formCode;
      const { data } = await this.requestTableConfig(id);
      const obj = JSON.parse(data);
      const { treeOptions, ...tableOptions } = obj;
      this.treeOptions = merge(new TreeAttrs(), treeOptions);
      this.$refs.TableWidget.init(id, formCode, tableOptions);
      this.$refs.TreeWidget.init(id, formCode, this.treeOptions);
      this.$refs.TreeAttrDlg.init(id, formCode, this.treeOptions);
    },
    showTableAttrs() {
      this.$refs.TableWidget.$refs.tableAttrsDlg.showDlg();
    },
    showPreview() {
      const renderParams = this.$refs.TableWidget.getRenderParams();
      this.$refs.previewDlg.showDlg(renderParams);
    },
    handleSave() {
      this.handleSubmitTableConfig();
    },
    requestTableConfig(id) {
      return this.getListConfigJSON(id);
    },
    getTableStyle() {
      const w = this.leftwidth;
      return { width: `calc(100% - ${w})` };
    },
    showTreeAttrs() {
      this.$refs.TreeAttrDlg.showTreeAttrs();
    },
    getRenderParams() {
      const tablejson = this.$refs.TableWidget.getRenderParams();
      const treeOptions = this.$refs.TreeAttrDlg.getRenderParams();
      return {
        ...tablejson,
        treeOptions
      };
    },
    // 保存按钮事件
    handleSubmitTableConfig() {
      const renderParams = this.getRenderParams();
      const actionList = [];
      renderParams.formOptions?.map(item => {
        if (item.authorize !== "defaultShow") {
          actionList.push({
            actionCode: `${this.formCode}:${item.btnId}:${item.authorize}`,
            actionName: item.tagAttrs.value
          });
        }
      });
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
