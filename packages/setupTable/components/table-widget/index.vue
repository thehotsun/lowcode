<template>
  <div class="content">
    <div v-if="showSearchFromArea" class="searchArea">
      <base-render-form
        ref="form"
        :general-request="generalRequest"
        :form-data="searchFrom"
        :inline="true"
        :form-options="searchFromOptions"
        :show-footer="false"
        :use-dialog="false"
        mode="design"
        label-width=""
      ></base-render-form>
    </div>

    <div class="btnDesign btns">
      <span v-for="(item, index) in btnConfigArr" :key="item.renderId" class="btn" style="display:inline-block; position: relative;">
        <el-dropdown v-if="item.authorize === 'E' && ['download', 'flowDocDownload'].includes(item.btnType)">
          <el-button type="" size="small" :icon="item.tagAttrs.icon" @click="handleBtnDetail(index)"
            >{{ item.tagAttrs.value }} <i :class="item?.contentTextBehindTagOptions?.className"></i
          ></el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item v-for="(elDropdownItem, elIndex) in elDropdownOptions" :key="elIndex">{{ elDropdownItem.label }}</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-button v-else type="" size="small" :icon="item.tagAttrs.icon" @click="handleBtnDetail(index)"
          >{{ item.tagAttrs.value }} <i :class="item?.contentTextBehindTagOptions?.className"></i
        ></el-button>
        <i type="danger" class="el-icon-circle-close middle " @click="handleDelBtn(index)"></i>
      </span>

      <el-dropdown class="btn" szie="small" @command="handleBtnCommand">
        <el-button type="primary" size="small" plain> 添加功能按钮<i class="el-icon-arrow-down el-icon--right"></i> </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item v-for="btnType in btnTypeArr" :key="btnType.name" :command="btnType.name">{{ btnType.displayName }}</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>

    <div class="tablesetup">
      <single-setup-table
        ref="singleSetupTable"
        :general-request="generalRequest"
        :raw-table-data.sync="tableData"
        :generate-query-sql="generateQuerySql"
        :save-sql="saveSql"
        :list-page-id-prop="listPageIdProp"
        :btn-config-arr="btnConfigArr"
        :raw-fuzzy-field-search-config="fuzzyFieldSearchConfig"
        edit-mode
        @searchOptionsChange="searchOptionsChange"
      >
      </single-setup-table>
    </div>

    <el-drawer title="按钮属性设置" :visible.sync="drawer" :direction="direction">
      <setupBtnConfig
        ref="setupBtnConfig"
        :key-field="keyField"
        :group-id="groupId"
        :drawer="drawer"
        @refreshList="refreshList"
        @onSubmit="onSubmit"
        @onClose="onClose"
      ></setupBtnConfig>
    </el-drawer>

    <tableAttrsDlg ref="tableAttrsDlg" :btn-config-arr="btnConfigArr" :delivery-fields-option="deliveryFieldsOption" @changeTableAttrs="changeTableAttrs"></tableAttrsDlg>
  </div>
</template>

<script>
import { getSingleTableData, getTableAttrs } from "/baseConfig/tableBaseConfig";
import setupBtnConfig from "../setupBtnConfig";
import singleSetupTable from "../singleSetupTable";
import { getWidgetOptions, getWidgetDefaultVal, depthFirstSearchWithRecursive } from "../../../../utils";
import { searchWidget } from "/baseConfig/tableSelectConfigs";
import { btnTypeArr } from "/baseConfig/btnBaseConfig.js";
import { merge } from "lodash";
import tableAttrsDlg from "../dialogs/tableAttrsDlg.vue";
export default {
  name: "TableWidget",
  components: {
    singleSetupTable,
    setupBtnConfig,
    tableAttrsDlg
  },
  props: { listPageIdProp: String },
  data() {
    return {
      elDropdownOptions: [
        {
          command: "curSelect",
          label: "当前选中"
        },
        {
          command: "curPage",
          label: "当前页"
        },
        {
          command: "all",
          label: "全部"
        }
      ],
      btnTypeArr,
      tableData: [],
      setupForm: {},
      groupId: "",
      btnConfigArr: [],
      direction: "rtl",
      drawer: false,
      tableAttrs: getTableAttrs(),
      // 主键
      keyField: "",
      searchFromOptions: [],
      searchFrom: {},
      showSearchFromArea: false,
      formListExtraOption: {},
      tableListExtraOption: {},
      metaListExtraOption: {},
      flowListExtraOption: {},
      deliveryFieldsOption: {
        options: []
      },
      fuzzyFieldSearchConfig: null
    };
  },

  inject: [
    "componentDicList",
    "Sortable",
    "requestFieldList",
    "saveSql",
    "generateQuerySql",
    "requestFormList",
    "requestTableList",
    "requestMetaList",
    "requestFlowList",
    "requestAuthorizeList",
    "getListConfigJSON",
    "requestPrimekey",
    "generalRequest",
    "checkPermission",
    "getPageInfo"
  ],
  provide() {
    return {
      getTableDesignFields: () => this.deliveryFieldsOption.options,
      getFormList: this.queryFormList
    };
  },
  watch: {
    showSearchFromArea(val) {
      if (val) {
        this.$nextTick().then(() => this.searchAreaDrop());
      }
    }
  },

  async mounted() {
    this.btnsColumnDrop();
  },
  beforeDestroy() {
    this.sortableInstance?.destroy();
  },

  errorCaptured(err) {
    // 看着心烦，直接屏蔽，elform计算label值得时候得问题，在beforeDestroy周期里，不影响功能
    if (err.message === "[ElementForm]unpected width ") return false;
    else return true;
  },

  methods: {
    async init(id = "", formCode, jsonOptions, externalPass) {
      console.log(id, "id");
      this.groupId = id;
      if (!externalPass) {
        this.expose_getBtnConfigOptions();
      }
      let obj;
      if (jsonOptions === undefined) {
        const res = await this.requestTableConfig();
        obj = JSON.parse(res.data);
      } else {
        obj = jsonOptions;
      }
      // 编辑状态
      if (obj) {
        const { tableOptions, formOptions, keyField, tableAttrs, fuzzyFieldSearchConfig } = obj;
        this.tableAttrs = merge({}, this.tableAttrs, tableAttrs);
        if (fuzzyFieldSearchConfig && Object.keys(fuzzyFieldSearchConfig).length) {
          this.fuzzyFieldSearchConfig = fuzzyFieldSearchConfig;
        } else {
          this.fuzzyFieldSearchConfig = null;
        }
        if (keyField) {
          this.keyField = keyField;
        } else {
          this.$message("设计时主键缺失！正在重新请求获取主键");
          this.getPrimekey(true);
        }

        this.tableData = tableOptions;
        // 先获取所有的老数据
        this.setDeliveryFieldsOption(tableOptions);

        this.btnConfigArr = formOptions;
        // 更新数据库字段，如果多了新增默认，少了去除
        await this.updateFieldList();

        // 更新数据库字段后，重新设置deliveryFieldsOption
        this.setDeliveryFieldsOption(this.tableData);
        this.searchFromOptions = this.composeFromOptions(tableOptions);
      } else {
        // 新增状态
        this.queryFieldList();
        this.getPrimekey();
      }
    },

    async expose_getBtnConfigOptions() {
      return Promise.all([this.queryMetaList(), this.queryAuthorizeList()]);
    },

    expose_setBtnConfigOptions(btnConfigOptions = []) {
      const [metaList, authorizeList] = btnConfigOptions;

      this.metaListExtraOption = {
        options: metaList,
        props: {
          label: "businessName",
          key: "tableName"
        }
      };

      this._btnAuthorize = {
        options: authorizeList.concat({
          actionName: "所有人可操作",
          actionCode: "defaultShow"
        }),
        props: {
          label: "actionName",
          key: "actionCode"
        }
      };
    },

    btnsColumnDrop() {
      // 此时找到的元素是要拖拽元素的父容器
      const dom = document.querySelector(".btnDesign");
      this.Sortable.create(dom, {
        onEnd: e => {
          // e.oldIndex为拖动一行原来的位置，e.newIndex为拖动后新的位置
          const targetRow = this.btnConfigArr.splice(e.oldIndex, 1)[0];
          this.btnConfigArr.splice(e.newIndex, 0, targetRow);
          console.log(e.oldIndex, e.newIndex);
        }
      });
    },

    showTableAttrsDlg() {
      this.$refs.tableAttrsDlg.showDlg(this.tableAttrs);
    },

    changeTableAttrs(tableOptions) {
      this.tableAttrs = tableOptions;
    },

    searchAreaDrop() {
      // 此时找到的元素是要拖拽元素的父容器
      const dom = document.querySelector(".searchArea .el-form .el-row");
      this.sortableInstance = this.Sortable.create(dom, {
        handle: ".el-form-item__label",
        onEnd: e => {
          // e.oldIndex为拖动一行原来的位置，e.newIndex为拖动后新的位置
          // 排序后要先获取最新的列表，否则下面list[e.oldIndex]取不到正确的值
          const tableOptions = this.$refs.singleSetupTable.expose_getTableData();
          const list = this.composeFromOptions(tableOptions)[0].formItem;
          const { newIndex, oldIndex } = e;
          if (newIndex < oldIndex) {
            list[e.oldIndex].sortNumb = list[e.newIndex].sortNumb - 1;
          } else {
            list[e.oldIndex].sortNumb = list[e.newIndex].sortNumb + 1;
          }

          list
            .sort((a, b) => a.sortNumb - b.sortNumb)
            .map((item, index) => {
              const target = this.tableData.find(tableDataItem => item.formField === tableDataItem.fieldCode);
              item.sortNumb = target.searchWidgetConfig.sortNumb = index * 2;
            });
        }
      });
    },

    // 添加查询控件的change事件和控件属性弹窗的确认按钮触发
    searchOptionsChange() {
      const tableOptions = this.$refs.singleSetupTable.expose_getTableData();
      this.searchFromOptions = this.composeFromOptions(tableOptions);
      this.sortableInstance?.destroy();
      this.$nextTick(() => {
        this.searchAreaDrop();
      });
    },

    // 设置searchFrom和装配fromOptions
    composeFromOptions(tableData) {
      this.showSearchFromArea = false;
      this.setupForm = {};
      if (!tableData.length) return [];
      let formOptions = [];
      const length = tableData.length;
      tableData.map((item, index) => {
        const searchWidgetName = searchWidget.find(widgetitem => widgetitem.id === item.searchWidget)?.tagName;
        // 只有搜索控件有值且开启了搜索项，才会添加到options中
        if (searchWidgetName && item.isSearchWidget) {
          this.setFromField(this.searchFrom, item.fieldCode, item.searchWidgetConfig, searchWidgetName);
          const options = getWidgetOptions(searchWidgetName, item);
          // 给formitem加个key，因为只有设计区可以拖拽排序，防止渲染错乱
          options.formItemAttrs.key = Math.random();
          formOptions.push(merge(options, depthFirstSearchWithRecursive(item.searchWidgetConfig)));
        }
        // 如果循环到最后一个且存在其他筛选项，则对formOptions通过sortNumb进行排序且添加按钮到最后一个
        if (length - 1 === index && formOptions.length) {
          formOptions = formOptions.sort((a, b) => a.sortNumb - b.sortNumb);
          this.showSearchFromArea = true;
        }
      });
      return [
        {
          elRowAttrs: {
            type: "flex",
            align: "middle",
            justify: "start"
          },
          style: "flex-wrap: wrap",
          formItem: formOptions
        }
      ];
    },

    // 由数据组成searchFrom
    setFromField(source, fieldCode, formOptions, searchWidgetName) {
      this.$set(source, fieldCode, getWidgetDefaultVal(formOptions, searchWidgetName));
    },

    requestTableConfig() {
      return this.getListConfigJSON(this.groupId);
    },

    getPrimekey(tip) {
      this.requestPrimekey(this.groupId).then(res => {
        if (res.result === "0") {
          this.keyField = res.data.columnName;
          if (tip) {
            this.$success("重新获取主键成功！");
          }
        }
      });
    },

    // 将元数据包装为可渲染的tableoptions
    convertData(data) {
      return data.map((item, index) => {
        const rawData = getSingleTableData();
        if (index < 3) rawData.show = true;
        return {
          ...rawData,
          fieldCode: item.fieldName,
          fieldName: item.fieldDisplayName
        };
      });
    },

    // 更新数据库字段，如果多了新增默认，少了去除
    updateFieldList() {
      return this.requestFieldList(this.groupId).then(res => {
        const list = res.data;
        list.map(item => {
          // this.deliveryFieldsOption.options 是已经提取过的字段（已经考虑到了用户新增父级的情况）
          if (!this.deliveryFieldsOption.options.some(tableDataItem => tableDataItem.fieldCode === item.fieldName)) {
            const rawData = getSingleTableData();
            this.tableData.push({
              ...rawData,
              fieldCode: item.fieldName,
              fieldName: item.fieldDisplayName
            });
          }
        });

        this.tableData = this.tableData.filter(tableDataItem => {
          const matchesField = dataItem => {
            // 判断当前项是否匹配任一字段
            if (list.some(item => dataItem.fieldCode === item.fieldName)) return true;
            // 如果有 children，则递归判断
            if (Array.isArray(dataItem.children)) {
              return dataItem.children.some(child => matchesField(child));
            }
            return false;
          };

          // 满足三种情况：1) 自定义字段 2) 嵌套 children 匹配 3) 当前字段匹配
          return tableDataItem.isCustom || matchesField(tableDataItem);
        });
      });
    },

    // 查询元数据
    queryFieldList() {
      this.requestFieldList(this.groupId).then(res => {
        this.tableData = this.convertData(res.data);
      });
    },

    async queryFormList() {
      return this.requestFormList(this.groupId).then(res => {
        console.log(res.data, "queryFormList");
        this.formListExtraOption = {
          options: res.data,
          props: {
            label: "formName",
            key: "formId"
          }
        };
        return res.data;
      });
    },

    async queryTableList() {
      return this.requestTableList().then(res => {
        console.log(res.data, "queryTableList");
        this.tableListExtraOption = {
          props: {
            emitPath: false,
            key: "groupId",
            label: "groupName",
            children: "children"
          },
          options: res.data
        };
        return res.data;
      });
    },

    async queryMetaList() {
      if (!this.requestMetaList) {
        console.error("未配置查询业务模型的方法");
        return;
      }
      const res = await this.requestMetaList(this.groupId);
      if (!res || !res.data) {
        return;
      }

      this.metaListExtraOption = {
        options: res.data,
        props: {
          label: "businessName",
          key: "tableName"
        }
      };

      return res.data;
    },

    async queryFlowList() {
      return this.requestFlowList().then(data => {
        console.log(data, "queryFlowList");
        this.flowListExtraOption = {
          options: data,
          props: {
            label: "name",
            key: "flowKey",
            children: "flowDefinitionDtoList",
            emitPath: false
          }
        };
        return data;
      });
    },

    queryAuthorizeList() {
      return this.requestAuthorizeList().then(res => {
        this._btnAuthorize = {
          options: res.data.concat({
            actionName: "所有人可操作",
            actionCode: "defaultShow"
          }),
          props: {
            label: "actionName",
            key: "actionCode"
          }
        };
        return res.data;
      });
    },

    // 获取保存接口所需所需params
    getRenderParams() {
      const json = {
        fuzzyFieldSearchConfig: this.$refs.singleSetupTable.expose_getFuzzyFieldSearchConfig(),
        tableAttrs: this.tableAttrs,
        formOptions: this.btnConfigArr.map(option => {
          option.tagAttrs.disabled = false;
          return option;
        }),
        tableOptions: this.$refs.singleSetupTable.expose_getTableData(),
        keyField: this.keyField
      };
      return json;
    },
    // 新增或者编辑前对按钮配置的一系列前置处理
    setupBtnFromOptions() {
      // 给按钮设计器设置config
      this.$refs.setupBtnConfig.expose_setBtnConfigFromArr(this.btnConfigArr);
      // 还原form配置
      this.$refs.setupBtnConfig.expose_reductionAll();
      // 配置关联的业务模型下拉框
      this.$refs.setupBtnConfig.expose_setExtraOption(this.metaListExtraOption, "extraOption.relateMeta");
      // 配置关联的组件列表下拉框
      this.$refs.setupBtnConfig.expose_setExtraOption(
        {
          options: this.componentDicList
        },
        "extraOption.relateComponent"
      );
      // 选择提交选择数据中的相应字段
      this.$refs.setupBtnConfig.expose_setExtraOption(this.deliveryFieldsOption, "extraOption.deliverySelectListFields");
      // 配置权限下拉框
      this.$refs.setupBtnConfig.expose_setExtraOption(this._btnAuthorize, "authorize");
    },

    // 添加功能按钮处理事件
    handleBtnCommand(command) {
      this.drawer = true;
      this.$nextTick(() => {
        this.setupBtnFromOptions();
        // 获取原始按钮配置form
        const config = this.$refs.setupBtnConfig.expose_getBtnConfigFrom();
        console.log(command);
        // 根据不同的command填充不同的form信息
        switch (command) {
          case "add":
            config.extraOption.dialogTitle = config.tagAttrs.value = "新增";
            config.extraOption.btnType = "add";
            config.authorize = "A";
            break;
          case "edit":
            config.extraOption.dialogTitle = config.tagAttrs.value = "编辑";
            config.extraOption.btnType = "edit";
            config.authorize = "U";
            config.extraOption.deliverySelectList = true;
            break;
          case "check":
            config.extraOption.dialogTitle = config.tagAttrs.value = "查看";
            config.extraOption.btnType = "check";
            config.authorize = "V";
            config.extraOption.deliverySelectList = true;
            break;
          case "batchDel":
            config.tagAttrs.value = "批量删除";
            config.extraOption.btnType = "batchDel";
            config.extraOption.openType = -1;
            config.authorize = "D";

            break;
          case "download":
            config.tagAttrs.value = "导出";
            config.extraOption.btnType = "download";
            config.extraOption.openType = -1;
            config.authorize = "E";
            break;
          case "flowDocDownload":
            config.tagAttrs.value = "流程文档导出";
            config.extraOption.btnType = "flowDocDownload";
            config.extraOption.openType = -1;
            config.authorize = "E";
            break;
          case "formDownload":
            config.tagAttrs.value = "表单打印";
            config.extraOption.btnType = "formDownload";
            config.extraOption.openType = -1;
            config.authorize = "E";
            break;
          case "import":
            config.tagAttrs.value = "导入";
            config.extraOption.btnType = "import";
            config.extraOption.openType = -1;
            config.authorize = "I";
            break;
          case "importRefresh":
            config.tagAttrs.value = "导入更新";
            config.extraOption.btnType = "importRefresh";
            config.extraOption.openType = -1;
            config.authorize = "U";
            break;
          case "refresh":
            config.tagAttrs.value = "刷新";
            config.extraOption.btnType = "refresh";
            config.extraOption.openType = -1;
            config.authorize = "defaultShow";
            break;
          case "qrCode":
            config.tagAttrs.value = "生成二维码";
            config.extraOption.btnType = "qrCode";
            config.extraOption.openType = -1;
            config.authorize = "E";
            break;
          case "custom":
            config.extraOption.btnType = "custom";
            config.extraOption.openType = "";
            config.extraOption.deliverySelectList = false;
            break;
          default:
            break;
        }
        // 设置装配好的按钮form
        this.$refs.setupBtnConfig.expose_setBtnConfigFrom(config);
      });
    },

    // 按钮设计的提交事件
    onSubmit() {
      this.btnConfigArr = this.$refs.setupBtnConfig.expose_getBtnConfigFromArr();
      this.drawer = false;
    },

    onClose() {},
    handleDelBtn(index) {
      this.btnConfigArr.splice(index, 1);
    },

    // 展开当前按钮详情
    handleBtnDetail(index) {
      this.drawer = true;
      this.$nextTick(() => {
        this.setupBtnFromOptions();
        this.$refs.setupBtnConfig.expose_setBtnConfigFrom(this.btnConfigArr[index], true);
      });
    },
    async refreshList({ openType, isTip, btnType }) {
      switch (openType) {
        case -1:
          if (btnType === "qrCode") {
            await this.queryFormList();
            this.$refs.setupBtnConfig.expose_setExtraOption(this.formListExtraOption, "extraOption.targetFormId", ["contentTextFrontTagOptions"]);
            isTip && this.$success("刷新成功！");
          }
          break;
        case 0:
          await this.queryFormList();
          this.$refs.setupBtnConfig.expose_setExtraOption(this.formListExtraOption, "extraOption.relateFrom", ["contentTextFrontTagOptions"]);
          isTip && this.$success("刷新成功！");
          break;
        case 2:
          await this.queryFlowList();
          this.$refs.setupBtnConfig.expose_setExtraOption(this.flowListExtraOption, "extraOption.flowKey", ["contentTextFrontTagOptions"]);
          isTip && this.$success("刷新成功！");
          break;
        case 6:
          await this.queryTableList();
          this.$refs.setupBtnConfig.expose_setExtraOption(this.tableListExtraOption, "extraOption.relateTable", ["contentTextFrontTagOptions"]);
          isTip && this.$success("刷新成功！");
          break;
        default:
          break;
      }
    },
    setDeliveryFieldsOption(tableOptions) {
      const options = [];
      function processItem(item) {
        if (!item.isCustom && !item.children?.length) {
          options.push(item);
        } else if (item.children?.length) {
          item.children.forEach(child => processItem(child));
        }
      }
      tableOptions.forEach(item => {
        processItem(item);
      });
      this.deliveryFieldsOption.options = options;
    }
  }
};
</script>

<style lang="less" scoped>
.content {
  height: calc(100% - 30px);
  width: 100%;
  display: flex;
  flex-direction: column;
  .searchArea {
    padding-left: 20px;
  }
}

.el-dropdown {
  vertical-align: top;
}

.el-icon-arrow-down {
  font-size: 12px;
}

.title {
  font-size: 18px;
  padding-top: 16px;
}

.el-divider--horizontal {
  display: block;
  height: 1px;
  width: 100%;
  margin: 24px 0;
}

.el-divider {
  background-color: #dcdfe6;
  position: relative;
}

.btnDesign {
  // margin: -6px 56px 10px 56px;
  background: #fff;
  min-height: 43px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 10px;
  padding-left: 20px;
  .btn {
    margin-right: 10px;
    margin-bottom: 10px;
  }
}

.middle {
  position: absolute;
  right: -7px;
  top: -10px;
  font-size: 16px;
}

.top {
  display: flex;
  justify-content: space-between;
  padding: 0 30px;
  align-items: center;
  background: #fff;
  height: 60px;
}

.preview {
  padding: 20px 0 50px 0;
}

.tablesetup {
  height: 0;
  flex: 1;
}
</style>
