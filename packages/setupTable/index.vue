<template>
  <div class="content">
    <div class="top">
      &nbsp;
      <div class="operate">
        <el-button size="mini" @click="showTableSetting">页面属性</el-button>
        <el-button size="mini" @click="showTableAttrs">表格属性设置</el-button>
        <el-button size="mini" @click="showPreview">预览</el-button>
        <el-button size="mini" type="primary" @click="confirm">保存</el-button>
      </div>
    </div>

    <div v-if="showSearchFromArea" class="searchArea">
      <base-render-form
        ref="form"
        :generalRequest="generalRequest"
        :form-data="searchFrom"
        :inline="true"
        :form-options="searchFromOptions"
        :showFooter="false"
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
              <el-dropdown-item v-for="(elDropdownItem, index) in elDropdownOptions" :key="index">{{ elDropdownItem.label }}</el-dropdown-item>
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
          <el-dropdown-item command="import">导入按钮</el-dropdown-item>
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
        :list-page-id="listPageId"
        edit-mode
        @searchOptionsChange="searchOptionsChange"
      >
      </single-setup-table>
    </div>

    <el-drawer title="按钮属性设置" :visible.sync="drawer" :direction="direction">
      <setupBtnConfig ref="setupBtnConfig" @onSubmit="onSubmit" @onClose="onClose"></setupBtnConfig>
    </el-drawer>

    <el-dialog title="预览" :visible.sync="dialogVisiblePreview" :close-on-click-modal="false" :close-on-press-escape="false" width="90%" :before-close="handleClosePreview">
      <complete-table class="preview" ref="table" style="height:650px" :generalRequest="generalRequest"> </complete-table>
    </el-dialog>

    <el-dialog
      title="表格属性设置"
      :visible.sync="dialogVisibleTableAttrs"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      width="900px"
      :before-close="handleCloseTableAttrs"
    >
      <div style="min-width: 60px;background: #fff;padding: 10px; margin-top: 60px;margin-bottom: 60px;">
        <el-form :model="tableAttrs" :rules="rules" ref="ruleForm" label-width="130px" style="padding-bottom: 20px">
          <el-form-item label="分页" prop="showPagination">
            <el-switch v-model="tableAttrs.showPagination" />
          </el-form-item>
          <el-form-item v-show="tableAttrs.showPagination" label="分页显示条数" prop="showPagination">
            <el-select v-model="tableAttrs.paginationSize" placeholder="请选择">
              <el-option v-for="item in paginationSizeOptions" :key="item.value" :label="item.label" :value="item.value"> </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="显示序号" prop="isShowIndex">
            <el-switch v-model="tableAttrs.isShowIndex" />
          </el-form-item>
          <el-form-item label="自定义索引函数" prop="filterMethod" v-if="tableAttrs.isShowIndex">
            <el-input v-model="tableAttrs.index" type="textarea" :rows="2" placeholder="请输入function(index){ return index}格式"></el-input>
          </el-form-item>
          <el-form-item label="多选" prop="isShowCheckbox">
            <el-switch v-model="tableAttrs.isShowCheckbox" />
          </el-form-item>
          <el-form-item label="斑马线" prop="stripe">
            <el-switch v-model="tableAttrs.stripe" />
          </el-form-item>
          <el-form-item label="边框" prop="border">
            <el-switch v-model="tableAttrs.border" />
          </el-form-item>
          <el-form-item label="合计" prop="showSummary">
            <el-switch v-model="tableAttrs.showSummary" />
          </el-form-item>
          <el-form-item label="合计函数" prop="summaryMethod" v-if="tableAttrs.showSummary">
            <el-input v-model="tableAttrs.summaryMethod" type="textarea" :rows="2" placeholder="请输入格式为Function({ columns, data })"></el-input>
          </el-form-item>
          <el-form-item label="合并" prop="isMerge">
            <el-switch v-model="tableAttrs.isMerge" />
          </el-form-item>
          <el-form-item label="合并函数" prop="spanMethod" v-if="tableAttrs.isMerge">
            <el-input v-model="tableAttrs.spanMethod" type="textarea" :rows="2" placeholder="请输入格式为Function({ row, column, rowIndex, columnIndex })"></el-input>
          </el-form-item>
          <el-form-item label="树类型数据" prop="isTree">
            <el-switch v-model="tableAttrs.isTree" />
          </el-form-item>
          <el-form-item label="配置tree-props" prop="treeProps" v-if="tableAttrs.isTree">
            <el-input v-model="tableAttrs.treeProps" type="textarea" :rows="2" placeholder="请输入{children, hasChildren}格式"></el-input>
          </el-form-item>
          <el-form-item label="指定row-key" prop="filterMethod" v-if="tableAttrs.isTree">
            <el-input v-model="tableAttrs.rowKey" type="textarea" :rows="2" placeholder="请输入充当key的字段名"></el-input>
          </el-form-item>
          <el-form-item label="懒加载" prop="lazy" v-if="tableAttrs.isTree">
            <el-switch v-model="tableAttrs.lazy" />
          </el-form-item>
          <el-form-item label="load函数" prop="filterMethod" v-if="tableAttrs.isTree && tableAttrs.lazy">
            <el-input v-model="tableAttrs.load" type="textarea" :rows="2" placeholder="请输入格式为Function(row, treeNode, resolve)"></el-input>
          </el-form-item>

          <el-form-item label="组件大小" prop="size">
            <el-select v-model="tableAttrs.size" placeholder="请选择">
              <el-option v-for="item in sizeOptions" :key="item.value" :label="item.label" :value="item.value"> </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="单击列展示详情" prop="clickRowShowDetialDialog">
            <el-tooltip
              slot="label"
              class="item"
              effect="dark"
              content="开启此功能后，单击列表的某行数据会调用其查看按钮相关功能（如果有），不开启此功能，则默认为双击时触发"
              placement="top-start"
            >
              <span style="cursor: pointer;font-size: 14px">单击列展示详情</span>
            </el-tooltip>
            <el-switch v-model="tableAttrs.clickRowShowDetialDialog" />
          </el-form-item>

          <el-form-item label="自定义样式" prop="style">
            <el-input v-model="tableAttrs.style" type="textarea" :rows="2" placeholder="请输入整体样式（包括列表、搜索区域和按钮区域）"></el-input>
          </el-form-item>

          <!-- <el-form-item label="列表自定义样式" prop="elTableStyle">
            <el-tooltip slot="label" class="item" effect="dark"
              content="开启此功能后，单击列表的某行数据会调用其查看按钮相关功能（如果有），不开启此功能，则默认为双击时触发" placement="top-start">
              <span style="cursor: pointer;font-size: 14px"></span>
            </el-tooltip>
            <el-input v-model="tableAttrs.elTableStyle" type="textarea" :rows="2"
              placeholder="请输入列表样式（包括列表、搜索区域和按钮区域）"></el-input>
          </el-form-item> -->
        </el-form>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getSingleTableData, getTableAttrs } from "../../baseConfig/tableBaseConfig";
import completeTable from "../completeTable";
import setupBtnConfig from "./components/setupBtnConfig";
import singleSetupTable from "./components/singleSetupTable";
import { getWidgetOptions, getWidgetDefaultVal, depthFirstSearchWithRecursive, setColSpan } from "../../utils";
import { align, searchWidget } from "../../baseConfig/tableSelectConfigs";
import { merge } from "lodash";
export default {
  name: "setupTable",
  components: {
    completeTable,
    singleSetupTable,
    setupBtnConfig
  },
  props: {
    // 获取元数据信息
    requestFieldList: {
      type: Function,
      require: true
    },
    listPageId: String,
    // 保存
    saveListConfigJSON: {
      type: Function,
      require: true
    },
    saveSql: {
      type: Function,
      require: true
    },
    generateQuerySql: {
      type: Function,
      require: true
    },
    // 获取可关联表单
    requestFormList: {
      type: Function,
      require: true
    },
    requestTableList: {
      type: Function,
      require: true
    },
    // 获取可关联的业务模型
    requestMetaList: {
      type: Function,
      require: false,
      default: () => {}
    },
    // 获取可关联流程
    requestFlowList: {
      type: Function,
      require: true
    },
    // 按钮权限集合
    requestAuthorizeList: {
      type: Function,
      require: true
    },
    // 获取已保存数据
    getListConfigJSON: {
      type: Function,
      require: true
    },
    // 获取主键
    requestPrimekey: {
      type: Function,
      require: true
    },
    // 通用请求
    generalRequest: {
      type: Function,
      require: true
    },
    // 表格按钮权限
    checkPermission: {
      type: Function,
      require: true
    }
  },
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
      paginationSizeOptions: [
        {
          label: "10条/页",
          value: 10
        },
        {
          label: "20条/页",
          value: 20
        },
        {
          label: "50条/页",
          value: 50
        },
        {
          label: "100条/页",
          value: 100
        }
      ],
      dialogVisibleBtnConfig: false,
      dialogVisiblePreview: false,
      dialogVisibleTableAttrs: false,
      tableData: [],
      setupForm: {},
      setupFormOptions: [],
      _groupId: "",
      btnConfigArr: [],
      formList: [],
      _options: "",
      direction: "rtl",
      drawer: false,
      rules: {},
      tableAttrs: getTableAttrs(),
      // 主键
      keyField: "",
      sizeOptions: [
        {
          value: "medium",
          label: "中等"
        },
        {
          value: "small",
          label: "小"
        },
        {
          value: "mimi",
          label: "迷你"
        }
      ],
      searchFromOptions: [],
      searchFrom: {},
      showSearchFromArea: false,
      previewMode: true,
      _formListExtraOption: {},
      _tableListExtraOption: {},
      _metaListExtraOption: {},
      _flowListExtraOption: {}
    };
  },

  inject: ["componentDicList", "Sortable"],
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
    async init(id = "", formCode) {
      console.log(id, "id");
      this._groupId = id;
      this._formCode = formCode;
      this.queryTableList();
      this.queryFormList();
      this.queryMetaList();
      this.queryFlowList();
      this.queryAuthorizeList();
      const { data } = await this.requestTableConfig();
      // 编辑状态
      if (data) {
        const obj = JSON.parse(data);
        const { tableOptions, formOptions, keyField, tableAttrs, fuzzyFieldSearchConfig } = obj;
        this.tableAttrs = merge({}, this.tableAttrs, tableAttrs);
        if (fuzzyFieldSearchConfig && Object.keys(fuzzyFieldSearchConfig).length) {
          this.$refs.singleSetupTable.expose_setFuzzyFieldSearchConfig(fuzzyFieldSearchConfig);
        }
        this.keyField = keyField;
        this.tableData = tableOptions;
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
          //e.oldIndex为拖动一行原来的位置，e.newIndex为拖动后新的位置
          const targetRow = this.btnConfigArr.splice(e.oldIndex, 1)[0];
          this.btnConfigArr.splice(e.newIndex, 0, targetRow);
          console.log(e.oldIndex, e.newIndex);
        }
      });
    },

    searchAreaDrop() {
      // 此时找到的元素是要拖拽元素的父容器
      const dom = document.querySelector(".searchArea .el-form .el-row");
      this.Sortable.create(dom, {
        handle: ".el-form-item__label",
        onEnd: e => {
          //e.oldIndex为拖动一行原来的位置，e.newIndex为拖动后新的位置
          // 排序后要先获取最新的列表，否则下面list[e.oldIndex]取不到正确的值
          let list = this.composeFromOptions(this.tableData)[0].formItem;
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
      return this.getListConfigJSON(this._groupId);
    },

    getPrimekey() {
      this.requestPrimekey(this._groupId).then(res => {
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
      return this.requestFieldList(this._groupId).then(res => {
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
          return list.some(item => tableDataItem.fieldCode === item.fieldName);
        });
      });
    },

    // 查询元数据
    queryFieldList() {
      this.requestFieldList(this._groupId).then(res => {
        this.tableData = this.convertData(res.data);
      });
    },

    queryFormList() {
      this.requestFormList(this._groupId).then(res => {
        console.log(res.data, "queryFormList");
        this._formListExtraOption = {
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
        this._tableListExtraOption = {
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
      const res = await this.requestMetaList(this._groupId);
      if (!res || !res.data) {
        return;
      }

      this._metaListExtraOption = {
        options: res.data,
        props: {
          label: "businessName",
          key: "tableName"
        }
      };
    },

    queryFlowList() {
      this.requestFlowList().then(data => {
        this._flowListExtraOption = {
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

    async confirm() {
      await this.handleSubmitTableConfig();
      this.$emit("onSave");
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

    // 保存按钮事件
    handleSubmitTableConfig() {
      const renderParams = this.getRenderParams();
      const actionList = [];
      renderParams.formOptions?.map(item => {
        if (item.authorize !== "defaultShow") {
          actionList.push({
            actionCode: `${this._formCode}:${item.btnId}:${item.authorize}`,
            actionName: item.tagAttrs.value
          });
        }
      });
      return this.saveListConfigJSON(
        {
          json: JSON.stringify(renderParams),
          actionList
        },
        this._groupId
      ).then(data => {
        if (data.result === "0") {
          this.$message.success("保存成功");
        } else {
          this.$message.warning("保存失败");
        }
      });
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
        this.$refs.setupBtnConfig.expose_setExtraOption(this._formListExtraOption, "extraOption.relateFrom");
        // 配置关联的设计列表下拉框
        this.$refs.setupBtnConfig.expose_setExtraOption(this._tableListExtraOption, "extraOption.relateTable");
        // 配置关联的业务模型下拉框
        this.$refs.setupBtnConfig.expose_setExtraOption(this._metaListExtraOption, "extraOption.relateMeta");
        // 配置关联的流程列表下拉框
        this.$refs.setupBtnConfig.expose_setExtraOption(this._flowListExtraOption, "extraOption.flowKey");
        // 配置关联的组件列表下拉框
        this.$refs.setupBtnConfig.expose_setExtraOption(
          {
            options: this.componentDicList
          },
          "extraOption.relateComponent"
        );
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
          case "import":
            config.tagAttrs.value = "导入";
            config.extraOption.btnType = "import";
            config.extraOption.openType = -1;
            config.authorize = "I";
            break;
          case "custom":
            config.extraOption.btnType = "custom";
            config.extraOption.deliverySelectList = true;
            break;
          default:
            break;
        }
        // 设置装配好的按钮form
        this.$refs.setupBtnConfig.expose_setBtnConfigFrom(config);
      });
    },

    handleClosePreview() {
      this.dialogVisiblePreview = false;
    },

    handleCloseTableAttrs() {
      this.dialogVisibleTableAttrs = false;
    },

    // 预览状态下，外部组件调用此方法
    showPreview() {
      this.dialogVisiblePreview = true;
      const renderParams = this.getRenderParams();
      this.$nextTick(() => this.$refs.table.expose_preview(renderParams));
    },

    showTableAttrs() {
      this.dialogVisibleTableAttrs = true;
    },

    showTableSetting() {
      this.$emit("showTableSetting");
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
