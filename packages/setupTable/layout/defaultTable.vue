<template>
  <div class="wrap">
    <operate @handleSave="handleSave" @showTableAttrs="showTableAttrs" @showPreview="showPreview"> </operate>

    <TableWidget ref="TableWidget"></TableWidget>

    <previewDlg ref="previewDlg"></previewDlg>
  </div>
</template>

<script>
import TableWidget from "../components/table-widget";
import operate from "../components/operate.vue";
import previewDlg from "../components/dialogs/previewDlg.vue";
export default {
  components: { TableWidget, operate, previewDlg },
  props: {
    mode: {
      type: Number,
      default() {
        return 0;
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

    // 保存按钮事件
    handleSubmitTableConfig() {
      const renderParams = this.$refs.TableWidget.getRenderParams();
      renderParams.mode = this.mode;
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
