<template>
  <div class="wrap">
    <operate :loading="loading" @handleSave="handleSave" @showTableAttrs="showTableAttrs" @showPreview="showPreview"> </operate>

    <TableWidget ref="TableWidget"></TableWidget>

    <previewDlg ref="previewDlg"></previewDlg>
  </div>
</template>

<script>
import TableWidget from "../components/table-widget";
import operate from "../components/operate.vue";
import previewDlg from "../components/dialogs/previewDlg.vue";
import tableDesignMixin from "../../../mixins/tableDesign";
export default {
  components: { TableWidget, operate, previewDlg },
  mixins: [tableDesignMixin],
  props: {
    pageLayout: {
      type: String,
      default() {
        return "table";
      }
    }
  },
  data() {
    return {
      groupId: "",
      formCode: ""
    };
  },
  inject: ["saveListConfigJSON"],
  methods: {
    async init(id = "", formCode) {
      this.groupId = id;
      this.formCode = formCode;
      this.$refs.TableWidget.init(id, formCode);
    },
    getRenderParams() {
      const params = this.$refs.TableWidget.getRenderParams();
      params.pageLayout = this.pageLayout;
      return params;
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
.wrap {
  width: 100%;
  height: 100%;
}
</style>
