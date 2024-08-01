<template>
  <div class="leftTreeRightTableWrap">
    <operate :loading="loading" @handleSave="handleSave" @showTableAttrs="showTableAttrs" @showPreview="showPreview">
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

    <TreeAttrDlg ref="TreeAttrDlg" @changeTreeAttrs="changeTreeAttrs"></TreeAttrDlg>

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
import tableDesignMixin from "../../../mixins/tableDesign";

import { merge } from "lodash";
export default {
  components: { TableWidget, TreeWidget, TreeAttrDlg, operate, previewDlg },
  mixins: [tableDesignMixin],
  props: {
    pageLayout: {
      type: String,
      default() {
        return "tree-table";
      }
    }
  },
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
      let table;
      if (data) {
        const obj = JSON.parse(data);
        console.log("parsejson", obj);
        const { treeOptions = {}, ...tableOptions } = obj;
        table = tableOptions;
        this.treeOptions = merge(new TreeAttrs(), treeOptions);
      } else {
        this.treeOptions = new TreeAttrs();
      }
      this.$refs.TableWidget.init(id, formCode, table);
      this.$refs.TreeWidget.init(id, formCode, this.treeOptions);
    },

    requestTableConfig(id) {
      return this.getListConfigJSON(id);
    },

    showTreeAttrs() {
      this.$refs.TreeAttrDlg.showTreeAttrs(this.treeOptions);
    },

    changeTreeAttrs(treeOptions) {
      this.treeOptions = treeOptions;
      this.$refs.TreeWidget.setTreeOptions(this.treeOptions);
    },

    getRenderParams() {
      const tablejson = this.$refs.TableWidget.getRenderParams();
      return {
        ...tablejson,
        treeOptions: this.treeOptions,
        pageLayout: this.pageLayout
      };
    },
    // 保存按钮事件
    async handleSubmitTableConfig() {
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
      console.log("savejson", renderParams);
      return this.saveListConfigJSON(
        {
          json: JSON.stringify(renderParams),
          actionList,
          treeSql: renderParams.treeOptions.treeSql
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
