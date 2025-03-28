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
    },
    jumpResource() {
      const routeUrl = this.$router.resolve({ name: "adminResources", query: { searchKeyword: this.formCode } });
      window.open(routeUrl.href, "_blank");
    }
  }
};
