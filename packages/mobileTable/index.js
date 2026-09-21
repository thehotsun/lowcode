import "./index.less";
import { merge, isEmpty, cloneDeep } from "lodash";
import { getTableAttrs, getMobileAttrs } from "../../baseConfig/tableBaseConfig";
import { CELL_REBDER_TYPE, searchWidget, MOBILE_FIELD_LAYOUT, MOBILE_LABEL_LAYOUT } from "../../baseConfig/tableSelectConfigs";
import { str2Fn, str2obj, isValid, limitShowWord, getWidgetOptions, depthFirstSearchWithRecursive, mergeStyle, getWidgetDefaultVal, parseValue, BtnConfigs, addQueryString } from "../../utils";
import { executeButton } from "../completeTable/component/executeButton";
import { convertDynaticData, disposeParams } from "../../utils/interfaceParams";
import { h as vueH } from "vue";

// JSX默认编译为对h(...)的调用。当宿主以其自身的Vue渲染本组件时，包内vue模块没有活动渲染实例，
// 组件类vnode（formatter组件、el-button等）会因createComponent读null.$options而报错（纯标签不受影响）。
// 桌面端BaseRenderTable的h是在el-table列formatter回调内执行的、自带渲染上下文；移动端没有el-table，
// 因此渲染期统一改用宿主传入的createElement（render(createElement)注入，与桌面上下文等价），包内h仅作兜底。
let hostCreateElement = null;
const h = (...args) => (hostCreateElement || vueH)(...args);

// 排序/全部筛选下拉弹层状态key（activeFilterKey 取值）
const FILTER_SORT_KEY = "__sort__";
const FILTER_SHEET_KEY = "__filter__";
// 筛选弹层选项分组超过该数量折叠，由组标题"展开/收起"控制
const FILTER_OPTION_COLLAPSE_COUNT = 8;
// 暂不实施按钮族（渲染方案§4.2/五期方案4.8：下载/导入/二维码族与openType=4关联组件）不渲染入口，
// 执行链（emitBtnClick）仍可达、触发时告警；不渲染入口的按钮同样不进入投放推导计算
const UNPLACED_BTN_TYPES = ["download", "flowDocDownload", "flowResultDownload", "formDownload", "import", "importRefresh", "qrCode"];
// 卡片操作区常用按钮直出上限，其余收"···"半屏面板（五期方案4.5）
const CARD_ACTION_INLINE_COUNT = 3;
// isRefresh 返回回刷标记（第七期，4.6）：流程等路由跳转离开列表前写入 sessionStorage（与
// lowcodeTableThisPageJumpParams 传参风格一致），返回列表路由时消费并 loadFirst 重查
const PENDING_REFRESH_KEY = "lowcodeTablePendingRefresh";
// 流程 H5 摘要页路由（移动端流程统一入口，2026-09-20 确认：宿主 CommonDPh5 路由仅注册 /flowH5Summary
// （iframeH5Flow.vue），桌面 stdNew 的 /examine-new 仅 PC 端注册、移动端不走；
// 页面 query 契约：approveType=add|edit|view|draft|again，edit/view 必填 flowInstanceId，消费 isProject/enterpriseId）
const FLOW_H5_SUMMARY_PATH = "/flowH5Summary";
// 第八期表单/列表专用路由页（4.4）：query 驱动的静态路由（宿主注册，仿 commonRender/index.vue 公共入口），
// renderType=pageList|form 分流渲染宿主既有组件；业务参数（externalParams）经 sessionStorage 传递
// （query 只带轻量标识避免 URL 超长，传参风格与 lowcodeTableThisPageJumpParams 一致），
// 路由页挂载时读取并删除；isRefresh 回查标记复用第七期 PENDING_REFRESH_KEY 契约
const LOWCODE_MODAL_PATH = "/lowcodeModal";
const LOWCODE_MODAL_PARAMS_KEY = "lowcodeTableModalPageParams";

// 移动端列表：单列卡片列表 + 详情页覆盖层（第一期）；字段点击与按钮执行链（第二期）；
// 卡片选择/对外事件全集/expose_*全集（第三期）；顶部筛选与排序工具条（第四期）；
// 按钮入口与体系骨架（第六期）；流程跳转/isRefresh 返回回刷/批量删除闭环（第七期）；
// 表单/列表专用路由页跳转（第八期）。
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
    // 顶部筛选与排序（第四期）：模糊搜索配置、下拉弹层状态（""=关闭，排序/全部筛选同屏互斥）、排序选中镜像、
    // 远程选项缓存（fieldCode -> {status, raw}）、选项分组"展开/收起"状态、筛选弹层草稿表单（确认制）
    fuzzyFieldSearchConfig: { placeholder: "", searchFieldList: [] },
    activeFilterKey: "",
    sortState: { field: "", order: "" },
    filterOptionCache: {},
    panelExpandedMap: {},
    filterDraft: {},
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
    externalParamsFormRow: null,
    // 按钮入口（第六期）：底部半屏面板（null=关闭；FAB多add聚合面板/卡片行级"···"更多面板共用形态）
    activeActionSheet: null
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
    },
    // 模糊搜索框渲染条件（与桌面 renderOperateArea 的 searchFieldList.length 判断一致）
    fuzzySearchEnabled() {
      return Array.isArray(this.fuzzyFieldSearchConfig.searchFieldList) && this.fuzzyFieldSearchConfig.searchFieldList.length > 0;
    },
    // 顶部筛选入口（第四期）：搜索控件（含 below-header，移动端不区分摆放）∪ 列 filters/filtersConfig 表头筛选，
    // 同一字段两种来源合并为一个入口；按 searchWidgetConfig.sortNumb 升序稳定排序（与桌面 formOptions 排序一致）。
    // 与桌面搜索区一致，不按列显隐（show）过滤
    filterEntries() {
      const entries = [];
      const entryMap = {};
      const traverse = items => {
        (items || []).forEach(item => {
          if (item.children && item.children.length) {
            traverse(item.children);
            return;
          }
          const widgetName = searchWidget.find(widgetItem => widgetItem.id === item.searchWidget)?.tagName;
          const hasWidget = Boolean(widgetName && item.isSearchWidget);
          const filtersConfig = item.filtersConfig || {};
          const hasColumnFilters = Boolean(item.filters || filtersConfig.customHandler || filtersConfig.isFilter);
          if (!hasWidget && !hasColumnFilters) return;
          let entry = entryMap[item.fieldCode];
          if (!entry) {
            entry = entryMap[item.fieldCode] = {
              key: item.fieldCode,
              fieldCode: item.fieldCode,
              fieldName: item.fieldName || item.fieldCode,
              columnItem: item,
              widgetType: null,
              config: null,
              sortNumb: 0
            };
            entries.push(entry);
          }
          if (hasWidget) {
            entry.config = this.normalizeSearchWidgetConfig(item, widgetName);
            entry.widgetType = entry.config.searchWidgetType;
            entry.sortNumb = entry.config.sortNumb || 0;
            // 入口标签优先取搜索控件配置的标签名（桌面搜索区同来源），未配置回退列名
            const label = entry.config.formItemAttrs?.label;
            if (label) entry.fieldName = label;
          }
        });
      };
      traverse(this.tableConfigJSON);
      return entries.sort((a, b) => a.sortNumb - b.sortNumb);
    },
    // 排序面板字段：show 叶子列中 sort 为真值（桌面 939194c 后全列走后端 sqlConfig 排序）
    sortableFields() {
      return this.allDisplayFields.filter(field => field.sort);
    },
    // 工具条渲染条件：模糊框、任一筛选入口、任一可排序字段均无则不渲染
    showFilterBar() {
      return this.fuzzySearchEnabled || this.filterEntries.length > 0 || this.sortableFields.length > 0;
    },
    // 当前是否作为FreeLayout的一个组件（与桌面 tableItem.isFreeLayoutWidget 同来源）
    isFreeLayoutWidget() {
      return this.renderStrategy.source === "freeLayoutWidget";
    },
    // 当前是否作为Vform的一个组件（与桌面 tableItem.isVformWidget 同来源；移动端无 vform 从表宿主场景，
    // 恒为 false，仅为 getExternalCompBaseAttrs 输出与桌面完全一致而移植）
    isVformWidget() {
      return this.renderStrategy.source === "vformWidget";
    },
    // 使用动态表单是否要使用网络请求处理提交数据（与桌面 tableItem.localProcessData 同来源；
    // 移动端无 getWidget 从表宿主，恒为 false，同上仅为 attrs 输出一致而移植）
    localProcessData() {
      return this.getWidget?.()?.options?.renderMode === 0 || (this.getWidget?.()?.options?.renderMode === 1 && this.getDlgConfig?.()?.btnType === "add");
    },
    // 被字段片段clickEvent.relateBtnId引用的按钮id集合（历史JSON可能存为字符串，解析失败按无引用处理）
    relatedBtnIds() {
      const ids = new Set();
      const traverse = items => {
        (items || []).forEach(item => {
          if (item.children && item.children.length) {
            traverse(item.children);
            return;
          }
          let segments = item.contentTextAttrArr;
          if (typeof segments === "string") segments = str2obj(segments);
          if (!Array.isArray(segments)) return;
          segments.forEach(seg => {
            const id = seg?.clickEvent?.relateBtnId;
            if (id !== undefined && id !== null && id !== "") ids.add(String(id));
          });
        });
      };
      traverse(this.tableConfigJSON);
      return ids;
    },
    // 按钮投放分组（第六期，渲染方案§4.4作用范围推导）：add/refresh全局、batchDel及deliverySelectList批量、
    // edit/check及被relateBtnId引用为行级，其余按是否读取行字段分流。现有动作类型中读取行字段的仅
    // edit/check与被relateBtnId引用者（其余动作的参数映射上下文为查询参数getParams或勾选集合
    // deliverySelectList，均不直接读行），故参数映射分流的兜底统一归顶部全局；
    // isHidden与暂不实施族不渲染入口（优先级：排除暂不实施 > add > refresh > 批量 > 行级 > 顶部）
    btnPlacement() {
      const placement = { fab: [], row: [], batch: [], top: [] };
      const relatedBtnIds = this.relatedBtnIds;
      this.btnList.forEach(btn => {
        const extra = btn.extraOption || {};
        if (extra.isHidden) return;
        if (UNPLACED_BTN_TYPES.includes(extra.btnType) || extra.openType === 4) return;
        if (extra.btnType === "add") {
          placement.fab.push(btn);
        } else if (extra.btnType === "refresh") {
          placement.top.push(btn);
        } else if (extra.btnType === "batchDel" || extra.deliverySelectList) {
          placement.batch.push(btn);
        } else if (extra.btnType === "edit" || extra.btnType === "check" || relatedBtnIds.has(String(btn.btnId))) {
          placement.row.push(btn);
        } else {
          placement.top.push(btn);
        }
      });
      return placement;
    },
    // 勾选态底部批量操作栏渲染条件：开启勾选、存在批量按钮且有勾选（进入勾选态自底部滑出，取消勾选收起）
    batchBarVisible() {
      return this.showCheckbox && this.btnPlacement.batch.length > 0 && this.selectList.length > 0;
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
    // 流程定义查询与批量删除（第七期，4.7）：宿主 tableRender.vue provide 已含 queryFlowDef/requestBatchDel，
    // 移动端补 inject 声明即可；流程跳转不走桌面 openFlow 弹窗（H5 为路由跳转），故不 inject openFlow
    queryFlowDef: {
      default: () => () => {
        console.warn("inject缺失queryFlowDef!");
      }
    },
    requestBatchDel: {
      default: () => () => {
        console.warn("inject缺失requestBatchDel!");
      }
    },
    // 审批流程对齐（main 合并 a8311cb 后补，与桌面 tableItem inject 同源）：编辑流程按钮在流程审批中时
    // 经 isCurrentApprover 判定是否以审批（edit）模式打开；stageId 为随审批流程功能新增的固定查询参数
    isCurrentApprover: {
      default: () => () => {
        console.warn("inject缺失isCurrentApprover!");
      }
    },
    stageId: {
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
    },
    // 个人签名（与桌面 BaseRenderTable 同来源）：宿主 tableRender provide 的 getToken 用于图片直链
    // 过JWT鉴权，axios 实例 request 的 baseURL 用于拼接口地址；移动端经 complete-table 挂载，
    // provide 沿宿主 tableRender 透传，能力面与桌面一致
    getToken: {
      default() {
        return () => "";
      }
    },
    request: {
      default: null
    }
  },

  provide() {
    return {
      // 与桌面端一致的能力面，供复杂formatter注入使用
      getTableRenderInstance: () => this.expose_CompleteTableInstance(),
      emitBtnClick: this.emitBtnClick
    };
  },

  created() {
    // 个人签名图片加载失败标记（userId -> true），失败的不再重复发起img请求（与桌面 BaseRenderTable 一致）
    this._signatureFailedIds = {};
  },

  mounted() {
    this.ensureParentPosition();
  },

  activated() {
    // isRefresh 返回回刷（第七期，4.6）：keep-alive 返回时组件不重建、init 不再执行，
    // 按标记触发回第一页重查（非 keep-alive 场景重挂载由 init 首查覆盖，标记已在 init 内清理）
    if (this.consumePendingRefresh()) {
      this.loadFirst();
    }
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

      // isRefresh 返回回刷（第七期）：非 keep-alive 场景返回即重挂载，下方 init 首查就是回刷本身，
      // 此处仅消费清理标记，避免组件后续被 keep-alive 激活时重复刷新；keep-alive 场景经 activated 消费
      this.consumePendingRefresh();

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

    // 权限过滤与桌面 filterBtnsByPermission 同语义（普通列表分支：rawRelateId 缺失/notVerify 或预览态不过滤）。
    // 场景过滤与桌面 composeBtnRegularOptions 同口径：FreeLayout 仅 btnVerifyType 为 checkPermission 时过滤；
    // VForm 子表场景移动端不实施（无 getWidget 宿主），不做其按钮显示筛选
    composeBtnList() {
      let config = cloneDeep(this.formOptions || []);
      const shouldFilter = !this.isFreeLayoutWidget || this.renderStrategy.btnVerifyType === "checkPermission";
      if (shouldFilter && !this.previewMode && this.rawRelateId && this.rawRelateId !== "notVerify") {
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

    // openType=5 直接调用接口（与桌面 disposeRequestEvent 同语义；requestSuccessMessage 为接口通过后
    // 提示语（main 合并新增，空则不提示）；isRefresh 后回到第一页重查）
    async disposeRequestEvent({ requestBeforeConfirmHint, requestBeforeConfirmText, requestBeforeConfirmTitle, requestBeforeConfirmType, requestSuccessMessage }, rowData) {
      if (requestBeforeConfirmHint) {
        // 前置确认改用 vant Dialog（宿主 H5 确认框统一形态，取消同样 reject 中断执行，与桌面 $confirm 语义一致；
        // requestBeforeConfirmType 为 Element 图标类型，vant 弹窗无对应形态故不消费）
        await this.$dialog?.confirm({
          title: requestBeforeConfirmTitle || "提示",
          message: `${requestBeforeConfirmText}`
        });
      }
      const { finalUrl, finalType, finalData, headers: requestHeaders } = this.getRequestConfig(rowData);

      await this.generalRequest(finalUrl, finalType, finalData, requestHeaders);
      requestSuccessMessage && this.showSuccess(requestSuccessMessage);
      this.btnConfigs.isRefresh && this.loadFirst();
    },

    /** ============ 批量删除（第七期：与桌面 disposeDel/batchDel 同语义） ============ */

    // 与桌面 getFirstSelectedData 同语义：勾选集合优先，无勾选回退当前行（卡片点击维护的 currentSelectedRow）
    getFirstSelectedData() {
      return this.selectList[0] || this.currentSelectedRow;
    },

    // openType=-1 batchDel（与桌面 disposeDel 非本地数据/非VForm子表分支同语义——移动端无 localProcessData/
    // isVformWidget 场景）：行级入口传 row 按该行删除；否则按勾选集合（无勾选回退当前行的语义在
    // getSelectedData/getFirstSelectedData 内）；主键取不到值时提示不执行
    disposeDel(row) {
      if (row) {
        this.batchDel([row[this.keyField]], [row]);
        return;
      }
      const selectList = this.getSelectedData();
      if (selectList.length === 0) {
        return this.showTip("请至少勾选一条要处理的数据");
      }
      if ([undefined, null].includes(this.tableData[0]?.[this.keyField])) {
        return this.showTip("主键字段未取到值，请检查数据或重新在列表设计页面重新关联主键！");
      }
      this.batchDel(
        selectList.map(item => item[this.keyField]),
        selectList
      );
    },

    // 批量删除（与桌面 batchDel 同语义）：requestBatchDel（宿主 inject）成功后提示并重查。
    // 桌面"末页删空回退页码"保护在移动端由回第一页替换式查询天然覆盖（移动端为多页累计卡片列表、
    // 无"当前页"视图，loadFirst 恒从第一页查起不会落在空页），故重查统一走 loadFirst；
    // 删除失败给出提示可重试（沿用移动端加载失败的提示口径；宿主全局报错拦截可能叠加提示，可接受）
    async batchDel(idList = [], listData) {
      try {
        const res = await this.requestBatchDel(idList, this.listPageId);
        if (res?.result !== "0") {
          throw new Error(res?.message || "删除失败");
        }
        this.showSuccess("删除成功");
        this.loadFirst();
      } catch (error) {
        console.error(`[mobileTable] batchDel error: ${error}`);
        this.showTip("删除失败，请重试");
      }
    },

    /** ============ 流程跳转（第七期，4.6：与桌面 disposeFlowEvent 同数据来源） ============ */

    // openType=2 流程（与桌面 disposeFlowEvent 同数据来源，跳转目标为流程 H5 摘要页）：
    // check/edit 均先查流程实例（/flow/business/{主键值}，草稿态无 flowInstanceId 提示不跳转）；
    // edit 在流程审批中（flowStatus==2）且当前人为当前节点审批人时以审批（edit）模式跳转，否则维持 view
    // （对齐桌面合并 a8311cb 后的 disposeFlowEvent）；发起/审批经 queryFlowDef 查流程定义。
    // 桌面 openFlow 弹窗在移动端为路由跳转，跳转前按 isRefresh 记回刷标记
    // （桌面 isRefresh && queryTableData() 的弹窗关闭时机等价为返回列表路由时）
    async disposeFlowEvent({ flowKey, btnType, isRefresh, deliverySelectList }, row) {
      const mainFieldValue = (row || this.getFirstSelectedData())?.[this.keyField];
      if (btnType === "check" || btnType === "edit") {
        if (!mainFieldValue) {
          return this.showTip("请至少勾选一条要处理的数据！");
        }
        const res = await this.generalRequest(`/flow/business/${mainFieldValue}`, "get");
        if (!res?.data) {
          return this.showTip("未能获取流程详情！");
        }
        if (!res?.data?.flowInstanceId) {
          return this.showTip(`草稿状态的流程不能${btnType === "edit" ? "编辑" : "查看"}！`);
        }
        // 跳转参数白名单取自 4.6 样例 URL；approveType 按桌面映射：check 恒 view，edit 条件升级（见下）
        const params = {
          currentVersionId: res.data.currentVersionId,
          flowInstanceId: res.data.flowInstanceId,
          businessId: res.data.businessId,
          approveType: "view"
        };
        // 编辑按钮且流程处于审批中，调接口查询是否是当前节点审批人：
        // 当前人是流程当前节点审批人时以审批（edit）模式跳转，否则维持 view（与桌面逐字同语义）
        if (btnType === "edit" && (row || this.getFirstSelectedData())["flowStatus"] == "2") {
          const canEditRes = await this.isCurrentApprover(res.data.flowInstanceId);
          if (canEditRes?.data) {
            params.approveType = "edit";
          }
        }
        this.jumpToFlowH5(params, isRefresh);
      } else {
        const res = await this.queryFlowDef("", "", flowKey);
        const flowInfo = res?.data;
        if (!flowInfo) {
          return this.showTip("未能获取流程定义！");
        }
        // 发起/审批：approveType 按桌面发起分支取 add；flowKey 定义返回值优先、按钮配置兜底；
        // stdNew 移动端不特判（/examine-new 仅 PC 端注册），统一走 flowH5Summary（approveType=add）
        this.jumpToFlowH5(
          {
            currentVersionId: flowInfo.currentVersionId,
            flowKey: flowInfo.flowKey ?? flowKey,
            approveType: "add"
          },
          isRefresh
        );
      }
    },

    // 流程跳转统一收口：补全 enterpriseId（宿主 inject）/isProject（项目路由判定）后经宿主 hash 路由跳转
    // （移动端流程统一入口 flowH5Summary）；桌面专有的弹窗参数（dialogHeight/dialogWidth/sourceData/
    // dataFromList/dlgFormConfig）不进入 URL
    jumpToFlowH5(params, isRefresh) {
      const query = { ...params, enterpriseId: this.enterpriseId, isProject: this.isProjectRoute ? 1 : 0 };
      if (isRefresh) {
        this.markPendingRefresh();
      }
      this.jumpToH5Route(FLOW_H5_SUMMARY_PATH, query);
    },

    // 同宿主 hash 路由内跳转（4.6）：目标路由注册于当前 router 时用 $router.push（组件不销毁、返回可 keep-alive），
    // 否则回退 location.href 拼接 H5 基地址（commonDph5.html）；仅序列化原始类型参数
    jumpToH5Route(path, query = {}) {
      const params = {};
      Object.entries(query).forEach(([key, value]) => {
        if (["string", "number", "boolean"].includes(typeof value) && value !== "") {
          params[key] = value;
        }
      });
      let resolved = null;
      try {
        resolved = this.$router?.resolve?.({ path, query: params });
      } catch (error) {
        console.warn("[mobileTable] 解析跳转路由失败：", error);
      }
      if (resolved?.route?.matched?.length) {
        this.$router.push({ path, query: params });
        return;
      }
      const base = window.location.pathname?.endsWith?.(".html") ? `${window.location.origin}${window.location.pathname}` : `${window.location.origin}/commonDph5.html`;
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&");
      window.location.href = `${base}#${path}${queryString ? `?${queryString}` : ""}`;
    },

    /** ============ isRefresh 返回回刷（第七期，4.6） ============ */

    // 跳转离开列表前记录回刷标记（按 listPageId 匹配，跨列表不误刷；存储风格同 lowcodeTableThisPageJumpParams）
    markPendingRefresh() {
      try {
        sessionStorage.setItem(PENDING_REFRESH_KEY, JSON.stringify({ listPageId: this.listPageId }));
      } catch (error) {
        console.warn("[mobileTable] 记录返回回刷标记失败：", error);
      }
    },

    // 消费回刷标记：listPageId 匹配才命中并清理（第八期表单/列表路由页返回时复用同一机制）
    consumePendingRefresh() {
      try {
        const raw = sessionStorage.getItem(PENDING_REFRESH_KEY);
        if (!raw) return false;
        const marker = JSON.parse(raw);
        const matched = !!marker && marker.listPageId === this.listPageId;
        if (matched) sessionStorage.removeItem(PENDING_REFRESH_KEY);
        return matched;
      } catch (error) {
        console.warn("[mobileTable] 消费返回回刷标记失败：", error);
        return false;
      }
    },

    /** ============ 表单/列表专用路由页（第八期，4.4：openType=0/6 跳转宿主路由页） ============ */

    // openType=0 动态表单（与桌面 disposeDynamicFormEvent 同语义的分支/校验/标题/传参口径，桌面弹窗在
    // 移动端为路由页承载）：add 直接跳转；check/edit 取行主键（行级入口 rowData 优先、否则勾选/当前行），
    // 无数据提示与主键无值提示同桌面文案；桌面 localProcessData（本地数据免主键）为从表场景移动端无对应
    // 不实施。跳转载荷包含两条与桌面完全一致的参数通道：formAttrs（=桌面 getExternalCompBaseAttrs，
    // 经路由页 v-bind 到 VFRuntime 的 attrs 全集）与 externalParams（=桌面 externalParamsFormRow，
    // 经路由页 addExtraData 注入的补充提交数据）；btnConfigs.formId/dialogTitle/editRow 与桌面同序写入，
    // 保证 dlgFormConfig 展开内容一致。isRefresh 与 listPageId 供路由页在提交成功后写回刷标记
    // （lowcodeTablePendingRefresh），消费走第七期 activated/init 链路——与桌面"提交成功才重查"
    // （onSubmit）时机一致，取消不重查
    disposeDynamicFormEvent({ btnType, relateFrom, dialogTitle, deliverySelectList, deliverySelectListFields }, rowData) {
      const externalParams = this.formatSelectListParams({ deliverySelectList, deliverySelectListFields }, rowData);
      const baseQuery = {
        renderType: "form",
        id: relateFrom,
        btnType,
        isRefresh: this.btnConfigs?.isRefresh ? 1 : 0,
        listPageId: this.listPageId
      };
      switch (btnType) {
        case "add":
          this.btnConfigs.formId = relateFrom;
          this.btnConfigs.dialogTitle = dialogTitle || "新增";
          this.jumpToModalPage({ ...baseQuery, title: this.btnConfigs.dialogTitle, onlyRead: 0 }, externalParams, this.getExternalCompBaseAttrs());
          break;
        case "check":
        case "edit": {
          let primaryKeyValue;
          if (rowData) {
            primaryKeyValue = rowData[this.keyField];
          } else if (this.getFirstSelectedData()) {
            primaryKeyValue = this.getFirstSelectedData()[this.keyField];
          } else {
            return this.showTip("请至少勾选一条要处理的数据！");
          }
          if ([undefined, null].includes(primaryKeyValue)) {
            return this.showTip("主键字段未取到值，请检查数据或在列表设计页面重新关联主键！");
          }
          this.editRow = rowData || this.getFirstSelectedData();
          this.btnConfigs.formId = relateFrom;
          this.btnConfigs.dialogTitle = dialogTitle || (btnType === "check" ? "查看" : "编辑");
          // 桌面同款覆写（含原拼写 closeOnPressEscap 读取 undefined 的行为），保证 dlgFormConfig 展开一致
          this.btnConfigs.closeOnPressEscape = btnType === "check" ? true : this.btnConfigs.closeOnPressEscap;
          this.jumpToModalPage(
            {
              ...baseQuery,
              title: this.btnConfigs.dialogTitle,
              onlyRead: btnType === "check" ? 1 : 0,
              primaryKeyValue
            },
            externalParams,
            this.getExternalCompBaseAttrs()
          );
          break;
        }
        default:
          break;
      }
    },

    // 桌面 getExternalCompBaseAttrs 同语义（来源 tableItem.js:2401）：桌面弹窗经 attrs 传给 VFRuntime/
    // vFRender_view 的外部参数全集，移动端经 sessionStorage 传给路由页后 v-bind，保证 vform 获得的参数
    // 与桌面完全一致。桌面 btnRegularOptions[0].formItem 为 composeBtnRegularOptions 包装的按钮平铺数组，
    // 移动端等价为 composeBtnList 产出的 btnList；mainDataId/mainFormId/mainRelateFieldName 来源于
    // vform 从表宿主 inject（getPrimaryKeyValue/getDlgConfig/getWidget），移动端独立列表无该宿主，
    // this 上不存在 → ?.() 取值 undefined，与桌面独立列表（inject 缺失仅告警、值为 undefined）一致
    getExternalCompBaseAttrs() {
      const {
        selectList,
        keyField,
        btnConfigs: { btnDisposeParamsRule, requestBeforeConfirmHint, requestBeforeConfirmText, requestBeforeConfirmTitle, requestBeforeConfirmType, deliverySelectList },
        dynamicExternalParams
      } = this;
      const { finalUrl, finalType, finalData, headers } = this.getRequestConfig();
      const btnConfig = (this.btnList || []).find(item => item.btnId === this?.btnConfigs?.btnId) || {};
      let config = {
        dynamicExternalParams,
        requestConfig: {
          requestType: finalType,
          requestUrl: finalUrl,
          requestBodyData: finalData,
          requestHeader: headers,
          requestBeforeConfirmHint,
          requestBeforeConfirmText,
          requestBeforeConfirmTitle,
          requestBeforeConfirmType
        },
        tableData: this.tableData,
        externalParams: this.externalParams,
        callingFrom: "dynatic-table",
        dlgFormConfig: {
          originInfo: btnConfig,
          ...this.btnConfigs
        },
        // 作为vform组件时需要传递以下信息（独立列表场景与桌面同为 undefined）
        isVformWidget: this.isVformWidget,
        localProcessData: this.localProcessData,
        mainDataId: this.getPrimaryKeyValue?.(),
        mainFormId: this.getDlgConfig?.()?.formId,
        mainRelateFieldName: this.getWidget?.()?.options?.name
      };
      if (deliverySelectList) {
        config = Object.assign(config, {
          keyFieldName: keyField,
          selectList,
          paramsRule: btnDisposeParamsRule
        });
      }
      return config;
    },

    // openType=6 动态列表（与桌面 disposeDynamicTableEvent 同语义）：check/edit 校验行/勾选数据；
    // externalParams 为 useArray 口径（对齐桌面嵌套列表 init 传参）；桌面 onlyRead=true 仅控制弹窗底栏
    // （嵌套列表弹窗无提交），移动端路由页为完整列表页、无底栏不传；嵌套列表自身按钮与重查由其内部
    // executeButton 处理（桌面同），不回刷外层列表
    disposeDynamicTableEvent({ btnType, relateTable, dialogTitle, deliverySelectList, deliverySelectListFields }, rowData) {
      if (["check", "edit"].includes(btnType) && !(rowData || this.getFirstSelectedData())) {
        return this.showTip("请至少勾选一条要处理的数据！");
      }
      const externalParams = this.formatSelectListParams({ deliverySelectList, deliverySelectListFields }, rowData, "useArray");
      this.jumpToModalPage(
        {
          renderType: "pageList",
          id: relateTable,
          title: dialogTitle || (btnType === "check" ? "查看" : "编辑")
        },
        externalParams
      );
    },

    // 路由页统一跳转收口：业务参数写 sessionStorage（与 lowcodeTableThisPageJumpParams 传参风格一致，
    // 路由页挂载时读取并删除）：externalParams = 桌面 externalParamsFormRow（addExtraData 载荷），
    // formAttrs = 桌面 getExternalCompBaseAttrs（v-bind attrs 全集，仅表单跳转携带；桌面嵌套列表
    // 不传 attrs，列表跳转不带该键）。复用第七期 jumpToH5Route 双通道（路由注册于当前 router 时
    // $router.push 保持组件可 keep-alive、返回回刷链路最优，否则 location.href 拼 H5 基地址）
    jumpToModalPage(query, externalParams, formAttrs) {
      try {
        sessionStorage.setItem(LOWCODE_MODAL_PARAMS_KEY, JSON.stringify({ externalParams: externalParams || {}, formAttrs }));
      } catch (error) {
        console.warn("[mobileTable] 写入路由页业务参数失败：", error);
      }
      this.jumpToH5Route(LOWCODE_MODAL_PATH, query);
    },

    // 以下分派器依赖桌面端弹窗/下载体系（五期方案4.8 定性收口）：下载/导入/二维码族与 openType=4 关联组件
    // 维持暂不实施，移动端仅保证执行链可达并告警
    fifthPhaseWarn(action) {
      console.warn(`[mobileTable] 按钮动作（${action}）属暂不实施范围（下载/导入族、关联组件），移动端暂不执行`);
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

    /** ============ 按钮入口（第六期：四处入口与投放骨架） ============ */

    // 入口置灰态（五期方案4.5）：预览/禁用态渲染但置灰不可点；tagAttrs.disabled为按钮自身禁用（expose_enableAllBtn可恢复）
    isBtnDisabled(btn) {
      return !!(this.previewMode || this.tableDisbaled || btn?.tagAttrs?.disabled);
    },

    // 四处入口统一点击：置灰态不执行；半屏面板内按钮执行后关闭面板；
    // 执行链与字段片段入口（emitBtnClick）一致，共享executeButton校验链与桌面完全相同
    handleEntryBtnClick(btn, row) {
      this.activeActionSheet = null;
      if (this.isBtnDisabled(btn)) return;
      this.executeButton({ ...(btn.extraOption || {}), btnId: btn.btnId, authorize: btn.authorize }, row);
    },

    // 卡片操作区直出按钮：常用前N个（edit/check排前，其后按formOptions顺序）
    getCardInlineBtns() {
      return this.btnPlacement.row.slice(0, CARD_ACTION_INLINE_COUNT);
    },

    // 底部半屏面板按钮列表：fab=FAB聚合的add类；rowMore=该行未直出的行级按钮
    getActionSheetBtns() {
      const sheet = this.activeActionSheet;
      if (!sheet) return [];
      if (sheet.type === "fab") return this.btnPlacement.fab;
      if (sheet.type === "rowMore") return this.btnPlacement.row.slice(CARD_ACTION_INLINE_COUNT);
      return [];
    },

    // 打开卡片行级"···"半屏面板（与第四期顶部下拉弹层同屏互斥）；预览/禁用态不开面板
    openRowMoreSheet(row) {
      if (this.previewMode || this.tableDisbaled) return;
      this.activeFilterKey = "";
      this.activeActionSheet = { type: "rowMore", row };
    },

    // 退出勾选态：清空选择收起底部批量操作栏（选择集合语义与第三期一致）
    clearBatchSelection() {
      this.selectList = [];
      this.emitSelectionChange([]);
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
      // 顶层模糊搜索配置（第四期）：与桌面 renderOperateArea 消费同源
      this.fuzzyFieldSearchConfig = merge({}, { placeholder: "", searchFieldList: [] }, json.fuzzyFieldSearchConfig || {});
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
            formatter: item.formatter ? str2Fn(item.formatter) : null,
            // 第四期排序面板数据源：sort 为真值的列可排序
            sort: Boolean(item.sort)
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
        // 随审批流程功能新增的固定参数（与桌面 getParams 同位置合入）
        stageId: this.stageId,
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

    // 移动端提示统一走 vant Toast（宿主 CommonDPh5 全量 Vue.use(Vant)，组件继承 root 原型的 this.$toast，
    // 用法与宿主 H5 页面一致）；无 vant 的挂载环境（如设计器独立预览）回退 console 不报错
    showTip(message) {
      this.$toast ? this.$toast(message) : console.warn(message);
    },

    // 成功提示（vant Toast.success，宿主 integration-record-h5 同款用法；batchDel 删除成功等场景）
    showSuccess(message) {
      this.$toast?.success ? this.$toast.success(message) : console.log(message);
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

    /** ============ 顶部筛选与排序（第四期） ============ */

    // 归一化搜索控件配置：与桌面 composeFromOptions 的
    // merge(getWidgetOptions(tagName, item), depthFirstSearchWithRecursive(searchWidgetConfig)) 同构，
    // 空值键被清除后由控件基线默认值兜底（placeholder/value-format 等）
    normalizeSearchWidgetConfig(item, widgetName) {
      const base = getWidgetOptions(widgetName, item) || {};
      // depthFirstSearchWithRecursive 原地删除空值键，先深拷贝避免污染 tableConfigJSON
      const cleaned = depthFirstSearchWithRecursive(cloneDeep(item.searchWidgetConfig || {}));
      const config = merge({}, base, cleaned);
      // extraOption 兜底：设计端保存时已 str2obj 为对象，历史数据可能仍为字符串
      if (typeof config.extraOption === "string") config.extraOption = str2obj(config.extraOption);
      if (!config.extraOption || typeof config.extraOption !== "object") config.extraOption = {};
      if (!Array.isArray(config.extraOption.options)) config.extraOption.options = [];
      if (!config.extraOption.props) config.extraOption.props = { key: "id", label: "cnName" };
      return config;
    },

    // 选项取值映射：字典（labelTranslateType 为数值）仅在 request.require+url 远程分支强制
    // {key:"dicId",label:"cnName"}（与桌面 disposeRequest 同分支限定；autoFill 分支结果恒为 id/cnName 形状，不强制）
    getEntryOptionProps(entry) {
      if (!entry.config) return { key: "id", label: "cnName" };
      const { extraOption, request } = entry.config;
      const isDictionaryRequest = !request?.autoFillOptions && request?.require && request?.url && typeof extraOption?.labelTranslateType === "number";
      if (isDictionaryRequest) return { key: "dicId", label: "cnName" };
      return { key: extraOption?.props?.key || "id", label: extraOption?.props?.label || "cnName" };
    },

    // 列筛选选项：filters > filtersConfig.customHandler > filtersConfig.isFilter（优先级与桌面 setSingleTableOptions 一致）；
    // customHandler/isFilter 依赖当前数据，面板打开时现算（等价桌面 tableDataChangeQueue 的数据变化重算语义）
    getColumnFilterOptions(entry) {
      const item = entry.columnItem;
      if (!item) return [];
      const filtersConfig = item.filtersConfig || {};
      try {
        if (item.filters) {
          const arr = str2obj(item.filters);
          if (!Array.isArray(arr)) return [];
          return arr.filter(opt => opt && isValid(opt.value)).map(opt => ({ value: opt.value, label: `${opt.text ?? opt.value}` }));
        }
        if (filtersConfig.customHandler) {
          const arr = str2Fn(filtersConfig.customHandler)(this.tableData);
          if (!Array.isArray(arr)) return [];
          return arr.filter(opt => opt && isValid(opt.value)).map(opt => ({ value: opt.value, label: `${opt.text ?? opt.value}` }));
        }
        if (filtersConfig.isFilter) {
          const filters = [];
          (this.tableData || []).forEach(row => {
            const cell = row[item.fieldCode];
            const values = filtersConfig.isSplit ? String(cell ?? "").split(filtersConfig.splitChar || ",").filter(v => isValid(v)) : [cell];
            values.forEach(value => {
              if (!isValid(value)) return;
              if (filters.some(filterItem => String(filterItem.value) === String(value))) return;
              // limitShowWord/maxlength 只截断显示文本，提交值保持原始值
              const label = filtersConfig.limitShowWord ? limitShowWord(`${value}`, filtersConfig.maxlength) : `${value}`;
              filters.push({ value, label });
            });
          });
          return filters;
        }
      } catch (error) {
        console.warn(`[mobileTable] 列筛选选项生成失败: ${item.fieldCode}`, error);
      }
      return [];
    },

    // 远程选项加载（与桌面 BaseRenderForm disposeRequest 同语义）：autoFillOptions / request.require+url，
    // 按 fieldCode 缓存一次（桌面 request.status 置 finish 的等价物，不改动 tableConfigJSON）；预览态不请求
    async ensureEntryOptions(entry) {
      if (!entry?.config || this.previewMode) return;
      const request = entry.config.request || {};
      const needsRemote = request.autoFillOptions || (request.require && request.url);
      if (!needsRemote || this.filterOptionCache[entry.fieldCode]) return;
      this.filterOptionCache = { ...this.filterOptionCache, [entry.fieldCode]: { status: "loading", raw: [] } };
      try {
        let rawList = [];
        if (request.autoFillOptions) {
          // 自动填充：按当前列取已有数据做选项，body 含查询参数（与桌面 autoFillOptions 逐字一致）
          const res = await this.generalRequest("/dyn-common/page-list/queryDictColumnDataList", "post", {
            listPageId: this.listPageId,
            idFieldName: entry.fieldCode,
            titleFieldName: request.labelFieldName || "",
            ...this.getParams()
          });
          const data = res?.data || [];
          rawList = request.labelFieldName ? data : data.map(item => ({ id: item.id, cnName: item.id }));
        } else {
          const finalType = typeof request.type === "string" ? request.type : request.type === 0 ? "post" : "get";
          const params = convertDynaticData(str2obj(request.params), this.getParams() || {}, this);
          const res = await this.generalRequest(request.url, finalType, params);
          let data = (res?.data || []).slice();
          // 与桌面 requestData 一致：按 sortNum 排序；labelTranslateType===1 时 label 前缀拼 key
          data.sort((a, b) => (a.sortNum || 0) - (b.sortNum || 0));
          if (entry.config.extraOption.labelTranslateType === 1) {
            const { key, label } = this.getEntryOptionProps(entry);
            data = data.map(item => ({ ...item, [label]: `${item[key]}-${item[label]}` }));
          }
          rawList = data;
        }
        if (this._destroyed) return;
        this.filterOptionCache = { ...this.filterOptionCache, [entry.fieldCode]: { status: "done", raw: rawList } };
      } catch (error) {
        console.error(`[mobileTable] 筛选选项加载失败: ${entry.fieldCode}`, error);
        if (!this._destroyed) {
          this.filterOptionCache = { ...this.filterOptionCache, [entry.fieldCode]: { status: "error", raw: [] } };
        }
      }
    },

    // 面板原始选项（保留级联树形结构）：与桌面 disposeRequest 同语义——需要远程选项的字段
    // （autoFillOptions / request.require+url）远程结果整体替换静态配置（桌面先清空 extraOption.options
    // 再由请求填充，加载中/失败时为空）；无远程配置的字段仅静态选项
    getEntryRawOptions(entry) {
      const request = entry.config?.request || {};
      const needsRemote = request.autoFillOptions || (request.require && request.url);
      if (needsRemote) {
        const cache = this.filterOptionCache[entry.fieldCode];
        return cache?.status === "done" ? [...cache.raw] : [];
      }
      return [...(entry.config?.extraOption?.options || [])];
    },

    // 选项列表面板选项：归一为 {value,label}，并入列筛选来源，按值去重
    getEntryOptions(entry) {
      const { key, label } = this.getEntryOptionProps(entry);
      const list = [];
      const push = (value, text) => {
        if (!isValid(value)) return;
        if (list.some(item => String(item.value) === String(value))) return;
        list.push({ value, label: isValid(text) ? `${text}` : `${value}` });
      };
      this.getEntryRawOptions(entry).forEach(item => item && push(item[key], item[label]));
      this.getColumnFilterOptions(entry).forEach(item => push(item.value, item.label));
      return list;
    },

    // 入口选中态与摘要：数值范围取Start/End拼接，其余取当前值（multiple 控件取数组首项展示）
    getEntryValueState(entry) {
      const { fieldCode, widgetType } = entry;
      if (widgetType === 1) {
        const start = this.searchForm[`${fieldCode}Start`];
        const end = this.searchForm[`${fieldCode}End`];
        const active = isValid(start) && isValid(end);
        return { active, summary: active ? `${start} - ${end}` : "" };
      }
      const value = this.searchForm[fieldCode];
      const empty = !isValid(value) || (Array.isArray(value) && !value.length);
      if (empty) return { active: false, summary: "" };
      const values = Array.isArray(value) ? value : [value];
      const options = this.getEntryOptions(entry);
      const summary = values.map(v => {
        const target = options.find(opt => String(opt.value) === String(v));
        return target ? target.label : `${v}`;
      });
      return { active: true, summary: summary.join("、") };
    },

    // 是否多选提交形状（select/dictionary 的 tagAttrs.multiple、cascader 的 props.multiple）：
    // 移动端面板单选，但提交保持桌面请求形状（单元素数组），后端契约不变
    isMultipleWidget(entry) {
      if (!entry.config) return false;
      const tagAttrs = entry.config.tagAttrs || {};
      if (entry.widgetType === 5) return !!tagAttrs.props?.multiple;
      if (entry.widgetType === 2 || entry.widgetType === 6) return !!tagAttrs.multiple;
      return false;
    },

    // 打开/关闭下拉弹层（排序/全部筛选，同屏互斥）；筛选弹层打开时从当前查询条件构建草稿并按需加载远程选项；
    // 与第六期底部半屏面板同屏互斥
    toggleSheet(key) {
      if (this.tableDisbaled) return;
      if (this.activeFilterKey === key) {
        this.activeFilterKey = "";
        return;
      }
      this.activeActionSheet = null;
      this.activeFilterKey = key;
      if (key === FILTER_SHEET_KEY) {
        this.buildFilterDraft();
        this.filterEntries.forEach(entry => this.ensureEntryOptions(entry));
      }
    },

    closeSheet() {
      this.activeFilterKey = "";
    },

    togglePanelExpanded(key) {
      this.panelExpandedMap = { ...this.panelExpandedMap, [key]: !this.panelExpandedMap[key] };
    },

    // listeners.change 保留：以列表实例为 this，查询先触发、原回调后执行（与桌面 addEventListener 包装顺序一致）
    invokeEntryChange(entry, changeArgs = []) {
      const fn = entry?.config?.listeners?.change;
      if (!fn) return;
      const handler = typeof fn === "function" ? fn : str2Fn(`${fn}`);
      try {
        handler.call(this, ...changeArgs);
      } catch (error) {
        console.error("[mobileTable] 搜索控件 listeners.change 执行失败：", error);
      }
    },

    // 筛选字段空值形状（multiple 控件为 []，其余为 ""）
    getEntryEmptyValue(entry) {
      return this.isMultipleWidget(entry) ? [] : "";
    },

    // 筛选弹层草稿：打开时从当前 searchForm 构建（含仅列筛选来源的字段键），确认前不写回 searchForm（确认制）
    buildFilterDraft() {
      const draft = {};
      this.filterEntries.forEach(entry => {
        if (entry.widgetType === 1) {
          draft[`${entry.fieldCode}Start`] = this.searchForm[`${entry.fieldCode}Start`] ?? null;
          draft[`${entry.fieldCode}End`] = this.searchForm[`${entry.fieldCode}End`] ?? null;
        } else {
          draft[entry.fieldCode] = this.searchForm[entry.fieldCode] ?? this.getEntryEmptyValue(entry);
        }
      });
      this.filterDraft = draft;
    },

    setFilterDraftKey(key, value) {
      this.filterDraft = { ...this.filterDraft, [key]: value };
    },

    // 选项pill点选（单选 + "全部"清空草稿；multiple 控件提交形状为单元素数组）
    setFilterDraft(entry, value) {
      const next = isValid(value) ? (this.isMultipleWidget(entry) ? [value] : value) : this.getEntryEmptyValue(entry);
      this.setFilterDraftKey(entry.fieldCode, next);
    },

    // 确认：草稿整体写回 searchForm 并回第一页替换式查询（requestVersion 并发治理、
    // 选择集合重锚/清空经 loadFirst -> handleTableDataReplaced 自动生效）；
    // 数值范围不完整按未填写处理（不提交不完整范围）；listeners.change 对实际变化的字段逐个保留
    confirmFilterSheet() {
      if (this.previewMode || this.tableDisbaled) return;
      const changes = [];
      const isEmptyValue = v => !isValid(v) || (Array.isArray(v) && !v.length);
      const isSameValue = (a, b) => (isEmptyValue(a) && isEmptyValue(b)) || JSON.stringify(a) === JSON.stringify(b);
      this.filterEntries.forEach(entry => {
        if (entry.widgetType === 1) {
          const start = this.filterDraft[`${entry.fieldCode}Start`];
          const end = this.filterDraft[`${entry.fieldCode}End`];
          const complete = isValid(start) && isValid(end);
          const nextStart = complete ? start : null;
          const nextEnd = complete ? end : null;
          if (!isSameValue(this.searchForm[`${entry.fieldCode}Start`], nextStart) || !isSameValue(this.searchForm[`${entry.fieldCode}End`], nextEnd)) {
            changes.push({ entry, args: complete ? [start, end] : [] });
          }
          this.$set(this.searchForm, `${entry.fieldCode}Start`, nextStart);
          this.$set(this.searchForm, `${entry.fieldCode}End`, nextEnd);
        } else {
          const next = this.filterDraft[entry.fieldCode] ?? this.getEntryEmptyValue(entry);
          if (!isSameValue(this.searchForm[entry.fieldCode], next)) {
            changes.push({ entry, args: [next] });
          }
          this.$set(this.searchForm, entry.fieldCode, next);
        }
      });
      this.activeFilterKey = "";
      this.loadFirst();
      changes.forEach(({ entry, args }) => this.invokeEntryChange(entry, args));
    },

    // 重置（筛选弹层内）：onResetBtnEvent 有配置时完全接管（关闭弹层交由自定义逻辑，桌面 handleFilterReset 同语义）；
    // 否则仅清空草稿回空默认形状，确认时才生效（不直接重查，弹层保持打开供继续调整）
    resetFilterSheet() {
      if (this.previewMode || this.tableDisbaled) return;
      if (this.tableAttrs.onResetBtnEvent) {
        this.activeFilterKey = "";
        str2Fn(this.tableAttrs.onResetBtnEvent).call(this, cloneDeep);
        return;
      }
      const draft = {};
      this.filterEntries.forEach(entry => {
        if (entry.widgetType === 1) {
          draft[`${entry.fieldCode}Start`] = null;
          draft[`${entry.fieldCode}End`] = null;
        } else {
          draft[entry.fieldCode] = this.getEntryEmptyValue(entry);
        }
      });
      this.filterDraft = draft;
    },

    // 排序（与桌面 flowStatusSortMethod + refreshData 同语义）：sqlConfig 合入 externalParams 持久化，
    // 翻页与后续查询自动携带；取消排序传空数组（order: "asc" | "desc"，空为取消）
    applySortChange(fieldCode, order) {
      if (this.previewMode || this.tableDisbaled) return;
      this.sortState = { field: fieldCode || "", order: order || "" };
      this.externalParams = { ...this.externalParams, sqlConfig: { sort: order ? [{ field: fieldCode, order }] : [] } };
      this.activeFilterKey = "";
      this.loadFirst();
    },

    // 模糊搜索：回车/搜索/清空触发（pageNo=1 重查，与桌面 handleFilter/handleNativeFilter 语义一致）
    handleFuzzySearch() {
      if (this.previewMode || this.tableDisbaled) return;
      this.loadFirst();
    },

    handleFuzzyNativeKeydown(e) {
      if (this.previewMode || this.tableDisbaled) return;
      const keyCode = window.event ? e.keyCode : e.which;
      if (keyCode === 13) this.loadFirst();
    },

    /** ============ 字段渲染 ============ */

    /*
     * 格式化渲染，卡片字段区/标题行/详情页共用。
     * 优先级固定：formatter > contentTextAttrArr > PERSON > SIGNATURE > DICT > 原始值（契约§6）
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

      // 4. 个人签名：图片直链渲染（与桌面 BaseRenderTable.renderSignatureCell 同语义，样式按移动端卡片/详情行适配）
      if (field.cellRenderType === CELL_REBDER_TYPE.SIGNATURE) {
        return this.renderSignatureField(cellValue);
      }

      // 5. 字典：dicList匹配；仅dicCode时使用运行时缓存
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

      // 6. 原始值
      return <span>{cellValue === undefined || cellValue === null ? "" : `${cellValue}`}</span>;
    },

    // 个人签名：直接按约定拼 /common/preview 直链（服务端inline返回图片，dwg自动出缩略图），不调批量接口换url；
    // 预览态不发图请求；已失败的（无权限/无签名/token过期等）不再重复加载，避免裂图和反复重试（与桌面一致）
    renderSignatureField(cellValue) {
      const userId = cellValue === undefined || cellValue === null ? "" : `${cellValue}`.trim();
      if (!userId) {
        return cellValue ?? "";
      }
      if (this.previewMode || this._signatureFailedIds[userId]) {
        return <span></span>;
      }
      return (
        <img
          class="mt-signature-img"
          src={this.makeSignatureImageUrl(userId)}
          alt={userId}
          onError={() => this.onSignatureImgError(userId)}
        />
      );
    },

    // 图片加载失败（无下载权限/未上传签名/token过期等）时降级为空展示
    onSignatureImgError(userId) {
      this._signatureFailedIds[userId] = true;
      this.$forceUpdate();
    },

    // 与后端 /getSignatureByUserIds 返回的downloadUrl同构（与桌面 BaseRenderTable 同实现）：
    // 基座取宿主inject的axios实例，token用于img直链过JWT鉴权
    makeSignatureImageUrl(userId) {
      const base = this.request?.defaults?.baseURL || "";
      const url = `${base}/common/preview?fileID=${encodeURIComponent(userId)}`;
      const token = this.getToken();
      return token ? `${url}&token=${encodeURIComponent(token)}` : url;
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

    /** ---- 按钮入口渲染（第六期） ---- */

    // 顶部全局按钮行（视觉统筹定稿：第四期工具条下方第二行，横排、超出横向滚动；工具条不渲染时独立成行）：
    // refresh及其余无行数据依赖的全局按钮；预览/禁用态整行置灰不可点
    renderTopBtnBar() {
      const btns = this.btnPlacement.top;
      if (!btns.length) return null;
      return (
        <div class={{ "mt-btnbar": true, "is-disabled": this.tableDisbaled }}>
          {btns.map(btn => this.renderEntryBtn(btn, () => this.handleEntryBtnClick(btn)))}
        </div>
      );
    },

    // 入口按钮通用渲染（顶部行/卡片操作区/批量栏共用）：文字/图标/type/plain/round取tagAttrs，置灰态推导，尺寸固定small
    renderEntryBtn(btn, onClick) {
      const { value, type, plain, round, icon } = btn.tagAttrs || {};
      return (
        <el-button key={btn.btnId} class="mt-entry-btn" size="small" type={type} plain={plain} round={round} icon={icon} disabled={this.isBtnDisabled(btn)} onClick={onClick}>
          {value || btn.extraOption?.btnType}
        </el-button>
      );
    },

    // 右下角FAB：add类全局按钮；单个直触发、多个点开半屏面板聚合；勾选态批量栏滑出时上移避让（不隐藏，
    // is-lifted 抬高到批量栏上方，保持新增入口常驻可达）
    renderFab() {
      const fabBtns = this.btnPlacement.fab;
      if (!fabBtns.length) return null;
      const multiple = fabBtns.length > 1;
      const allDisabled = fabBtns.every(btn => this.isBtnDisabled(btn));
      return (
        <div
          class={{ "mt-fab": true, "is-disabled": allDisabled, "is-lifted": this.batchBarVisible }}
          onClick={() => {
            if (allDisabled) return;
            if (multiple) {
              this.activeFilterKey = "";
              this.activeActionSheet = { type: "fab" };
            } else {
              this.handleEntryBtnClick(fabBtns[0]);
            }
          }}
        >
          <i class="el-icon-plus"></i>
        </div>
      );
    },

    // 卡片操作区（行级按钮）：常用前N个直出，其余收"···"半屏面板；点击阻止冒泡不触发卡片点击（打开详情）
    renderCardActions(row) {
      const rowBtns = this.btnPlacement.row;
      if (!rowBtns.length) return null;
      const moreCount = rowBtns.length - this.getCardInlineBtns().length;
      return (
        <div class="mt-card-actions" onClick={e => e.stopPropagation()}>
          {this.getCardInlineBtns().map(btn => this.renderEntryBtn(btn, () => this.handleEntryBtnClick(btn, row)))}
          {moreCount > 0 ? (
            <span class={{ "mt-card-more": true, "is-disabled": this.previewMode || this.tableDisbaled }} onClick={() => this.openRowMoreSheet(row)}>
              <i class="el-icon-more"></i>
            </span>
          ) : null}
        </div>
      );
    },

    // 勾选态底部批量操作栏（第六期骨架 + 第七期闭环）：显示已选数量与批量按钮（batchDel/deliverySelectList）；
    // 选择数量校验复用共享executeButton（validateSelectList），batchDel 动作经 disposeDel/batchDel 闭环（第七期）
    renderBatchBar() {
      if (!this.batchBarVisible) return null;
      return (
        <div class="mt-batchbar">
          <span class="mt-batchbar-count">已选 {this.selectList.length} 项</span>
          <div class="mt-batchbar-btns">
            {this.btnPlacement.batch.map(btn => this.renderEntryBtn(btn, () => this.handleEntryBtnClick(btn)))}
            <el-button size="small" plain onClick={() => this.clearBatchSelection()}>
              取消
            </el-button>
          </div>
        </div>
      );
    },

    // 底部半屏面板：FAB多add聚合与卡片行级"···"更多共用形态（全屏蒙层+底部滑入），层级低于详情页
    renderActionSheet() {
      const sheet = this.activeActionSheet;
      if (!sheet) return null;
      const btns = this.getActionSheetBtns();
      const row = sheet.type === "rowMore" ? sheet.row : undefined;
      return [
        <div class="mt-asheet-mask" key="mask" onClick={() => (this.activeActionSheet = null)} />,
        <div class="mt-asheet" key="sheet">
          {btns.map(btn => (
            <div key={btn.btnId} class={{ "mt-asheet-item": true, "is-disabled": this.isBtnDisabled(btn) }} onClick={() => this.handleEntryBtnClick(btn, row)}>
              {btn.tagAttrs?.icon ? <i class={btn.tagAttrs.icon}></i> : null}
              <span class="mt-asheet-item-label">{btn.tagAttrs?.value || btn.extraOption?.btnType}</span>
            </div>
          ))}
        </div>
      ];
    },

    /** ---- 筛选与排序渲染（第四期） ---- */

    // 顶部筛选与排序工具条（第四期）：模糊搜索框（有配置才渲染，右侧「搜索」按钮）+「排序/全部筛选」左右两按钮；
    // 常驻组件顶部不随卡片滚动；两按钮分别打开排序/筛选下拉弹层（自工具条下方顶部下探，蒙层压暗列表区、同屏互斥）
    renderFilterBar() {
      if (!this.showFilterBar) return null;
      return (
        <div class={{ "mt-filterbar": true, "is-disabled": this.tableDisbaled }}>
          {this.fuzzySearchEnabled ? this.renderFuzzySearch() : null}
          {this.filterEntries.length || this.sortableFields.length ? this.renderFilterActions() : null}
        </div>
      );
    },

    // 模糊搜索框固定在工具条上方：输入即 trim 绑定 multiFieldSearch，点击搜索/回车/清空后才调接口
    renderFuzzySearch() {
      return (
        <div class="mt-fb-search">
          <el-input
            value={this.multiFieldSearch}
            onInput={val => {
              this.multiFieldSearch = (val || "").trim();
            }}
            placeholder={this.fuzzyFieldSearchConfig.placeholder || "请输入关键词搜索"}
            clearable
            onClear={() => this.handleFuzzySearch()}
            nativeOnkeydown={this.handleFuzzyNativeKeydown}
          >
            <i slot="prefix" class="el-input__icon el-icon-search"></i>
          </el-input>
          <el-button type="primary" size="small" disabled={this.tableDisbaled} onClick={() => this.handleFuzzySearch()}>
            搜索
          </el-button>
        </div>
      );
    },

    // 工具条按钮行：靠左「排序」、靠右「全部筛选」；有选中条件时高亮，排序按钮显示"字段名 ↑/↓"摘要
    renderFilterActions() {
      const { field, order } = this.sortState;
      const sortLabel = field ? `${this.getSortFieldLabel(field)} ${order === "asc" ? "↑" : "↓"}` : "排序";
      const filterActive = this.filterEntries.some(entry => this.getEntryValueState(entry).active);
      return (
        <div class="mt-fb-actions">
        {this.sortableFields.length ? (
          <span class={{ "mt-fb-action": true, "is-active": !!field, "is-open": this.activeFilterKey === FILTER_SORT_KEY }} onClick={() => this.toggleSheet(FILTER_SORT_KEY)}>
            <span class="mt-fb-action-label">{sortLabel}</span>
            <i class="el-icon-arrow-down"></i>
          </span>
        ) : null}
        {this.filterEntries.length ? (
          <span class={{ "mt-fb-action": true, "is-active": filterActive, "is-open": this.activeFilterKey === FILTER_SHEET_KEY }} onClick={() => this.toggleSheet(FILTER_SHEET_KEY)}>
            <span class="mt-fb-action-label">全部筛选</span>
            <i class="el-icon-arrow-down"></i>
          </span>
        ) : null}
        </div>
      );
    },

    getSortFieldLabel(fieldCode) {
      const target = this.sortableFields.find(field => field.fieldCode === fieldCode);
      return target ? target.fieldName : fieldCode;
    },

    // 下拉弹层（蒙层 + 弹层）：排序与全部筛选共用容器形态，同屏互斥；
    // 弹层锚定工具条下方（列表区顶部）向下展开，蒙层压暗列表区（工具条保持可点，可切换另一弹层）
    renderActiveSheet() {
      if (!this.activeFilterKey) return null;
      return [
        <div class="mt-sheet-mask" key="mask" onClick={() => this.closeSheet()} />,
        <div class="mt-sheet" key="sheet">
          {this.activeFilterKey === FILTER_SORT_KEY ? this.renderSortSheet() : this.renderFilterSheet()}
        </div>
      ];
    },

    // 排序弹层：选项列表点选即生效并关闭；「默认排序」清除排序条件；
    // 字段行点选在升/降间切换（清空排序统一走「默认排序」行，与桌面 el-table sort-change 的字段循环一致）
    renderSortSheet() {
      const rows = [
        <div key="__default__" class={{ "mt-sheet-opt": true, "is-selected": !this.sortState.field }} onClick={() => this.applySortChange("", "")}>
          <span class="mt-sheet-opt-label">默认排序</span>
          <i class="el-icon-check"></i>
        </div>
      ];
      this.sortableFields.forEach(field => {
        const isActive = this.sortState.field === field.fieldCode;
        const nextOrder = !isActive || this.sortState.order !== "asc" ? "asc" : "desc";
        rows.push(
          <div
            key={field.fieldCode}
            class={{ "mt-sheet-opt": true, "is-selected": isActive }}
            onClick={() => this.applySortChange(field.fieldCode, nextOrder)}
          >
            <span class="mt-sheet-opt-label">{field.fieldName}</span>
            {isActive ? <span class="mt-sheet-opt-order">{this.sortState.order === "asc" ? "升序" : "降序"}</span> : null}
            <i class="el-icon-check"></i>
          </div>
        );
      });
      return <div class="mt-sheet-body">{rows}</div>;
    },

    // 全部筛选弹层：筛选字段分组平铺（组标题=字段名），底部「重置/确认」（等宽），确认制草稿
    renderFilterSheet() {
      return (
        <div class="mt-sheet-form">
          <div class="mt-sheet-body">{this.filterEntries.map(entry => this.renderFilterGroup(entry))}</div>
          <div class="mt-sheet-footer">
            <el-button class="mt-sheet-btn-reset" onClick={() => this.resetFilterSheet()}>
              重置
            </el-button>
            <el-button class="mt-sheet-btn-confirm" type="primary" onClick={() => this.confirmFilterSheet()}>
              确认
            </el-button>
          </div>
        </div>
      );
    },

    renderFilterGroup(entry) {
      let control = null;
      if (entry.widgetType === 0) control = this.renderGroupInput(entry);
      else if (entry.widgetType === 1) control = this.renderGroupRange(entry);
      else if (entry.widgetType === 3 || entry.widgetType === 4) control = this.renderGroupDate(entry);
      else if (entry.widgetType === 5) control = this.renderGroupCascader(entry);
      else control = this.renderGroupOptions(entry);
      return (
        <div class="mt-sheet-group" key={entry.key}>
          <div class="mt-sheet-group-title">
            <span>{entry.fieldName}</span>
            {this.isCollapseGroup(entry) ? (
              <span class="mt-sheet-group-toggle" onClick={() => this.togglePanelExpanded(entry.key)}>
                {this.panelExpandedMap[entry.key] ? "收起" : "展开"}
              </span>
            ) : null}
          </div>
          {control}
        </div>
      );
    },

    // 选项分组是否折叠（仅选项列表类分组；超阈值时组标题提供"展开/收起"）
    isCollapseGroup(entry) {
      return ![0, 1, 3, 4, 5].includes(entry.widgetType) && this.getEntryOptions(entry).length > FILTER_OPTION_COLLAPSE_COUNT;
    },

    // 选项分组：pill 按钮组（单选 + "全部"清空草稿），全部绑定草稿、确认时统一生效
    renderGroupOptions(entry) {
      const options = this.getEntryOptions(entry);
      const cache = this.filterOptionCache[entry.fieldCode];
      const expanded = !!this.panelExpandedMap[entry.key];
      const collapsed = !expanded && options.length > FILTER_OPTION_COLLAPSE_COUNT;
      const visibleOptions = collapsed ? options.slice(0, FILTER_OPTION_COLLAPSE_COUNT) : options;
      const draftValue = this.filterDraft[entry.fieldCode];
      const selected = Array.isArray(draftValue) ? draftValue[0] : draftValue;
      return (
        <div class="mt-sheet-pills">
          <span class={{ "mt-pill": true, "is-selected": !isValid(selected) }} onClick={() => this.setFilterDraft(entry, null)}>
            全部
          </span>
          {visibleOptions.map(opt => (
            <span key={`${opt.value}`} class={{ "mt-pill": true, "is-selected": isValid(selected) && String(selected) === String(opt.value) }} onClick={() => this.setFilterDraft(entry, opt.value)}>
              {opt.label}
            </span>
          ))}
          {cache?.status === "loading" && !options.length ? <span class="mt-sheet-hint">选项加载中...</span> : null}
          {cache?.status === "error" ? <span class="mt-sheet-hint">选项加载失败</span> : null}
        </div>
      );
    },

    renderGroupInput(entry) {
      return (
        <el-input
          class="mt-sheet-control"
          value={this.filterDraft[entry.fieldCode] ?? ""}
          placeholder={entry.config?.tagAttrs?.placeholder || `请输入${entry.fieldName}`}
          clearable
          onInput={val => this.setFilterDraftKey(entry.fieldCode, isValid(val) ? val : "")}
        />
      );
    },

    renderGroupRange(entry) {
      return (
        <div class="mt-sheet-range">
          <el-input class="mt-sheet-control" type="number" value={this.filterDraft[`${entry.fieldCode}Start`] ?? ""} placeholder="下限" onInput={val => this.setFilterDraftKey(`${entry.fieldCode}Start`, val)} />
          <span class="mt-sheet-range-sep">-</span>
          <el-input class="mt-sheet-control" type="number" value={this.filterDraft[`${entry.fieldCode}End`] ?? ""} placeholder="上限" onInput={val => this.setFilterDraftKey(`${entry.fieldCode}End`, val)} />
        </div>
      );
    },

    // 日期/日期范围：tagAttrs 透传（placeholder、value-format、type 等），绑定草稿；
    // 日期范围值为数组单键，getParams 提交时拆 fieldStart/fieldEnd
    renderGroupDate(entry) {
      const tagAttrs = { clearable: true, ...(entry.config?.tagAttrs || {}) };
      const isRange = entry.widgetType === 4;
      return (
        <el-date-picker
          class="mt-sheet-control"
          value={this.filterDraft[entry.fieldCode] ?? (isRange ? [] : "")}
          {...{ attrs: tagAttrs }}
          onInput={val => this.setFilterDraftKey(entry.fieldCode, val)}
        />
      );
    },

    // 级联：extraOption.options 树形透传，props 映射与桌面一致（emitPath:false、value=key）；
    // 桌面默认 expandTrigger:hover，移动端无 hover 固定为 click。固定键后置展开（与桌面 BaseRenderForm
    // 无条件覆写 emitPath/value 同语义）：级联基础配置自带 props.expandTrigger="hover"（getElCascaderConfig），
    // 经 normalizeSearchWidgetConfig merge 进入 tagAttrs.props，若放在固定键之后会把 click 覆盖回 hover。
    // 注意：props 是 JSX 数据对象保留键，需经 attrs 透传才能命中 el-cascader 的 props 属性（桌面同经 tagAttrs.attrs 透传）
    renderGroupCascader(entry) {
      const { key, label } = this.getEntryOptionProps(entry);
      const tagAttrs = entry.config?.tagAttrs || {};
      const cascaderProps = { ...(tagAttrs.props || {}), expandTrigger: "click", emitPath: false, value: key, label };
      return (
        <el-cascader
          class="mt-sheet-control"
          value={this.filterDraft[entry.fieldCode] ?? (tagAttrs.props?.multiple ? [] : "")}
          options={this.getEntryRawOptions(entry)}
          attrs={{ props: cascaderProps }}
          show-all-levels={false}
          placeholder={tagAttrs.placeholder || `请选择${entry.fieldName}`}
          clearable={tagAttrs.clearable !== false}
          filterable={!!tagAttrs.filterable}
          onInput={val => this.setFilterDraftKey(entry.fieldCode, val)}
        />
      );
    },

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
            {this.renderCardActions(row)}
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
        {this.renderFilterBar()}
        {this.renderTopBtnBar()}
        {/* 列表区容器：弹层锚定其顶部（紧贴工具条下方）向下展开，蒙层压暗列表区、工具条保持可点 */}
        <div class="mt-body">
          <div class="mt-scroll" ref="scrollWrap">
            {this.renderState()}
            {this.tableData.map((row, index) => this.renderCard(row, index))}
            {this.renderListFooter()}
          </div>
          {this.renderActiveSheet()}
        </div>
        {/* 第六期按钮入口：批量栏/FAB/半屏面板常驻组件层，半屏面板蒙层全屏压暗（含工具条）、低于详情页 */}
        {this.renderBatchBar()}
        {this.renderFab()}
        {this.renderActionSheet()}
        {this.renderDetail()}
      </div>
    );
  }
};
