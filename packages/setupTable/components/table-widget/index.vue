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
        label-width=""
      ></base-render-form>
    </div>

    <div class="btnDesign">
      <div class="btns">
        <span v-for="(item, index) in btnConfigArr" :key="item.renderId" style="display:inline-block; position: relative;">
          <el-dropdown v-if="item.authorize === 'E'">
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
      </div>

      <el-dropdown szie="small" @command="handleBtnCommand">
        <el-button type="primary" size="small" plain> 添加功能按钮<i class="el-icon-arrow-down el-icon--right"></i> </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="add">新增按钮</el-dropdown-item>
          <el-dropdown-item command="edit">编辑按钮</el-dropdown-item>
          <el-dropdown-item command="check">查看按钮</el-dropdown-item>
          <el-dropdown-item command="batchDel">批量删除按钮</el-dropdown-item>
          <el-dropdown-item command="download">导出按钮</el-dropdown-item>
          <el-dropdown-item command="flowDocDownload">流程文档导出按钮</el-dropdown-item>
          <el-dropdown-item command="import">导入按钮</el-dropdown-item>
          <el-dropdown-item command="importRefresh">导入更新按钮</el-dropdown-item>
          <el-dropdown-item command="custom">自定义按钮</el-dropdown-item>
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
        edit-mode
        @searchOptionsChange="searchOptionsChange"
      >
      </single-setup-table>
    </div>

    <el-drawer title="按钮属性设置" :visible.sync="drawer" :direction="direction">
      <setupBtnConfig ref="setupBtnConfig" @onSubmit="onSubmit" @onClose="onClose"></setupBtnConfig>
    </el-drawer>

    <tableAttrsDlg ref="tableAttrsDlg" :delivery-fields-option="deliveryFieldsOption" @changeTableAttrs="changeTableAttrs"></tableAttrsDlg>
  </div>
</template>

<script>
import { getSingleTableData, getTableAttrs } from "/baseConfig/tableBaseConfig";
import setupBtnConfig from "../setupBtnConfig";
import singleSetupTable from "../singleSetupTable";
import { getWidgetOptions, getWidgetDefaultVal, depthFirstSearchWithRecursive } from "../../../../utils";
import { searchWidget } from "/baseConfig/tableSelectConfigs";
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
      }
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

  errorCaptured(err) {
    // 看着心烦，直接屏蔽，elform计算label值得时候得问题，在beforeDestroy周期里，不影响功能
    if (err.message === "[ElementForm]unpected width ") return false;
    else return true;
  },

  methods: {
    async init(id = "", formCode, jsonOptions) {
      console.log(id, "id");
      this.groupId = id;
      this.queryTableList();
      this.queryFormList();
      this.queryMetaList();
      this.queryFlowList();
      this.queryAuthorizeList();
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
          this.$refs.singleSetupTable.expose_setFuzzyFieldSearchConfig(fuzzyFieldSearchConfig);
        }
        this.keyField = keyField;
        this.tableData = tableOptions;
        this.deliveryFieldsOption = {
          options: []
        };
        tableOptions.map(item => {
          if (!item.isCustom) {
            this.deliveryFieldsOption.options.push({
              cnName: `${item.fieldName}(${item.fieldCode})`,
              id: item.fieldCode
            });
          }
        });

        this.btnConfigArr = formOptions;
        // 更新数据库字段，如果多了新增默认，少了去除
        await this.updateFieldList();
        this.searchFromOptions = this.composeFromOptions(tableOptions);
      } else {
        // 新增状态
        this.queryFieldList();
        this.getPrimekey();
      }
    },

    btnsColumnDrop() {
      // 此时找到的元素是要拖拽元素的父容器
      const dom = document.querySelector(".btnDesign .btns");
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
      this.Sortable.create(dom, {
        handle: ".el-form-item__label",
        onEnd: e => {
          // e.oldIndex为拖动一行原来的位置，e.newIndex为拖动后新的位置
          // 排序后要先获取最新的列表，否则下面list[e.oldIndex]取不到正确的值
          const list = this.composeFromOptions(this.tableData)[0].formItem;
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
            gutter: 10,
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

    getPrimekey() {
      this.requestPrimekey(this.groupId).then(res => {
        this.keyField = res.data.columnName;
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
          if (!this.tableData.some(tableDataItem => tableDataItem.fieldCode === item.fieldName)) {
            const rawData = getSingleTableData();
            this.tableData.push({
              ...rawData,
              fieldCode: item.fieldName,
              fieldName: item.fieldDisplayName
            });
          }
        });
        this.tableData = this.tableData.filter(tableDataItem => {
          return list.some(item => tableDataItem.isCustom || tableDataItem.fieldCode === item.fieldName);
        });
      });
    },

    // 查询元数据
    queryFieldList() {
      this.requestFieldList(this.groupId).then(res => {
        this.tableData = this.convertData(res.data);
      });
    },

    queryFormList() {
      this.requestFormList(this.groupId).then(res => {
        console.log(res.data, "queryFormList");
        this.formListExtraOption = {
          options: res.data,
          props: {
            label: "formName",
            key: "formId"
          }
        };
      });
    },

    queryTableList() {
      this.requestTableList().then(res => {
        this.tableListExtraOption = {
          props: {
            emitPath: false,
            key: "groupId",
            label: "groupName",
            children: "children"
          },
          options: res.data
        };
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
    },

    queryFlowList() {
      this.requestFlowList().then(data => {
        this.flowListExtraOption = {
          options: data,
          props: {
            label: "name",
            key: "flowKey",
            children: "flowDefinitionDtoList",
            emitPath: false
          }
        };
      });
    },

    queryAuthorizeList() {
      this.requestAuthorizeList().then(res => {
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

    // 添加功能按钮处理事件
    handleBtnCommand(command) {
      this.drawer = true;
      this.$nextTick(() => {
        // 给按钮设计器设置config
        this.$refs.setupBtnConfig.expose_setBtnConfigFromArr(this.btnConfigArr);
        // 还原form配置
        this.$refs.setupBtnConfig.expose_reductionAll();
        // 配置关联的设计表格下拉框
        this.$refs.setupBtnConfig.expose_setExtraOption(this.formListExtraOption, "extraOption.relateFrom");
        // 配置关联的设计列表下拉框
        this.$refs.setupBtnConfig.expose_setExtraOption(this.tableListExtraOption, "extraOption.relateTable");
        // 配置关联的业务模型下拉框
        this.$refs.setupBtnConfig.expose_setExtraOption(this.metaListExtraOption, "extraOption.relateMeta");
        // 配置关联的流程列表下拉框
        this.$refs.setupBtnConfig.expose_setExtraOption(this.flowListExtraOption, "extraOption.flowKey");
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
          case "custom":
            config.extraOption.btnType = "custom";
            config.extraOption.openType = -1;
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
      this.handleBtnCommand(this.btnConfigArr[index].extraOption.btnType);
      this.$nextTick(() => {
        this.$refs.setupBtnConfig.expose_setBtnConfigFrom(this.btnConfigArr[index]);
      });
    }
  }
};
</script>

<style lang="less" scoped>
.content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.el-dropdown {
  vertical-align: top;
}

.el-dropdown + .el-dropdown {
  margin-left: 15px;
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

.btns {
  display: flex;
  align-items: center;

  span {
    margin-right: 10px;
  }
}

.btnDesign {
  // margin: -6px 56px 10px 56px;
  background: #fff;
  height: 65px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 10px;
  padding-left: 20px;
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
