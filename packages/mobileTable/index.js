import "./index.less";
import { merge, isEmpty, cloneDeep } from "lodash";
import { getTableAttrs, getMobileAttrs } from "../../baseConfig/tableBaseConfig";
import { CELL_REBDER_TYPE, searchWidget, MOBILE_FIELD_LAYOUT, MOBILE_LABEL_LAYOUT } from "../../baseConfig/tableSelectConfigs";
import { str2Fn, mergeStyle, getWidgetDefaultVal, parseValue, BtnConfigs, addQueryString } from "../../utils";
import { executeButton } from "../completeTable/component/executeButton";
import { convertDynaticData, disposeParams } from "../../utils/interfaceParams";
import { h as vueH } from "vue";

// JSX默认编译为对h(...)的调用。当宿主以其自身的Vue渲染本组件时，包内vue模块没有活动渲染实例，
// 组件类vnode（formatter组件、el-button等）会因createComponent读null.$options而报错（纯标签不受影响）。
// 桌面端BaseRenderTable的h是在el-table列formatter回调内执行的、自带渲染上下文；移动端没有el-table，
// 因此渲染期统一改用宿主传入的createElement（render(createElement)注入，与桌面上下文等价），包内h仅作兜底。
let hostCreateElement = null;
const h = (...args) => (hostCreateElement || vueH)(...args);

// 移动端列表：单列卡片列表 + 详情页覆盖层（第一期）；字段点击与按钮执行链（第二期）；
// 卡片选择/对外事件全集/expose_*全集（第三期）。
// 仅依赖 lowcode 现有配置协议（tableOptions/tableAttrs/mobileAttrs）与宿主 inject 能力面，
// 与桌面 complete-table 二选一挂载，传参一致。
function InstanceData() {
  return {
    // 配置
    // 布局识别：第一期仅支持"table"，其余布局（tree-table/tabs-table等）渲染"移动端暂不支持"占位；
    // 不执行生命周期、不发起列表数据请求（配置解析先于布局判断，字段含 dicCode 时仍会发起字典预取）
    pageLayout: "table",
    tableConfigJSON: [],
    // 全部显示叶子字段的归一化配置（show为真值、无children）
    allDisplayFields: [],
    tableAttrs: getTableAttrs(),
    mobileAttrs: getMobileAttrs(),
    keyField: "",
    keyFieldResolved: false,
    // 数据
    tableData: [],
    externalParams: {},
    dynamicExternalParams: {},
    previewMode: false,
    tableDisbaled: false,
    // 禁用态开关：开启后dynamicExternalParams变化会按桌面语义联动tableDisbaled（第三期禁用态细化）
    tableDisbaledStatus: false,
    // 运行状态（契约§4.1）
    currentSelectedRow: null,
    detailVisible: false,
    detailIndex: 0,
    loading: false,
    loadingMore: false,
    loadError: false,
    loadMoreError: false,
    pageNo: 1,
    pageSize: 20,
    totalCount: 0,
    requestVersion: 0,
    // 搜索参数空默认值/日期拆分字段/数值转换器（与web端composeFromOptions/setFormField同构，数据源同为tableOptions遍历）。
    // 移动端搜索字段不区分web端"列表上方/表头下方"两种摆放，统一一处处理，参数口径与web一致。
    searchForm: {},
    rawSearchForm: {},
    multiFieldSearch: "",
    searchDateRangeFields: [],
    searchFormValueParsers: [],
    // 字典缓存（按dicCode复用）
    dictCache: {},
    detailLoadingMore: false,
    // 按钮执行（第二期）：formOptions 按钮池、权限过滤后按钮列表与共享执行器上下文
    formOptions: [],
    btnList: [],
    btnConfigs: new BtnConfigs(),
    // 选择集合（第三期：isShowCheckbox开启时卡片渲染勾选框，经selectListHandler/selectionChange对外发布）
    selectList: [],
    editRow: null,
    externalParamsFormRow: null
  };
}

export default {
  name: "MobileTable",

  props: {
    listPageIdProp: String,
    rawRelateIdProp: String
  },

  data() {
    return new InstanceData();
  },

  computed: {
    listPageId() {
      return this.listPageIdProp || this.getListPageId();
    },
    rawRelateId() {
      return this.rawRelateIdProp || this.getRawRelateId();
    },
    isProjectRoute() {
      return this.$route?.matched?.some(matched => matched.path === "/project");
    },
    showPagination() {
      // 与文档语义一致：严格 === true 才分页，其余值一次性加载
      return this.tableAttrs.showPagination === true;
    },
    // 是否还有更多数据
    hasMore() {
      return this.showPagination && this.tableData.length < this.totalCount;
    },
    finished() {
      return !this.hasMore;
    },
    // 卡片标题字段：未配置或失效则不渲染标题行（不回退其他字段）
    titleField() {
      const { titleField } = this.mobileAttrs;
      const target = this.allDisplayFields.find(field => field.fieldCode === titleField);
      if (titleField && !target) {
        console.warn(`[mobileTable] titleField "${titleField}" 不是显示叶子列，标题行不展示`);
      }
      return target || null;
    },
    // 卡片字段区：mobileFields ∩ 显示叶子列；为空回退前4个显示叶子列（已用作标题的剔除）
    cardFields() {
      const { mobileFields } = this.mobileAttrs;
      const validCodes = this.allDisplayFields.map(field => field.fieldCode);
      let fields = [];
      if (Array.isArray(mobileFields) && mobileFields.length) {
        mobileFields.forEach(code => {
          const target = this.allDisplayFields.find(field => field.fieldCode === code);
          if (!target) {
            console.warn(`[mobileTable] mobileFields 中的 "${code}" 不是显示叶子列，已跳过`);
            return;
          }
          if (this.titleField && code === this.titleField.fieldCode) return;
          fields.push(target);
        });
      }
      if (!fields.length) {
        fields = this.allDisplayFields
          .filter(field => !this.titleField || field.fieldCode !== this.titleField.fieldCode)
          .slice(0, 4);
      }
      return fields;
    },
    // 详情页字段行：全部显示叶子字段
    detailFields() {
      return this.allDisplayFields;
    },
    isDoubleLayout() {
      // 非法值按默认 double 处理（契约§3 回退规则），枚举来源 tableSelectConfigs.js
      return this.mobileAttrs.fieldLayout !== MOBILE_FIELD_LAYOUT.SINGLE;
    },
    isHorizontalLabel() {
      return this.mobileAttrs.labelLayout === MOBILE_LABEL_LAYOUT.HORIZONTAL;
    },
    // 当前列表是否只能单选（与桌面 tableItem 同来源：renderStrategy.singleSelect）
    singleSelect() {
      return !!this.renderStrategy.singleSelect;
    },
    // 是否启用跨页选择（与桌面 reserve-selection 同来源：renderStrategy.crossPageSelect）
    crossPageSelect() {
      return !!this.renderStrategy.crossPageSelect;
    },
    // 是否渲染卡片勾选框（与桌面 isShowCheckbox 渲染选择列同语义）
    showCheckbox() {
      return !!this.tableAttrs.isShowCheckbox;
    }
  },

  watch: {
    // 禁用态联动（与桌面 tableItem 对 dynamicExternalParams 的 watch 同语义）：
    // tableDisbaledStatus 开启后，动态外部参数变为含多个key的有效对象则解除禁用，否则保持禁用
    dynamicExternalParams: {
      handler(val = {}) {
        try {
          if (this.tableDisbaledStatus) {
            const isValidObject = val && typeof val === "object" && !Array.isArray(val) && Object.keys(val).length > 1;
            this.tableDisbaled = !isValidObject;
          }
        } catch (error) {
          console.error("[mobileTable] dynamicExternalParams watch 执行失败：", error);
        }
      }
    }
  },

  inject: {
    requestTableData: {
      default: () => () => Promise.reject(new Error("inject缺失requestTableData!"))
    },
    requestTablePaginationData: {
      default: () => () => Promise.reject(new Error("inject缺失requestTablePaginationData!"))
    },
    requestTableConfig: {
      default: () => () => Promise.reject(new Error("inject缺失requestTableConfig!"))
    },
    generalRequest: {
      default: () => () => {
        console.warn("inject缺失generalRequest!");
      }
    },
    checkPermission: {
      default: () => () => {
        console.warn("inject缺失checkPermission!");
      }
    },
    getListPageId: {
      default: () => () => ""
    },
    getRawRelateId: {
      default: () => () => ""
    },
    getPrjInfo: {
      default: () => () => ({})
    },
    queryChangePrjId: {
      default: () => () => {
        console.warn("inject缺失queryChangePrjId!");
      }
    },
    updatePrj: {
      default: () => () => {
        console.warn("inject缺失updatePrj!");
      }
    },
    enterpriseId: {
      default: () => ""
    },
    renderStrategy: {
      default: () => ({ source: "" })
    },
    getWidgetByFreeLayout: {
      default: () => () => ({})
    },
    eventBus: {
      default: () => ({})
    }
  },

  provide() {
    return {
      // 与桌面端一致的能力面，供复杂formatter注入使用
      getTableRenderInstance: () => this.expose_CompleteTableInstance(),
      emitBtnClick: this.emitBtnClick
    };
  },

  mounted() {
    this.ensureParentPosition();
  },

  beforeDestroy() {
    this._destroyed = true;
    this.disconnectObserver();
  },

  methods: {
    expose_MobileTableInstance() {
      return this;
    },

    /** ============ 对外API（第一期最小集） ============ */

    async init(isPreview, json, options = {}, externalTriggerQueryTableData = false, tableDisbaled = false) {
      this.resetAll();
      this.previewMode = !!isPreview;
      this.tableDisbaledStatus = this.tableDisbaled = !!tableDisbaled;
      if (!json || isEmpty(json)) {
        json = await this.queryTableConfig();
      }
      this.parseTableConfig(json);
      if (this.pageLayout !== "table") {
        // 非支持的布局（tree-table/tabs-table等）：仅渲染占位，不组装参数、不执行生命周期、不发起列表数据请求
        // （parseTableConfig 已先行执行，字段含 dicCode 时字典预取已发出）
        return;
      }
      // 第三参形状与桌面端tableItem.init一致：{ externalParams, dynamicExternalParams }
      const { externalParams = {}, dynamicExternalParams = {} } = options || {};
      this.externalParams = { ...externalParams };
      this.dynamicExternalParams = dynamicExternalParams || {};

      if (this.previewMode) {
        // 预览态（契约§9）：不执行生命周期与查询，仅以本地样例数据渲染
        const sample = this.composeSampleRow();
        this.tableData = Array.from({ length: 10 }, () => ({ ...sample }));
        this.totalCount = this.tableData.length;
        return;
      }

      // onInitEvent：配置解析和运行数据组合完成后、首次查询前执行
      if (this.tableAttrs.onInitEvent) {
        try {
          str2Fn(this.tableAttrs.onInitEvent).call(this);
        } catch (error) {
          console.error("[mobileTable] onInitEvent 执行失败：", error);
        }
      }

      // 有些参数通过sessionStorage传递（与桌面端保持一致）
      let jumpParams = null;
      try {
        jumpParams = JSON.parse(sessionStorage.getItem("lowcodeTableThisPageJumpParams"));
        sessionStorage.removeItem("lowcodeTableThisPageJumpParams");
      } catch (error) {
        console.error(error);
      }
      if (jumpParams && Object.prototype.toString.call(jumpParams) === "[object Object]") {
        this.externalParams = { ...this.externalParams, ...jumpParams };
      }

      if (!externalTriggerQueryTableData) {
        this.loadFirst();
      }
    },

    async expose_preview(data) {
      // 与init路径一致先重置运行状态，避免残留的列表数据/页码/字典缓存混入预览态
      this.resetAll();
      this.previewMode = true;
      if (data && !isEmpty(data)) {
        this.parseTableConfig(data);
        if (this.pageLayout !== "table") return;
      } else {
        await this.queryTableConfig();
      }
      const sample = this.composeSampleRow();
      this.tableData = Array.from({ length: 10 }, () => ({ ...sample }));
      this.totalCount = this.tableData.length;
    },

    // data 合并持久化外部参数；dynamicData 替换动态外部参数
    async expose_refreshData(data = {}, dynamicData = {}) {
      if (data && typeof data === "object" && Object.keys(data).length > 0) {
        this.externalParams = { ...this.externalParams, ...data };
      }
      this.dynamicExternalParams = dynamicData || {};
      await this.loadFirst();
    },

    expose_getTableData() {
      return this.tableData;
    },

    expose_setTableData(data) {
      this.tableData = Array.isArray(data) ? data : [];
      this.totalCount = this.tableData.length;
      // 直接替换本地数据，与替换式查询同语义走整体替换收尾（重锚选中、详情页越界关闭）
      this.handleTableDataReplaced();
    },

    /** ============ 对外API（第三期补齐全集） ============ */

    // 外部设置搜索表单（与桌面 tableItem.expose_setSearchForm 同语义）：
    // 重置为空默认值后写入传入值，重置multiFieldSearch并回到第一页重查；搜索UI随第四期接入，参数链路本期生效
    async expose_setSearchForm(data, multiFieldSearch) {
      if (Object.prototype.toString.call(data) !== "[object Object]") {
        return console.warn("expose_setForm方法传入的参数必须是一个对象！");
      }
      this.resetSearchForm();
      this.multiFieldSearch = multiFieldSearch || "";
      Object.keys(this.searchForm).forEach(key => {
        // eslint-disable-next-line no-prototype-builtins
        if (data.hasOwnProperty(key)) {
          this.searchForm[key] = data[key];
        }
      });
      await this.loadFirst();
    },

    // 与桌面 expose_setTableDisbaled 同语义：直接设置禁用态，不动tableDisbaledStatus联动开关
    expose_setTableDisbaled(bool) {
      this.tableDisbaled = bool;
    },

    // 改变按钮状态（与桌面 expose_enableAllBtn 同语义）：启用按钮池内全部按钮
    expose_enableAllBtn() {
      this.btnList.forEach(item => {
        if (item.tagAttrs) item.tagAttrs.disabled = false;
      });
    },

    // API全集对齐（桌面同名方法返回列表实例）；expose_MobileTableInstance 为移动端既有别名
    expose_CompleteTableInstance() {
      return this;
    },

    // 按钮关联弹窗体系属第五期（移动端弹层承载），第三期先提供API占位并告警
    expose_showDialog() {
      this.fifthPhaseWarn("expose_showDialog 按钮关联弹窗");
    },

    expose_hideDialog() {
      this.fifthPhaseWarn("expose_hideDialog 按钮关联弹窗");
    },

    resetSearchForm() {
      Object.keys(this.rawSearchForm).forEach(key => {
        this.searchForm[key] = this.rawSearchForm[key];
      });
    },

    // 与桌面 tableItem.emitBtnClick 同签名：btnId 优先，否则按 tagAttrs.value（按钮名）查找；预览/禁用态不执行
    emitBtnClick(row, btnName, btnId) {
      if (this.previewMode || this.tableDisbaled) return;
      let target = null;
      if (btnId) {
        target = this.btnList.find(btn => btn.btnId === btnId);
      } else if (btnName) {
        target = this.btnList.find(btn => btn.tagAttrs?.value === btnName);
      } else {
        console.warn("[mobileTable] 调用emitBtnClick参数同时缺失按钮名称和按钮id");
        return;
      }
      if (!target) {
        this.showTip("未找到此操作关联的按钮！请检查权限！");
        return;
      }
      this.executeButton({ ...target.extraOption, btnId: target.btnId, authorize: target.authorize }, row);
    },

    /** ============ 按钮执行（第二期：共享executeButton宿主能力） ============ */

    // 权限过滤与桌面 filterBtnsByPermission 同语义（普通列表分支：rawRelateId 缺失/notVerify 或预览态不过滤）
    composeBtnList() {
      let config = cloneDeep(this.formOptions || []);
      if (!this.previewMode && this.rawRelateId && this.rawRelateId !== "notVerify") {
        config = config.filter(item => {
          return this.checkPermission(`${this.rawRelateId}:${item.btnId}:${item.authorize}`) || item.authorize === "defaultShow";
        });
      }
      this.btnList = config;
    },

    // 共享按钮执行器（逻辑来源 tableItem.js handleBtnClick，经 executeButton.js 第二期抽取）
    executeButton(btnConfig, rowData) {
      return executeButton(btnConfig, rowData, this);
    },

    // 以下为共享executeButton约定的宿主能力（语义与桌面 tableItem 对应方法一致）
    getSelectedData() {
      return this.selectList?.length ? this.selectList : this.currentSelectedRow ? [this.currentSelectedRow] : [];
    },

    checkNoSelection() {
      return this.selectList.length === 0 && !this.currentSelectedRow;
    },

    checkOnlyOneSelected() {
      return this.selectList.length === 1 || (this.selectList.length === 0 && this.currentSelectedRow);
    },

    refresh() {
      this.loadFirst();
    },

    // 选择数据转参数（与桌面 formatSelectListParams 同语义，来源 tableItem.js）
    formatSelectListParams({ deliverySelectList, deliverySelectListFields }, rowData, fieldFormatMode = "default") {
      const params = {};
      let selectList;
      if (rowData) {
        selectList = [rowData];
      } else {
        selectList = this.getSelectedData();
      }
      if (deliverySelectList) {
        if (fieldFormatMode === "useArray") {
          selectList.map(row => {
            deliverySelectListFields.map(item => {
              let key, value;
              if (typeof item === "string") {
                value = row[item];
                key = `${item}Array`;
              } else {
                value = row[item.fieldCode];
                key = item.renamed || `${item.fieldCode}Array`;
              }
              if (params[key]) {
                params[key].push(value);
              } else {
                params[key] = [value];
              }
            });
            // 主键必穿
            if (!deliverySelectListFields.some(field => field === this.keyField || field.fieldCode === this.keyField)) {
              const key = `${this.keyField}Array`;
              params[key] = selectList?.map(row => row[this.keyField]) || "";
            }
          });
        } else if (fieldFormatMode === "useJoin") {
          deliverySelectListFields.map(item => {
            let key;
            if (typeof item === "string") {
              key = `${item}`;
            } else {
              key = item.renamed || `${item.fieldCode}`;
            }
            params[key] = selectList.map(row => row[typeof item === "string" ? item : item.fieldCode]).join(",");
          });
        } else {
          rowData = rowData || this.selectList[0] || {};
          deliverySelectListFields.map(item => {
            let key, value;
            if (typeof item === "string") {
              value = rowData[item];
              key = `${item}`;
            } else {
              value = rowData[item.fieldCode];
              key = item.renamed || `${item.fieldCode}`;
            }
            params[key] = value;
          });
          // 主键必穿
          if (!deliverySelectListFields.some(field => field === this.keyField || field.fieldCode === this.keyField)) {
            params[this.keyField] = rowData[this.keyField];
          }
        }
      }
      return params;
    },

    // 组装openType=5接口请求参数（与桌面 getRequestConfig 同语义，来源 tableItem.js）
    getRequestConfig(row) {
      const {
        btnConfigs: {
          requestUrl,
          requestType,
          requestFixedParams = {},
          deliverySelectList,
          btnDisposeParamsRule: { paramType, paramName, deliverySelectListFields = [] }
        }
      } = this;
      let { finalUrl, finalType, finalData, requestHeaders: headers } = disposeParams(requestUrl, requestType, requestFixedParams);
      const baseParams = this.getParams() || {};
      finalData = convertDynaticData(finalData, baseParams, this);

      if (deliverySelectList) {
        let selectListId;
        if (row) {
          selectListId = [row[this.keyField]];
        } else {
          selectListId = this.getSelectedData().map(item => item[this.keyField]);
        }
        if (paramType === 1) {
          // paramName字段的兼容性代码
          if (paramName) {
            finalUrl = addQueryString(
              {
                [paramName]: selectListId.join(",")
              },
              finalUrl
            );
          } else if (deliverySelectListFields.length) {
            const params = this.formatSelectListParams({ deliverySelectList, deliverySelectListFields }, undefined, "useJoin");
            finalUrl = addQueryString(params, finalUrl);
          }
        } else if (paramType === 0) {
          // paramName字段的兼容性代码
          if (paramName) {
            finalData[paramName] = selectListId;
          } else if (deliverySelectListFields.length) {
            const params = this.formatSelectListParams({ deliverySelectList, deliverySelectListFields }, undefined, "useJoin");
            finalData = {
              ...finalData,
              ...params
            };
          }
        }
      }
      return {
        finalUrl,
        finalData,
        finalType,
        headers
      };
    },

    // openType=1 当前页跳转：sessionStorage传参 + 项目切换 + 路由跳转（与桌面 disposeThisPageJump 同语义）
    async disposeThisPageJump({ openUrl, deliverySelectList, deliverySelectListFields }, rowData) {
      const params = this.formatSelectListParams({ deliverySelectList, deliverySelectListFields }, rowData, "useArray");
      // 通过sessionStorage传递参数
      sessionStorage.setItem("lowcodeTableThisPageJumpParams", JSON.stringify(params));
      const res = await this.queryChangePrjId(this.listPageId, params[`${this.keyField}Array`][0]);
      if (res && res !== this?.getPrjInfo?.()?.prjId) {
        await this.updatePrj({ prjId: res });
        // prjId从外部传入需要时间更改
        setTimeout(() => {
          this.$router.push(openUrl);
        }, 100);
      } else {
        this.$router.push(openUrl);
      }
    },

    // openType=5 直接调用接口（与桌面 disposeRequestEvent 同语义；isRefresh 后回到第一页重查）
    async disposeRequestEvent({ requestBeforeConfirmHint, requestBeforeConfirmText, requestBeforeConfirmTitle, requestBeforeConfirmType }, rowData) {
      if (requestBeforeConfirmHint) {
        await this.$confirm(`${requestBeforeConfirmText}`, requestBeforeConfirmTitle || "提示", {
          type: requestBeforeConfirmType
        });
      }
      const { finalUrl, finalType, finalData, headers: requestHeaders } = this.getRequestConfig(rowData);

      await this.generalRequest(finalUrl, finalType, finalData, requestHeaders);
      this.btnConfigs.isRefresh && this.loadFirst();
    },

    // 以下分派器依赖桌面端下载/流程/表单弹窗体系（第五期按钮体系），移动端第二期仅保证执行链可达并告警
    fifthPhaseWarn(action) {
      console.warn(`[mobileTable] 按钮动作（${action}）依赖桌面端弹窗/下载/流程体系，属第五期范围，移动端暂不执行`);
    },
    disposeDown() {
      this.fifthPhaseWarn("download");
    },
    disposeFlowDocDown() {
      this.fifthPhaseWarn("flowDocDownload");
    },
    disposeFlowResultDown() {
      this.fifthPhaseWarn("flowResultDownload");
    },
    disposeFormDown() {
      this.fifthPhaseWarn("formDownload");
    },
    disposeDel() {
      this.fifthPhaseWarn("batchDel");
    },
    dealImport() {
      this.fifthPhaseWarn("import");
    },
    dealImportRefresh() {
      this.fifthPhaseWarn("importRefresh");
    },
    dealQrDownload() {
      this.fifthPhaseWarn("qrCode");
    },
    disposeRelateCompEvent() {
      this.fifthPhaseWarn("openType=4 关联组件");
    },
    disposeFlowEvent() {
      this.fifthPhaseWarn("openType=2 流程");
    },
    disposeDynamicFormEvent() {
      this.fifthPhaseWarn("openType=0 动态表单");
    },
    disposeDynamicTableEvent() {
      this.fifthPhaseWarn("openType=6 动态列表");
    },

    /** ============ 配置解析 ============ */

    resetAll() {
      const data = new InstanceData();
      Object.entries(data).forEach(([key, value]) => {
        this[key] = value;
      });
    },

    async queryTableConfig() {
      try {
        const res = await this.requestTableConfig(this.listPageId);
        if (res.result === "0") {
          return JSON.parse(res.data);
        }
        console.error(`[mobileTable] queryTableConfig message: ${res.message}`);
      } catch (error) {
        console.error(`[mobileTable] queryTableConfig error: ${error}`);
      }
      return null;
    },

    parseTableConfig(json) {
      this.pageLayout = json.pageLayout || "table";
      this.tableAttrs = merge({}, getTableAttrs(), json.tableAttrs || {});
      // 合并规则（契约§3）：旧JSON无mobileAttrs取默认值，未来新增字段自动补默认值
      this.mobileAttrs = merge({}, getMobileAttrs(), json.mobileAttrs || {});
      this.tableConfigJSON = json.tableOptions || [];
      this.formOptions = json.formOptions || [];
      this.keyField = json.keyField || "";
      // keyField缺失时输出开发告警（为第三期跨页选择打底，缺失不纳入跨页保留集合）
      if (!this.keyField) {
        console.warn("[mobileTable] 列表JSON未配置keyField，跨页选择相关能力（第三期）将不可用");
      }
      this.keyFieldResolved = false;
      this.pageSize = this.tableAttrs.paginationSize || 20;
      this.composeFields();
      this.composeSearchParams();
      this.composeBtnList();
    },

    // 组装搜索参数空默认值（与web端composeFromOptions/setFormField同构，数据源同为tableOptions遍历）。
    // 移动端搜索字段不区分web端"列表上方/表头下方"两种摆放，统一一处处理，参数口径与web一致。
    composeSearchParams() {
      const searchForm = {};
      const searchDateRangeFields = [];
      const searchFormValueParsers = [];
      (this.tableConfigJSON || []).forEach(item => {
        const searchWidgetName = searchWidget.find(widgetItem => widgetItem.id === item.searchWidget)?.tagName;
        if (!searchWidgetName || !item.isSearchWidget) return;
        const config = item.searchWidgetConfig || {};
        // searchWidgetType为1代表数值范围：拆为Start/End两个键（null），后端要求数字，提交时经parser转换
        if (config.searchWidgetType === 1) {
          searchForm[`${item.fieldCode}Start`] = null;
          searchForm[`${item.fieldCode}End`] = null;
          searchFormValueParsers.push({ searchFormField: `${item.fieldCode}Start`, targetType: "number" }, { searchFormField: `${item.fieldCode}End`, targetType: "number" });
        } else {
          searchForm[item.fieldCode] = getWidgetDefaultVal(config, searchWidgetName);
          // searchWidgetType为4代表日期范围：数组形式后端不识别，请求时拆分为Start/End
          if (config.searchWidgetType === 4) {
            searchDateRangeFields.push({ field: item.fieldCode });
          }
        }
      });
      this.searchForm = searchForm;
      // 空默认值快照（expose_setSearchForm 重置基准，与桌面 rawSearchForm 同语义）
      this.rawSearchForm = cloneDeep(searchForm);
      this.searchDateRangeFields = searchDateRangeFields;
      this.searchFormValueParsers = searchFormValueParsers;
    },

    // 组合字段：只处理show为真值的叶子字段，字段顺序与tableOptions一致
    composeFields() {
      const flat = [];
      const traverse = items => {
        (items || []).forEach(item => {
          if (item.children && item.children.length) {
            traverse(item.children);
            return;
          }
          if (Boolean(item.show) !== true) return;
          flat.push({
            fieldCode: item.fieldCode,
            fieldName: item.fieldName || item.fieldCode,
            contentTextAttrArr: item.contentTextAttrArr || [],
            cellRenderType: item.cellRenderType,
            enumDisplayConfig: item.enumDisplayConfig || null,
            formatter: item.formatter ? str2Fn(item.formatter) : null
          });
        });
      };
      traverse(this.tableConfigJSON);
      this.allDisplayFields = flat;
      // 字典字段：仅配置dicCode时运行时请求并缓存
      flat.forEach(field => {
        if (field.enumDisplayConfig?.dicCode && !field.enumDisplayConfig.dicList?.length) {
          this.ensureDicList(field.enumDisplayConfig.dicCode);
        }
      });
    },

    composeSampleRow() {
      const sample = {};
      this.allDisplayFields.forEach(field => {
        sample[field.fieldCode] = "";
      });
      return sample;
    },

    // 兼容返回数据字段名大小写差异
    getRowValue(row, fieldCode) {
      if (row == null) return "";
      if (Object.prototype.hasOwnProperty.call(row, fieldCode)) return row[fieldCode];
      const escaped = fieldCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`^${escaped}$`, "i");
      const matchedKey = Object.keys(row).find(key => regex.test(key));
      return matchedKey ? row[matchedKey] : "";
    },

    resolveKeyFieldCase(data) {
      if (!this.keyField || this.keyFieldResolved || !data?.length) return;
      const firstRow = data[0];
      if (!Object.prototype.hasOwnProperty.call(firstRow, this.keyField)) {
        const escaped = this.keyField.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`^${escaped}$`, "i");
        const matchedKey = Object.keys(firstRow).find(key => regex.test(key));
        if (matchedKey) this.keyField = matchedKey;
      }
      this.keyFieldResolved = true;
    },

    // 父容器未设置position时自动补设relative（详情页铺满父级容器的前提）
    ensureParentPosition() {
      try {
        const parent = this.$el?.parentElement;
        if (parent && window.getComputedStyle(parent).position === "static") {
          parent.style.position = "relative";
        }
      } catch (error) {
        console.warn("[mobileTable] 设置父容器position失败：", error);
      }
    },

    /** ============ 字典 ============ */

    async ensureDicList(dicCode) {
      // 预览态不请求远程字典
      if (this.previewMode) return;
      if (this.dictCache[dicCode]) return;
      this.dictCache[dicCode] = { status: "loading", list: [] };
      try {
        const res = await this.generalRequest(`/dic/content/list?dicCode=${dicCode}`, "get");
        const list = res?.data || [];
        this.dictCache[dicCode] = { status: "done", list };
        this.$forceUpdate();
      } catch (error) {
        // 请求失败时显示原始值并记录错误，不阻断列表
        console.error(`[mobileTable] 获取字典失败: ${dicCode}`, error);
        this.dictCache[dicCode] = { status: "error", list: [] };
      }
    },

    /** ============ 数据加载与并发 ============ */

    // 查询参数与web端getParams同构（键与合并顺序一致）；searchForm经expose_setSearchForm写入，搜索UI随第四期接入
    getParams(data = {}) {
      const extraParams = {};
      // 日期范围拆分：数组形式后端不识别，拆为fieldStart/fieldEnd（值为空数组时不触发，与web一致）
      this.searchDateRangeFields.forEach(({ field }) => {
        const value = this.searchForm[field];
        if (value?.length === 2) {
          extraParams[`${field}Start`] = value[0] || "";
          extraParams[`${field}End`] = value[1] || "";
        }
      });
      // 数值范围类型转换（后端要求数字类型）
      this.searchFormValueParsers.forEach(item => {
        extraParams[item.searchFormField] = parseValue(this.searchForm[item.searchFormField], item.targetType);
      });
      return {
        prjId: this.getPrjInfo?.()?.prjId,
        ...data,
        ...this.searchForm,
        ...extraParams,
        multiFieldSearch: this.multiFieldSearch,
        enterpriseId: this.enterpriseId,
        // web端getParams恒携带高级筛选键（默认[]/"and"），保持请求体同构
        advSearchExpr: [],
        advSearchExprJoinOp: "and",
        ...this.externalParams,
        ...this.dynamicExternalParams
      };
    },

    // 组装最终查询参数并执行请求；返回null表示被生命周期取消
    async requestPageData() {
      const params = this.getParams();
      if (!this.isProjectRoute) {
        delete params.prjId;
      }
      const { onBeforeQueryDataEvent, onAfterQueryDataEvent } = this.tableAttrs;
      if (onBeforeQueryDataEvent) {
        try {
          const isContinue = str2Fn(onBeforeQueryDataEvent).call(this, params);
          if (isContinue === false) return null;
        } catch (error) {
          console.error("[mobileTable] onBeforeQueryDataEvent 执行失败：", error);
        }
      }
      // page形状与web端this.page一致（pageNo/pageSize/totalCount）
      const page = { pageNo: this.pageNo, pageSize: this.pageSize, totalCount: this.totalCount };
      const request = this.showPagination ? this.requestTablePaginationData(params, page, this.listPageId) : this.requestTableData(params, this.listPageId);
      const res = await request;
      if (res?.result !== "0") {
        throw new Error(res?.message || "请求失败");
      }
      if (onAfterQueryDataEvent) {
        try {
          str2Fn(onAfterQueryDataEvent).call(this, params, res.data);
        } catch (error) {
          console.error("[mobileTable] onAfterQueryDataEvent 执行失败：", error);
        }
      }
      return { data: res.data || [], totalCount: this.showPagination ? res.totalCount ?? 0 : (res.data || []).length };
    },

    // 整体替换 tableData 后的统一收尾（loadFirst 替换式查询与 expose_setTableData 共用）：
    // keyField 大小写归一；当前行按 keyField 重锚（记录仍在新数据中则保留选中并换为新对象，否则置 null）；
    // 选择集合在跨页选择开启时按 keyField 重锚（保留仍存在的记录并换为新对象，无主键的记录不纳入跨页保留集合并告警），
    // 未开启跨页选择时清空（对齐桌面 reserve-selection=false 数据替换即清空的行为）；
    // 详情页当前下标越界即关闭（否则覆盖层消失后，数据再增长时会凭空复活）
    handleTableDataReplaced() {
      this.resolveKeyFieldCase(this.tableData);
      if (this.keyField) {
        const reAnchorRow = row => {
          if (!row) return null;
          const id = row[this.keyField];
          if (id === undefined || id === null || id === "") return null;
          return this.tableData.find(item => item[this.keyField] === id) || null;
        };
        this.currentSelectedRow = reAnchorRow(this.currentSelectedRow);
        if (this.crossPageSelect) {
          const kept = [];
          this.selectList.forEach(row => {
            const anchored = reAnchorRow(row);
            if (anchored) {
              kept.push(anchored);
            } else if ([undefined, null, ""].includes(row?.[this.keyField])) {
              console.warn("[mobileTable] 跨页选择：所选记录缺少主键值，不纳入跨页保留集合");
            }
          });
          this.selectList = kept;
        } else {
          this.selectList = [];
        }
      } else {
        if (this.crossPageSelect) {
          console.warn("[mobileTable] 已开启跨页选择但列表JSON未配置keyField，选择集合不保留");
        }
        this.currentSelectedRow = null;
        this.selectList = [];
      }
      if (this.detailVisible && this.detailIndex >= this.tableData.length) {
        this.detailVisible = false;
      }
    },

    // 首查/刷新/外部参数变更：成功替换列表、回到第一页并按 keyField 重锚选中；失败保留旧数据、页码按已加载数据反推
    async loadFirst() {
      this.requestVersion++;
      const version = this.requestVersion;
      this.pageNo = 1;
      this.loading = true;
      this.loadError = false;
      // 替换式查询启动后，加载更多的页脚错误态归新查询所有
      this.loadMoreError = false;
      try {
        const result = await this.requestPageData();
        // 旧响应不得回写列表、总数或状态；销毁后禁止异步回写
        if (this._destroyed || version !== this.requestVersion || !result) return;
        this.tableData = result.data;
        this.totalCount = result.totalCount;
        this.handleTableDataReplaced();
      } catch (error) {
        if (!this._destroyed && version === this.requestVersion) {
          console.error(`[mobileTable] 加载失败：${error}`);
          this.loadError = true;
          // 页码按保留数据反推而非快照恢复：并发刷新下快照值可能是其他请求的临时页码
          this.pageNo = Math.max(1, Math.ceil(this.tableData.length / this.pageSize));
          if (this.tableData.length) this.showTip("刷新失败，请重试");
        }
      } finally {
        if (!this._destroyed && version === this.requestVersion) {
          this.loading = false;
        }
      }
    },

    // 加载更多：递增页码并追加列表；同一时间只允许一个加载更多请求
    async loadMore() {
      if (this._destroyed || this.loading || this.loadingMore || this.finished) return false;
      this.loadingMore = true;
      this.loadMoreError = false;
      const prevPage = this.pageNo;
      const nextPage = this.pageNo + 1;
      const version = this.requestVersion;
      try {
        this.pageNo = nextPage;
        const result = await this.requestPageData();
        if (this._destroyed) return false;
        // 被新的首查/刷新抢占：页码归新查询所有（loadFirst 成功置1、失败按数据反推），旧响应不回写任何状态
        if (version !== this.requestVersion) return false;
        // 生命周期取消（onBeforeQueryDataEvent返回false）：请求未发出、无抢占窗口，撤销本次乐观递增
        if (!result) {
          this.pageNo = prevPage;
          return false;
        }
        this.tableData = this.tableData.concat(result.data);
        this.totalCount = result.totalCount || this.totalCount;
        this.resolveKeyFieldCase(this.tableData);
        return true;
      } catch (error) {
        // 失败时恢复页码、保留已有卡片、允许重试；过期失败响应（已被新首查抢占）不回写任何状态
        if (!this._destroyed && version === this.requestVersion) {
          this.pageNo = prevPage;
          this.loadMoreError = true;
        }
        console.error(`[mobileTable] 加载更多失败：${error}`);
        return false;
      } finally {
        if (!this._destroyed) this.loadingMore = false;
      }
    },

    handleRetry() {
      if (this.tableData.length) {
        this.loadMoreError = false;
        this.loadMore();
      } else {
        this.loadError = false;
        this.loadFirst();
      }
    },

    /** ============ 触底加载 ============ */

    setupObserver() {
      this.disconnectObserver();
      const sentinel = this.$refs.sentinel;
      if (!sentinel || typeof IntersectionObserver === "undefined") return;
      this._observer = new IntersectionObserver(
        entries => {
          if (entries[0]?.isIntersecting && !this.loading && !this.loadingMore && !this.finished && !this.previewMode) {
            this.loadMore();
          }
        },
        { root: this.$refs.scrollWrap, rootMargin: "100px" }
      );
      this._observer.observe(sentinel);
    },

    disconnectObserver() {
      this._observer?.disconnect?.();
      this._observer = null;
    },

    /** ============ 卡片点击与详情页 ============ */

    handleCardClick(row, index) {
      const prevRow = this.currentSelectedRow;
      this.currentSelectedRow = row;
      this.detailIndex = index;
      this.detailVisible = true;
      // 预览态和禁用态不发布业务事件（含FreeLayout事件，与桌面 handleRowClickWrap/updateSelectedRowWrap 的拦截一致）
      if (!this.previewMode && !this.tableDisbaled) {
        this.$emit("rowClick", row);
        this.eventBus?.$emit?.(`${this.getWidgetByFreeLayout()?.id}.rowClick`, row);
        // 桌面 current-change 由高亮行变化触发；移动端卡片点击即当前行变化，仅在实际变化时发布
        if (prevRow !== row) {
          this.eventBus?.$emit?.(`${this.getWidgetByFreeLayout()?.id}.currentChange`, row);
        }
      }
    },

    /** ============ 选择（第三期） ============ */

    // 记录同一性：优先 keyField（兼容已归一的大小写），缺失时退化为对象身份
    sameRecord(a, b) {
      if (a === b) return true;
      if (!a || !b) return false;
      if (this.keyField) {
        const idA = a[this.keyField];
        const idB = b[this.keyField];
        if (idA !== undefined && idA !== null && idA !== "" && idA === idB) return true;
      }
      return false;
    },

    // 卡片勾选态：按 keyField 匹配（追加数据中的同主键记录同样显示已选）
    isRowSelected(row) {
      return this.selectList.some(item => this.sameRecord(item, row));
    },

    // 卡片勾选框点击：单选只保留最后选择项；多选按主键去重增删；阻止冒泡不打开详情页
    handleCardCheck(row, checked) {
      if (this.previewMode || this.tableDisbaled) return;
      if (this.singleSelect) {
        this.selectList = checked ? [row] : [];
      } else if (checked) {
        if (!this.isRowSelected(row)) this.selectList.push(row);
      } else {
        this.selectList = this.selectList.filter(item => !this.sameRecord(item, row));
      }
      this.emitSelectionChange([...this.selectList]);
    },

    // 选择变化对外发布：父组件 selectListHandler + FreeLayout selectionChange（与桌面 selectListHandler 同链路）
    emitSelectionChange(val) {
      this.$emit("selectListHandler", val);
      this.eventBus?.$emit?.(`${this.getWidgetByFreeLayout()?.id}.selectionChange`, val);
    },

    handleCloseDetail() {
      this.detailVisible = false;
    },

    showTip(message) {
      (this.$message?.warning || console.warn).call?.(this.$message || console, message);
    },

    async handleDetailPrev() {
      if (this.detailIndex <= 0) {
        this.showTip("已经是第一条了");
        return;
      }
      this.detailIndex--;
    },

    async handleDetailNext() {
      if (this.detailIndex >= this.tableData.length - 1) {
        // 到达已加载末条且还有更多数据时，自动触发加载更多
        if (this.hasMore && !this.previewMode) {
          if (this.detailLoadingMore) return;
          this.detailLoadingMore = true;
          try {
            const success = await this.loadMore();
            if (success) {
              this.detailIndex++;
            } else {
              this.showTip("加载失败，请重试");
            }
          } finally {
            this.detailLoadingMore = false;
          }
        } else {
          this.showTip("已经是最后一条了");
        }
        return;
      }
      this.detailIndex++;
    },

    /** ============ 字段渲染 ============ */

    /*
     * 格式化渲染，卡片字段区/标题行/详情页共用。
     * 优先级固定：formatter > contentTextAttrArr > PERSON > DICT > 原始值（契约§6）
     * 移动端字段渲染上下文：renderMobileField({ row, column, index, mode, mobileMode: true })
     */
    renderMobileField(field, row, index, mode = "card") {
      const ctx = { row, column: field, index, mode, mobileMode: true };
      const cellValue = this.getRowValue(row, field.fieldCode);

      // 1. 复杂自定义formatter（返回组件定义，移植桌面Vue.extend + Vue.compile机制）
      if (field.formatter) {
        try {
          const def = field.formatter.call(this, ctx);
          if (def && def.template) {
            return this.renderFormatterComponent(field, def, row, index);
          }
          if (def !== undefined && def !== null && typeof def !== "object") {
            return <span>{def}</span>;
          }
        } catch (error) {
          // 无法渲染时回退该字段后续链路，不得导致整卡/整列表渲染失败
          console.warn(`[mobileTable] 字段 "${field.fieldCode}" 的formatter执行失败，回退后续渲染链路：`, error);
        }
      }

      // 2. contentTextAttrArr（条件片段、文本、样式、图标）
      if (field.contentTextAttrArr?.length) {
        return <div class="mt-ctn-wrap">{this.renderContentTextAttrArr(field, row, cellValue)}</div>;
      }

      // 3. 人员：首字母头像 + 名称（与桌面端一致，字符串即命中，含空串）
      if (field.cellRenderType === CELL_REBDER_TYPE.PERSON && typeof cellValue === "string") {
        return (
          <div class="mt-user-tag">
            <span class="mt-user-tag-av">{cellValue.at(0)}</span>
            {cellValue}
          </div>
        );
      }

      // 4. 字典：dicList匹配；仅dicCode时使用运行时缓存
      if (field.cellRenderType === CELL_REBDER_TYPE.DICT && field.enumDisplayConfig && cellValue !== undefined && cellValue !== null && cellValue !== "") {
        let dicList = field.enumDisplayConfig.dicList;
        if (!dicList?.length && field.enumDisplayConfig.dicCode) {
          dicList = this.dictCache[field.enumDisplayConfig.dicCode]?.list || [];
        }
        if (dicList?.length) {
          const target = dicList.find(item => item.dicId === `${cellValue}`);
          const label = target?.cnName || cellValue;
          let bcgColor, color;
          try {
            if (target?.contentStyle) {
              const contentStyle = JSON.parse(target.contentStyle);
              bcgColor = contentStyle?.backgroundColor;
              color = contentStyle?.color;
            }
          } catch (error) {
            console.warn("[mobileTable] 解析contentStyle失败", error);
          }
          // 与桌面端BaseRenderTable一致的胶囊样式：仅backgroundColor时渲染胶囊，color单独存在时按桌面语义丢弃
          const baseStyle = `display: inline-block; padding: 2px 6px; border-radius: 6px; color: #fff; font-size: 12px; font-weight: 600; ${bcgColor ? "backgroundColor:" + bcgColor : ""};${color ? "color:" + color : ""}`;
          return bcgColor ? <div style={baseStyle}> {label}</div> : <span>{label}</span>;
        }
        return <span>{cellValue}</span>;
      }

      // 5. 原始值
      return <span>{cellValue === undefined || cellValue === null ? "" : `${cellValue}`}</span>;
    },

    renderFormatterComponent(field, def, row, index) {
      try {
        if (!field._mobileComponent) {
          const { components = {}, inject = ["getTableRenderInstance", "emitBtnClick"], data, computed = {}, watch = {}, methods = {}, template = "" } = def;
          field._mobileComponent = Vue.extend({
            components,
            inject,
            props: { row: Object, index: Number },
            // eslint-disable-next-line
            data:
              data ||
              function() {
                return {};
              },
            computed,
            watch,
            methods,
            render: Vue.compile(template).render
          });
        }
        return h(field._mobileComponent, { props: { row, index } });
      } catch (error) {
        console.warn(`[mobileTable] 字段 "${field.fieldCode}" 的formatter组件编译失败，回退后续渲染链路：`, error);
        field._mobileComponent = null;
        field.formatter = null;
        return this.renderMobileField({ ...field, formatter: null }, row, index);
      }
    },

    renderContentTextAttrArr(field, row, cellValue) {
      // conditionalJudgment以列表实例为this执行；异常时隐藏当前片段并输出警告
      return field.contentTextAttrArr
        .filter(item => {
          if (item.conditionalJudgment) {
            try {
              return str2Fn(item.conditionalJudgment).call(this, row);
            } catch (error) {
              console.warn(`[mobileTable] contentTextAttr中的conditionalJudgment函数错误：${error}`);
              return false;
            }
          }
          return true;
        })
        .map((contentTextAttr, idx) => {
          const style = mergeStyle(null, contentTextAttr);
          // textVal占位符解析与桌面端BaseRenderTable（提交6475ec0）逐字一致：{}取当前单元格的值，{fieldName}取row[key]
          const contentText = contentTextAttr.textVal
            ? contentTextAttr.textVal.replace(/\{([^{}]*)\}/g, (match, name) => {
                const key = name.trim();
                if (key === "") {
                  return cellValue ?? "";
                }
                return row[key] ?? "";
              })
            : cellValue;
          // 与桌面端cellRender同构：flex包裹 + 前后span（图标经class渲染）+ 文本span（桌面同款截断样式链）
          const cellStyle = `${style};flex: 1; overflow: hidden;white-space: nowrap; text-overflow: ellipsis;${contentTextAttr.textStyle}`;
          let frontTextClass = "",
            frontTextStyle = "",
            behindTextClass = "",
            behindTextStyle = "";
          if (contentTextAttr.iconName) {
            if (contentTextAttr.iconPosition === "behind") {
              behindTextClass = contentTextAttr.iconName;
              behindTextStyle = `${style};${contentTextAttr.iconStyle}`;
            } else {
              frontTextClass = contentTextAttr.iconName;
              frontTextStyle = `${style};${contentTextAttr.iconStyle}`;
            }
          }
          // 字段片段点击（第二期接入）：配置了关联按钮才可点击，优先于卡片点击并阻止冒泡（与桌面 clickBtn 语义一致）
          const relateBtnId = contentTextAttr.clickEvent?.relateBtnId;
          const onSegmentClick = relateBtnId
            ? e => {
                e.stopPropagation();
                this.emitBtnClick(row, null, relateBtnId);
              }
            : null;
          return (
            <div key={idx} style="display: flex;align-items: center;" onClick={onSegmentClick}>
              <span class={frontTextClass} style={frontTextStyle}></span>
              <span style={cellStyle}>{contentText}</span>
              <span class={behindTextClass} style={behindTextStyle}></span>
            </div>
          );
        });
    },

    /** ============ 渲染 ============ */

    renderCardField(field, row, index) {
      return (
        <div class={{ "mt-field": true, "mt-field-h": this.isHorizontalLabel }} key={field.fieldCode}>
          <div class="mt-field-label">{field.fieldName}</div>
          {/* 移动端不消费列align（web表格单元格语义），两种label布局值都固定居左 */}
          <div class="mt-field-value">
            {this.renderMobileField(field, row, index, "card")}
          </div>
        </div>
      );
    },

    renderCard(row, index) {
      const titleField = this.titleField;
      return (
        <div class="mt-card" key={index} onClick={() => this.handleCardClick(row, index)}>
          {this.showCheckbox ? (
            // 勾选框阻止冒泡：勾选不触发卡片点击打开详情页；预览态/禁用态置灰不可交互
            <div class="mt-card-check" onClick={e => e.stopPropagation()}>
              <el-checkbox
                value={this.isRowSelected(row)}
                disabled={this.previewMode || this.tableDisbaled}
                on-input={checked => this.handleCardCheck(row, checked)}
              />
            </div>
          ) : null}
          <div class="mt-card-main">
            {titleField ? <div class="mt-card-title">{this.renderMobileField(titleField, row, index, "card")}</div> : null}
            <div class={{ "mt-card-grid": true, "mt-grid-double": this.isDoubleLayout }}>{this.cardFields.map(field => this.renderCardField(field, row, index))}</div>
          </div>
        </div>
      );
    },

    renderListFooter() {
      if (this.loading) return null;
      if (this.loadMoreError) {
        return (
          <div class="mt-footer">
            <span class="mt-footer-error">加载失败</span>
            <el-button size="mini" type="primary" plain onClick={this.handleRetry}>
              重试
            </el-button>
          </div>
        );
      }
      if (this.finished) {
        return this.tableData.length ? <div class="mt-finished">没有更多了</div> : null;
      }
      return (
        <div class="mt-footer">
          <el-button size="small" type="primary" plain loading={this.loadingMore} onClick={() => this.loadMore()}>
            加载更多
          </el-button>
          {/* 触底哨兵 */}
          <div ref="sentinel" style="height: 1px;" />
        </div>
      );
    },

    renderDetail() {
      const { detailVisible, detailIndex, tableData } = this;
      if (!detailVisible) return null;
      const row = tableData[detailIndex];
      if (!row) return null;
      const titleField = this.titleField;
      return (
        <div class="mt-detail">
          <div class="mt-detail-nav">
            <span class="mt-detail-back" onClick={this.handleCloseDetail}>
              <i class="el-icon-arrow-left"></i> 返回
            </span>
            <span class="mt-detail-nav-title">详情</span>
          </div>
          <div class="mt-detail-body">
            {titleField ? <div class="mt-detail-title">{this.renderMobileField(titleField, row, detailIndex, "detail")}</div> : null}
            <div class="mt-detail-fields">
              {this.detailFields.map(field => (
                <div class="mt-detail-row" key={field.fieldCode}>
                  <span class="mt-detail-label">{field.fieldName}</span>
                  <span class="mt-detail-value">{this.renderMobileField(field, row, detailIndex, "detail")}</span>
                </div>
              ))}
            </div>
          </div>
          <div class="mt-detail-pager">
            <el-button size="small" disabled={detailIndex <= 0} onClick={this.handleDetailPrev}>
              上一条
            </el-button>
            <span class="mt-detail-count">
              {detailIndex + 1}/{this.totalCount}
            </span>
            <el-button size="small" loading={this.detailLoadingMore} onClick={this.handleDetailNext}>
              下一条
            </el-button>
          </div>
        </div>
      );
    },

    renderState() {
      if (this.loading && !this.tableData.length) {
        return <div class="mt-state">加载中...</div>;
      }
      if (this.loadError && !this.tableData.length) {
        return (
          <div class="mt-state">
            <div>加载失败</div>
            <el-button size="small" type="primary" plain style="margin-top: 10px;" onClick={() => this.loadFirst()}>
              重试
            </el-button>
          </div>
        );
      }
      if (!this.tableData.length) {
        return <div class="mt-state">暂无数据</div>;
      }
      return null;
    }
  },

  updated() {
    if (this.detailVisible || this.tableData.length) {
      this.setupObserver();
    }
  },

  render(createElement) {
    // 捕获宿主传入的createElement供模块级h包装使用（render为同步调用，时序安全）
    hostCreateElement = createElement;
    if (this.pageLayout !== "table") {
      return (
        <div class="mobileTableWrap">
          <div class="mt-state">移动端暂不支持</div>
        </div>
      );
    }
    return (
      <div class="mobileTableWrap">
        <div class="mt-scroll" ref="scrollWrap">
          {this.renderState()}
          {this.tableData.map((row, index) => this.renderCard(row, index))}
          {this.renderListFooter()}
        </div>
        {this.renderDetail()}
      </div>
    );
  }
};
