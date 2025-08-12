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
    removeParentProps(arr) {
      if (!Array.isArray(arr)) return;
      for (const item of arr) {
        if (item && typeof item === "object") {
          if ("parent" in item) {
            delete item.parent;
          }
          if (Array.isArray(item.children) && item.children.length > 0) {
            this.removeParentProps(item.children);
          }
        }
      }
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
