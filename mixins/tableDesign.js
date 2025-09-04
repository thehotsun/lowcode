import CustomDialog from "../packages/setupTable/components/dialogs/components/customDlg.vue";

export default {
  data() {
    return {
      loading: false,
      command: ""
    };
  },
  methods: {
    openDialog(btns) {
      return new Promise((resolve, reject) => {
        const DialogConstructor = window.Vue.extend(CustomDialog);
        const instance = new DialogConstructor({
          propsData: { btns }
        });
        instance.$mount();
        console.log("instance", instance);

        document.body.appendChild(instance.$el);

        instance.$on("confirm", data => {
          resolve(data);
          instance.$destroy();
          instance.$el.remove();
        });
        instance.$on("cancel", () => {
          reject(new Error("用户取消"));
          instance.$destroy();
          instance.$el.remove();
        });
      });
    },

    async handleExport(command) {
      console.log(command);
      this.command = command;
      if (command === "all") {
        const renderParams = this.getRenderParams();
        this.removeParentProps(renderParams.tableOptions);
        console.log(renderParams, "renderParams");
        this.$refs.operatesJsonDlg.open(renderParams, "export");
      } else {
        let btnArr = this.$refs.TableWidget.btnConfigArr.map(option => {
          option.tagAttrs.disabled = false;
          return option;
        });
        console.log("btnArr", btnArr);

        const checked = await this.openDialog(
          btnArr.map(item => {
            return {
              label: item.tagAttrs.value,
              value: item.btnId
            };
          })
        );
        console.log(btnArr, "btnArr", checked);
        btnArr = btnArr.filter(item => checked.includes(item.btnId));
        console.log(btnArr, "btnArr");
        this.$refs.operatesJsonDlg.open(btnArr, "export");
      }
    },
    handleImport(command) {
      console.log(command);
      this.command = command;
      let example;
      if (command === "all") {
        example = {
          fuzzyFieldSearchConfig: {},
          tableOptions: [],
          formOptions: [],
          keyField: "",
          pageLayout: "",
          tableAttrs: {}
        };
      } else {
        example = [
          {
            style: "margin-right: 20px;",
            tagName: "el-button",
            tagAttrs: {
              value: "",
              type: "primary",
              size: "small",
              plain: true,
              round: false,
              icon: "",
              disabled: false
            },
            extraOption: {},
            contentTextFrontTagOptions: {},
            contentTextBehindTagOptions: {},
            authorize: "",
            btnId: 101,
            renderId: 0.6038739029792521
          }
        ];
      }
      this.$refs.operatesJsonDlg.open(example, "import");
    },
    handleImportComfirm(jsonContent) {
      try {
        const json = JSON.parse(jsonContent);
        if (this.command === "all") {
          const tableWidget = this.$refs.TableWidget;
          if (json.pageLayout === "table") {
            tableWidget.init(tableWidget.groupId, null, json);
          } else if (json.pageLayout === "tree-table") {
            const { treeOptions = {}, ...tableOptions } = json;
            const tableWidget = this.$refs.TableWidget;
            this.changeTreeAttrs(treeOptions);
            tableWidget.init(tableWidget.groupId, null, tableOptions);
          } else {
            console.warn("pageLayout匹配失败！pageLayout为：", json.pageLayout);
          }
          this.$parent.pageLayout = json.pageLayout;
        } else {
          this.handleImportBtn(json);
        }
      } catch (error) {
        console.error("handleImportComfirm", error);
      }
    },
    handleImportBtn(importBtnArr) {
      const btnArr = this.$refs.TableWidget.btnConfigArr;
      for (const btn of importBtnArr) {
        this.addBtn(btn, btnArr);
      }
    },
    genBtnId() {
      return Math.floor(Math.random() * 900) + 100;
    },
    addBtn(data, btnList, maxTry = 100) {
      let newId = data.btnId || this.genBtnId();
      let tries = 0;

      while (btnList.some(item => item.btnId === newId)) {
        tries++;
        if (tries > maxTry) {
          throw new Error("生成唯一 btnId 失败，尝试次数过多");
        }
        newId = this.genBtnId();
      }

      btnList.push({ ...data, btnId: newId });
    },

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
