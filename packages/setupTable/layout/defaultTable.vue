<template>
  <div class="wrap">
    <operate :loading="loading" @handleSave="handleSave" @showTableAttrs="showTableAttrs" @showPreview="showPreview" @jumpResource="jumpResource"> </operate>

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
      const qrButtons = [];
      renderParams.formOptions?.map(item => {
        if (item.authorize !== "defaultShow") {
          actionList.push({
            actionCode: `${this.formCode}:${item.btnId}:${item.authorize}`,
            actionName: item.tagAttrs.value
          });
        }
        if (item.extraOption.btnType === "qrCode") {
          // 二维码按钮
          const { qrSize, title, titlePosition, expireDays, briefPageFields, briefPageOperations, targetFormId, printCountPerRow, printFileType } = item.extraOption;
          qrButtons.push({
            actionCode: `${this.formCode}:${item.btnId}:${item.authorize}`,
            qrSize,
            title,
            titlePosition,
            expireDays,
            briefPageFields: briefPageFields.map((item, index) => {
              return {
                fieldName: item.fieldName,
                fieldDisplayName: item.fieldDisplayName,
                isShow: item.show ? 1 : 0,
                seqNo: index
              };
            }),
            briefPageOperations,
            targetFormId,
            printCountPerRow,
            printFileType,
            listPageId: this.groupId
          });
        }
      });
      this.removeParentProps(renderParams.tableOptions);

      return this.saveListConfigJSON(
        {
          json: JSON.stringify(renderParams),
          actionList,
          qrButtons
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
