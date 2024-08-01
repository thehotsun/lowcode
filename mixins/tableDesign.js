export default {
  data() {
    return {
      loading: false
    };
  },
  methods: {
    showTableAttrs() {
      this.$refs.TableWidget.showTableAttrsDlg();
    },
    async handleSave() {
      this.loading = true;
      await this.handleSubmitTableConfig();
      this.loading = false;
    },
    showPreview() {
      const renderParams = this.getRenderParams();
      this.$refs.previewDlg.showDlg(renderParams);
    }
  }
};
