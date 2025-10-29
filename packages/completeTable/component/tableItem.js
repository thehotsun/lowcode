import BaseRenderTable from "../../BaseRenderTable/index";
import BaseRenderForm from "../../BaseRenderForm/index";
import BaseRenderRegular from "../../BaseRenderRegular/index";
import panel from "./panel.vue";
import printTemplateDlg from "./printTemplateDlg.vue";
import { align, searchWidget } from "../../../baseConfig/tableSelectConfigs";
import { getTableAttrs, getSingleTableData } from "../../../baseConfig/tableBaseConfig";

import {
  getWidgetOptions,
  getWidgetDefaultVal,
  str2obj,
  depthFirstSearchWithRecursive,
  str2Fn,
  setTableAttrs,
  getSummaries,
  addQueryString,
  BtnConfigs,
  transformParamsValue,
  formatterWidthOrHeightStyle,
  setEmptyTableData,
  arrayToTree,
  limitShowWord,
  appendParamsToUrl
} from "../../../utils";
import { convertDynaticData, disposeParams } from "../../../utils/interfaceParams";
import { cloneDeep, omit, merge, isEmpty, union } from "lodash";

function InstanceData() {
  return {
    fuzzyFieldSearchConfig: { placeholder: "", searchFieldList: [] },
    pageLayout: "->, total,sizes, prev, pager, next,jumper",
    // 显示动态表单相关
    btnRelateDialogVisible: false,
    rule: [],
    option: {},
    multiFieldSearch: "",
    // 在本地处理数据时，保证通过enter键和搜索按钮触发搜索
    multiFieldSearchCopy: "",
    // tabledata 属性值要做到和tableOptions中的prop相对应
    tableConfigJSON: [],
    tableOptions: [],
    tableData: [],
    formOptions: [],
    searchForm: {},
    rawSearchForm: {},
    page: {
      pageNo: 1,
      pageSize: 20,
      totalCount: 0
    },
    btnRegularOptions: [
      {
        formItem: []
      }
    ],
    showSearchFrom: true,
    showBtns: true,
    primaryKeyValue: "",
    showPanel: false,
    // 选中的table数据
    selectList: [],
    panelData: [],
    filterField: [],
    externalParams: {},
    dynamicExternalParams: {},
    keyField: "",
    onlyRead: false,
    // 针对某些情况，不允许查看外的任何操作
    tableDisbaled: false,
    // 状态是否开启，如果开启则会根据情况更改tableDisbaled
    tableDisbaledStatus: false,
    previewMode: false,
    curDialogCompRef: "",
    tableAttrs: {},
    btnConfigs: new BtnConfigs(),
    headerHeight: 0,
    // 当不使用网络请求处理提交数据时，编辑的row
    editRow: {},
    // 一般用来传递当前row给表单
    externalParamsFormRow: {},
    // tabledata更改后，需要触发的一系列操作
    tableDataChangeQueue: [],
    // 当前高亮行
    currentSelectedRow: null
  };
}

export default {
  name: "CompleteTableItem",
  components: {
    BaseRenderTable,
    BaseRenderForm,
    BaseRenderRegular,
    panel,
    printTemplateDlg
  },
  props: {
    listPageIdProp: String,
    rawRelateIdProp: String,
    wrapHeightProp: [Number, String]
  },

  data() {
    return new InstanceData();
  },

  computed: {
    isProjectRoute() {
      const isPrjRoute = this.$route.matched.some(matched => {
        return matched.path === "/project";
      });
      return isPrjRoute;
    },
    // 当前是否作为Vform的一个组件
    isVformWidget() {
      return this.renderMode === "vformWidget";
    },
    // 当前是否作为FreeLayout的一个组件
    isFreeLayoutWidget() {
      return this.renderMode === "freeLayoutWidget";
    },
    // 使用动态表单是否要使用网络请求处理提交数据
    localProcessData() {
      return this.getWidget()?.options?.renderMode === 0 || (this.getWidget()?.options?.renderMode === 1 && this.getDlgConfig()?.btnType === "add");
    },

    pageSizes() {
      let options;
      try {
        if (this.tableAttrs.setPaginationSize) {
          options = str2obj(this.tableAttrs.setPaginationSize)?.map(item => item.value);
        }
      } catch (error) {
        console.warn("分页设置转换失败：", error);
      }
      return options || [10, 20, 50, 100];
    },
    // 隐藏默认搜索刷新等功能区
    hiddenDefaultArea() {
      return this.filterTableOptions?.length ? this.tableAttrs?.hiddenDefaultArea : true;
    },

    // 处理分页且属于本地请求数据的情况
    attrs() {
      const props = [
        "isTree",
        "isMerge",
        "isShowIndex",
        "showPagination",
        "isShowIndex",
        "isShowCheckbox",
        "keyField",
        "tableOptions",
        "formOptions",
        "style",
        "paginationSize",
        "deliveryLoadFnField",
        "dataTransitionCurField",
        "dataTransitionParentField",
        "dataTransitionFn",
        "clickRowShowDetialDialog",
        "hiddenDefaultArea"
      ];
      if (!this.tableAttrs.isShowIndex) {
        props.push("index");
      }
      if (!this.tableAttrs.showSummary || !this.tableAttrs.summaryMethod) {
        props.push("summaryMethod");
      }
      if (!this.tableAttrs.isTree) {
        props.push("treeProps", "rowKey", "lazy");
      }
      if (!this.tableAttrs.isMerge) {
        props.push("spanMethod");
      }
      if (!this.tableAttrs.elTableStyle) {
        props.push("elTableStyle");
      }
      if (this.tableAttrs.isTree && this.tableAttrs.lazy && this.tableAttrs.deliveryLoadFnField) {
        this.$set(this.tableAttrs, "load", this.tableDataLoad);
      } else {
        props.push("load");
      }
      return omit(this.tableAttrs, props);
    },

    finalTableData() {
      const {
        localProcessData,
        page: { pageNo, pageSize },
        tableData,
        tableAttrs: { showPagination },
        multiFieldSearchCopy,
        searchForm,
        matchDateRange,
        fuzzyFieldSearchConfig: { searchFieldList = [] }
      } = this;

      if (!localProcessData) return tableData;

      let filteredData = tableData;

      const formItem = this.formOptions[0]?.formItem || [];

      // 1. 精确搜索（searchForm）—— 所有字段必须满足条件（AND）
      filteredData = filteredData.filter(row => {
        return Object.entries(searchForm).every(([field, val]) => {
          if (val == null || val == undefined || val === "" || (Array.isArray(val) && val.length === 0)) return true;
          const rowValue = `${row[field] ?? ""}`;
          let searchType;
          formItem.some(item => {
            if (item.formField === field) {
              switch (item.searchWidgetType) {
                case 4:
                  searchType = "isDateRange";
                  break;
                case 3:
                  searchType = "isDate";
                  break;
                default:
                  break;
              }
              return true;
            }
          });
          if (["isDateRange", "isDate"].includes(searchType)) {
            return matchDateRange(rowValue, val);
          }
          if (Array.isArray(val)) {
            return val.some(v => rowValue.includes(`${v}`));
          }

          return rowValue.includes(`${val}`);
        });
      });

      // 2. 多字段模糊搜索
      if (multiFieldSearchCopy) {
        const keyword = multiFieldSearchCopy.toLowerCase();
        filteredData = filteredData.filter(row => {
          return searchFieldList.some(field => `${row[field] ?? ""}`.toLowerCase().includes(keyword));
        });
      }

      // 3. 分页
      if (showPagination) {
        const start = (pageNo - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
      }

      return filteredData;
    },

    filterTableOptions() {
      const { tableOptions, filterField } = this;
      if (tableOptions?.length === 0) return [];
      let configOptions = [];
      if (tableOptions[1]?.type === "selection" || tableOptions[1]?.type === "index") {
        configOptions = tableOptions.slice(0, 2);
      } else if (tableOptions[0]?.type === "selection" || tableOptions[0]?.type === "index") {
        configOptions = tableOptions.slice(0, 1);
      }

      const options = filterField.map(field => tableOptions.find(rawitem => rawitem.prop === field));
      this.$nextTick(() => {
        // 为了解决取消展示全部字段后，再选择展示某个字段，此时高度渲染出现问题，需要重新调用此方法
        this.$refs.table.$refs.elTable?.doLayout?.();
      });
      return [...configOptions, ...options];
    },

    tableHeight() {
      if (this.wrapHeight && this.headerHeight) {
        let height = "";
        const wrapHeight = parseFloat(this.wrapHeight);
        try {
          // 最后额外减去10 防止多个滚动条出现
          height = wrapHeight - 30 - 30 - this.headerHeight - 40 - 10;
        } catch (error) {
          console.error("设置低代码table高度报错，报错信息：", error);
        }
        return `${height}px`;
      } else if (this.headerHeight) {
        let height = "";
        try {
          const wrapHeight = parseFloat(window.getComputedStyle(document.querySelector(".dialogContent")).height);
          console.log(wrapHeight, "wrapHeight");
          // 最后额外减去10 防止多个滚动条出现
          height = wrapHeight - 30 - 30 - this.headerHeight - 40 - 10;
        } catch (error) {
          console.error("设置低代码table高度报错，报错信息：", error);
        }
        return `${height}px`;
      } else {
        return "auto";
      }
    },
    listPageId() {
      return this.listPageIdProp || this.getListPageId();
    },
    rawRelateId() {
      return this.rawRelateIdProp || this.getRawRelateId();
    },
    wrapHeight() {
      return this.wrapHeightProp || this.getWrapHeight().height;
    },
    leftBtnRegularOptions() {
      const leftBtnRegularOptions = {
        elRowAttrs: { gutter: 10, type: "flex", align: "middle", justify: "start" },
        formItem: [],
        style: "padding-left: 5px"
      };
      this.btnRegularOptions?.[0].formItem?.map(item => {
        if (item?.extraOption?.btnPosition !== "right") {
          console.log("78787878", item);

          leftBtnRegularOptions.formItem.push(item);
        }
      });
      return [leftBtnRegularOptions];
    },
    rightBtnRegularOptions() {
      const rightBtnRegularOptions = {
        elRowAttrs: { gutter: 10, type: "flex", align: "middle", justify: "start" },
        formItem: [],
        style: "padding-left: 5px"
      };
      this.btnRegularOptions?.[0].formItem?.map(item => {
        if (item?.extraOption?.btnPosition === "right") {
          rightBtnRegularOptions.formItem.push(item);
        }
      });
      return [rightBtnRegularOptions];
    }
  },
  inject: {
    getPrintTemplateInfo: {
      default: () => () => {
        console.warn("inject缺失getPrintTemplateInfo!");
      }
    },
    openFlow: {
      default: () => () => {
        console.warn("inject缺失openFlow!");
      }
    },
    importFileComp: {
      default: () => {}
    },
    importRefreshComp: {
      default: () => {}
    },
    queryFlowDef: {
      default: () => () => {
        console.warn("inject缺失queryFlowDef!");
      }
    },
    componentList: {
      default: () => []
    },
    enterpriseId: {
      default: () => ""
    },
    getPrjInfo: {
      default: () => () => {
        console.warn("inject缺失getPrjInfo!");
      }
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
    userInfo: {
      default: () => {}
    },
    generalRequest: {
      default: () => () => {
        console.warn("inject缺失generalRequest!");
      }
    },
    requestTableData: {
      default: () => () => {
        console.warn("inject缺失requestTableData!");
      }
    },
    requestTablePaginationData: {
      default: () => () => {
        console.warn("inject缺失requestTablePaginationData!");
      }
    },
    requestTableConfig: {
      default: () => () => {
        console.warn("inject缺失requestTableConfig!");
      }
    },
    requestDownload: {
      default: () => () => {
        console.warn("inject缺失requestDownload!");
      }
    },
    requestBatchDel: {
      default: () => () => {
        console.warn("inject缺失requestBatchDel!");
      }
    },
    requestBatchFlowDoc: {
      default: () => () => {
        console.warn("inject缺失requestBatchFlowDoc!");
      }
    },
    requestBatchQrDoc: {
      default: () => () => {
        console.warn("inject缺失requestBatchQrDoc!");
      }
    },
    checkPermission: {
      default: () => () => {
        console.warn("inject缺失checkPermission!");
      }
    },
    getListPageId: {
      default: () => () => {
        console.warn("inject缺失getListPageId!");
      }
    },
    getRawRelateId: {
      default: () => () => {
        console.warn("inject缺失getRawRelateId!");
      }
    },
    getWrapHeight: {
      default: () => () => {
        console.warn("inject缺失getWrapHeight!");
        return {
          height: 0
        };
      }
    },
    renderMode: {
      default: () => {
        return "";
      }
    },
    downloadFile: {
      default: () => () => {
        console.warn("inject缺失downloadFile!");
      }
    },
    downloadUrltoken: {
      default: () => () => {
        console.warn("inject缺失downloadUrltoken!");
      }
    },
    getToken: {
      default: () => () => {
        console.warn("inject缺失getToken!");
      }
    },
    filePreviewV1: {
      default: () => () => {
        console.warn("inject缺失filePreviewV1!");
      }
    },
    // 这个是自由布局
    getWidgetByFreeLayout: {
      default: () => () => {
        return {};
      }
    },
    // 这个是自由布局
    eventBus: {
      default: () => {
        return {};
      }
    },
    // 下面是和vform结合相关的
    getWidget: {
      default: () => () => {
        return {};
      }
    },

    globalModel: {
      default: () => {
        console.warn("inject缺失globalModel！如果不是作为vform组件状态请忽略");
        return {};
      }
    },
    extraData: {
      default: () => {
        console.warn("inject缺失extraData！如果不是作为vform组件状态请忽略");
        return {};
      }
    },
    getDlgConfig: {
      default: () => {
        console.warn("inject缺失getDlgConfig！如果不是作为vform组件状态请忽略");
        return () => {};
      }
    },
    getPrimaryKeyValue: {
      default: () => {
        console.warn("inject缺失getPrimaryKeyValue！如果不是作为vform组件状态请忽略");
        return () => {};
      }
    },
    requestBatchDelByVformWidget: {
      default: () => () => {}
    }
  },

  provide() {
    return {
      getTableRenderInstance: () => this.expose_CompleteTableInstance(),
      emitBtnClick: this.emitBtnClick,
      getWrapHeight: () => {
        return {
          height: 0
        };
      }
    };
  },

  watch: {
    finalTableData(val = []) {
      try {
        this.tableDataChangeQueue.map(fn => fn(val));
      } catch (error) {
        console.error("tableDataChangeQueue 执行失败！错误信息：", error);
      }
    },
    dynamicExternalParams(val = {}) {
      try {
        if (this.tableDisbaledStatus) {
          // 判断是否为对象（非数组）且含多个 key
          const isValidObject = val && typeof val === "object" && !Array.isArray(val) && Object.keys(val).length > 1;
          if (isValidObject) {
            this.tableDisbaled = false;
            this.setDisabledBtnsByTableDisbaled(null, false);
          } else {
            this.tableDisbaled = true;
            this.setDisabledBtnsByTableDisbaled(null, true);
          }
        }
      } catch (error) {
        console.error("dynamicExternalParams watch 执行失败！错误信息：", error);
      }
    }
  },
  created() {
    this.initTableAttrs();
  },
  mounted() {
    // this.init()
  },

  errorCaptured(err) {
    // 看着心烦，直接屏蔽，elform计算label值得时候得问题，在beforeDestroy周期里，不影响功能
    if (err.message === "[ElementForm]unpected width ") return false;
    else return true;
  },

  methods: {
    // 外部使用的设置搜索表单方法
    async expose_setSearchForm(data, multiFieldSearch) {
      if (Object.prototype.toString.call(data) !== "[object Object]") {
        return console.warn("expose_setForm方法传入的参数必须是一个对象！");
      }
      this.searchForm = cloneDeep(this.rawSearchForm);
      this.multiFieldSearch = multiFieldSearch || "";
      this.page.pageNo = 1;
      Object.keys(this.searchForm).forEach(key => {
        // eslint-disable-next-line no-prototype-builtins
        if (data.hasOwnProperty(key)) {
          this.searchForm[key] = data[key];
        }
      });
      await this.queryTableData();
    },
    // 持久化的外部参数存储, data 直接融入externalParams后面不可变， dynamicData可变
    async expose_refreshData(data = {}, dynamicData = {}) {
      if (data && typeof data === "object" && Object.keys(data).length > 0) {
        this.externalParams = {
          ...this.externalParams,
          ...data
        };
      }
      this.dynamicExternalParams = dynamicData || {};
      await this.queryTableData();
    },
    // 改变按钮状态
    async expose_enableAllBtn() {
      this.btnRegularOptions[0]?.formItem?.forEach(item => {
        item.tagAttrs.disabled = false;
      });
    },
    expose_CompleteTableInstance() {
      return this;
    },

    expose_setTableData(data) {
      // 如果当前作为vform组件且处于本地模式，则要重新计算deletelogid
      if (this.isVformWidget && this.localProcessData) {
        const oldDataIdList = this.tableData.map(item => item[this.keyField]).filter(v => v);
        const newDataIdList = data.map(item => item[this.keyField]).filter(v => v);
        const delIdList = oldDataIdList.filter(id => !newDataIdList.includes(id));
        this.logDeletedData(delIdList, newDataIdList);
      }
      this.tableData = data;
      this.updateTotalCount();
    },

    expose_getTableData() {
      return this.tableData;
    },

    expose_showDialog() {
      this.btnRelateDialogVisible = true;
    },

    expose_hideDialog() {
      this.btnRelateDialogVisible = false;
      this.resetBtnConfigs();
    },

    expose_setTableDisbaled(bool) {
      this.tableDisbaled = bool;
    },

    async expose_preview(data) {
      this.previewMode = true;
      if (data) {
        this.parseTableConfig(data);
      } else {
        await this.queryTableConfig();
      }
      const tableSingleData = {};
      this.composeData(tableSingleData);
      this.tableData = [tableSingleData];
    },

    initTableAttrs() {
      this.tableAttrs = getTableAttrs();
      this.tableAttrs.summaryMethod = getSummaries;
    },

    resetBtnConfigs() {
      this.btnConfigs = new BtnConfigs();
    },

    async batchDownload(fileInfoList) {
      if (fileInfoList?.length) {
        const urls = fileInfoList.map(item => {
          return this.downloadUrltoken(item.prjId, item.fileId, item.fileVersion);
        });
        for (let i = 0; i < urls.length; i++) {
          this.downloadFile(urls[i]);
        }
      }
    },

    // 保存表单
    async onSubmit(data) {
      this.$emit("onSubmit", data);
      this.btnConfigs.isRefresh && this.queryTableData();
      this.expose_hideDialog();
    },

    // 导入列表数据
    async onSubmitToTable(data) {
      console.log(data);
      const { columnMappingList, dataList } = data;
      const finalData = [];
      dataList.map((data, index) => {
        if (index === 0) return;
        const obj = {};
        for (const [key, value] of Object.entries(data)) {
          const fieldName = columnMappingList.find(columnMapping => columnMapping.key === key)?.metaFieldName;
          obj[fieldName] = value;
        }
        finalData.push(obj);
      });
      console.log(finalData);
      this.tableData.unshift(...finalData);
      this.syncFormDataByVformWidget();
    },

    async init(isPreview, json, { externalParams = {}, dynamicExternalParams = {} }, externalTriggerQueryTableData, tableDisbaled) {
      this.resetAllData();
      await this.$nextTick();
      this.previewMode = !!isPreview;
      this.tableDisbaledStatus = this.tableDisbaled = !!tableDisbaled;
      if (!json || isEmpty(json)) {
        await this.queryTableConfig();
      } else {
        this.parseTableConfig(json);
        await this.$nextTick();
      }
      if (isPreview) {
        const tableSingleData = {};
        this.composeData(tableSingleData);
        this.tableData = [];
        for (let index = 0; index < 10; index++) {
          this.tableData.push(tableSingleData);
        }
      } else {
        this.composeData();
        if (this.tableAttrs.onInitEvent) {
          str2Fn(this.tableAttrs.onInitEvent).call(this);
        }
        try {
          // 有些参数通过sessionStorage传递
          var jumpParams = JSON.parse(sessionStorage.getItem("lowcodeTableThisPageJumpParams"));
          // 只接受对象参数
          var isObj = Object.prototype.toString.call(jumpParams) === "[object Object]";
          sessionStorage.removeItem("lowcodeTableThisPageJumpParams");
        } catch (error) {
          console.error(error);
        }
        let finalExternalParams = {};
        if (externalParams && isObj) {
          finalExternalParams = { ...externalParams, ...jumpParams };
        } else if (externalParams) {
          finalExternalParams = externalParams;
        } else if (isObj) {
          finalExternalParams = isObj;
        }
        if (dynamicExternalParams) {
          this.dynamicExternalParams = dynamicExternalParams;
        }
        if (!externalTriggerQueryTableData) {
          this.refreshData(finalExternalParams);
        } else {
          this.externalParams = finalExternalParams;
        }
      }
      setTimeout(() => {
        try {
          this.headerHeight =
            parseFloat(window.getComputedStyle(this.$refs.elHeader.$el).height) +
            (this.showSearchFrom ? parseFloat(window.getComputedStyle(this.$refs.elHeaderSearchFrom.$el).height) + 20 : 0);
          console.log(this.headerHeight, " this.headerHeight");
        } catch (error) {
          console.error("获取低代码table header高度报错，报错信息：", error);
        }
      }, 300);
    },

    // 清空数据
    resetAllData() {
      const data = new InstanceData();
      for (const [key, value] of Object.entries(data)) {
        this[key] = value;
      }
      this.initTableAttrs();
    },

    setSingleTableOptions(item, emptyData) {
      // 处理前合并一下最新的配置
      const rawRowData = getSingleTableData();
      item = {
        ...rawRowData,
        ...item
      };
      console.log(item);
      const obj = {};
      obj.prop = item.fieldCode;
      emptyData && setEmptyTableData(emptyData, item.fieldCode);
      obj.label = item.fieldName;
      if (item.isCustom) {
        obj.isCustom = item.isCustom;
        obj.prop = item.random;
      }
      obj.align = align.find(alignitem => alignitem.id === item.align).value;
      obj["min-width"] = item.columnWidth;
      obj.sortable = !!item.sort;
      obj["show-overflow-tooltip"] = item["show-overflow-tooltip"];
      if (item.fixed) obj.fixed = item.fixed;
      if (item.filters) {
        obj.filters = str2obj(item.filters);
      } else if (item?.filtersConfig?.customHandler) {
        const getFiltersFn = str2Fn(item.filtersConfig.customHandler);
        obj.filters = [];
        this.tableDataChangeQueue.push(tableData => {
          obj.filters = getFiltersFn(tableData);
        });
      } else if (item?.filtersConfig?.isFilter) {
        obj.filters = [];
        const getFiltersFn = tableData => {
          const filters = [];
          tableData.map(tableDataItem => {
            if (item.filtersConfig.isSplit) {
              const arr = (tableDataItem[obj.prop]?.split(item.filtersConfig.splitChar) || []).filter(v => v);
              arr.map(arrVal => {
                const filter = { text: item.filtersConfig.limitShowWord ? limitShowWord(arrVal, item.filtersConfig.maxlength) : arrVal, value: arrVal };
                if (filter.value && !filters.some(filtersItem => filtersItem.value === filter.value)) {
                  filters.push(filter);
                }
              });
            } else {
              const filter = {
                text: item.filtersConfig.limitShowWord ? limitShowWord(tableDataItem[obj.prop], item.filtersConfig.maxlength) : tableDataItem[obj.prop],
                value: tableDataItem[obj.prop]
              };
              if (filter.value && !filters.some(filtersItem => filtersItem.value === filter.value)) {
                filters.push(filter);
              }
            }
          });
          obj.filters = filters;
        };
        this.tableDataChangeQueue.push(getFiltersFn);
      }

      if (item.contentTextAttrArr) obj.contentTextAttrArr = item.contentTextAttrArr;

      // 某些函数转换
      const fnProps = ["sort-method", "formatter", "renderHeader"];
      if (obj.filters) {
        fnProps.push("filter-method");
      }
      fnProps.map(prop => {
        if (item[prop]) {
          obj[prop] = str2Fn(item[prop]);
        }
      });

      if (item.children) {
        obj.children = item.children.map(item => this.setSingleTableOptions(item, emptyData));
      }
      return obj;
    },

    composeData(emptyData) {
      this.formOptions = this.composeFromOptions(this.tableConfigJSON);
      this.filterField = [];
      this.tableOptions = this.tableConfigJSON
        .filter(item => item.show)
        .map(item => {
          const obj = this.setSingleTableOptions(item, emptyData);
          this.filterField.push(obj.prop);
          return obj;
        });

      this.panelData = this.tableOptions.map(item => {
        return {
          key: item.prop,
          label: item.label
        };
      });

      if (this.tableAttrs.isShowIndex) {
        const obj = {
          type: "index",
          width: "50",
          label: "序号",
          align: "center"
        };

        const existFixedLeft = this.tableOptions.some(item => item?.fixed === "left");
        // 如果已有固定在左边的列，则序号列自动固定在左边
        if (existFixedLeft) {
          obj.fixed = "left";
        }
        if (this.tableAttrs.index) {
          obj.index = this.tableAttrs.index;
        }
        this.tableOptions.unshift(obj);
      }
      if (this.tableAttrs.isShowCheckbox) {
        this.tableOptions.unshift({
          type: "selection",
          width: "46",
          align: "center"
        });
      }
    },

    // 由数据组成searchFrom
    setFromField(source, fieldCode, formOptions, searchWidgetName) {
      this.$set(source, fieldCode, getWidgetDefaultVal(formOptions, searchWidgetName));
    },

    // 设置searchFrom和装配fromOptions
    composeFromOptions(tableData) {
      this.showSearchFrom = false;
      if (!tableData || !tableData.length) return [];
      const { setFromField } = this;
      let formOptions = [];
      const length = tableData.length;
      tableData.map((item, index) => {
        const searchWidgetName = searchWidget.find(widgetitem => widgetitem.id === item.searchWidget)?.tagName;
        // 只有搜索控件有值且开启了搜索项，才会添加到options中
        if (searchWidgetName && item.isSearchWidget) {
          // this.$set(this.searchForm, item.fieldCode, '');
          setFromField(this.searchForm, item.fieldCode, item.searchWidgetConfig, searchWidgetName);
          const options = getWidgetOptions(searchWidgetName, item);
          const finalOptions = merge(options, depthFirstSearchWithRecursive(item.searchWidgetConfig));
          // 添加搜索表单得change事件，用以触发更新列表
          if (finalOptions.listeners) {
            const fn = finalOptions.listeners.change;
            const changeFn = (...argus) => {
              this.handleFilter(...argus);
              fn && fn.call(this, ...argus);
            };
            changeFn.isWrap = true;
            finalOptions.listeners.change = changeFn;
          } else {
            const changeFn = (...argus) => {
              this.handleFilter(...argus);
            };
            changeFn.isWrap = true;
            finalOptions.listeners = {
              change: changeFn
            };
          }
          formOptions.push(finalOptions);
        }
        // 如果循环到最后一个且存在其他筛选项，则对formOptions通过sortNumb进行排序，复制一份最原始的form,添加筛选和重置按钮
        if (length - 1 === index && formOptions.length) {
          this.rawSearchForm = cloneDeep(this.searchForm);
          formOptions = formOptions.sort((a, b) => a.sortNumb - b.sortNumb);
          // formOptions.push(...this.getBtnConfig());
          this.showSearchFrom = true;
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

    handleFilter() {
      if (this.previewMode || this.tableDisbaled) return;
      this.page.pageNo = 1;
      if (this.localProcessData) {
        this.multiFieldSearchCopy = this.multiFieldSearch;
      } else {
        this.queryTableData();
      }
    },

    handleFilterReset() {
      if (this.previewMode || this.tableDisbaled) return;
      if (this.tableAttrs.onResetBtnEvent) {
        str2Fn(this.tableAttrs.onResetBtnEvent).call(this, cloneDeep);
      } else {
        this.handleReset();
      }
    },

    handleNativeFilter(e) {
      if (this.previewMode || this.tableDisbaled) return;
      const keyCode = window.event ? e.keyCode : e.which;
      console.log(keyCode);
      if (keyCode === 13) {
        this.page.pageNo = 1;
        if (this.localProcessData) {
          this.multiFieldSearchCopy = this.multiFieldSearch;
        } else {
          this.queryTableData();
        }
      }
    },

    handleReset() {
      this.searchForm = cloneDeep(this.rawSearchForm);
      this.multiFieldSearch = "";
      this.page.pageNo = 1;
      this.queryTableData();
    },

    onSave(row) {
      // 推出编辑清空状态
      row.$edit = false;
      // this.$refs.table.expose_clearCurCellPro();
    },

    rowClick(val) {
      this.$emit("rowClick", val);
      console.log(val);
    },

    selectListHandler(val) {
      this.$emit("selectListHandler", val);
      this.eventBus?.$emit?.(`${this.getWidgetByFreeLayout()?.id}.selectionChange`, val);
      console.log(val);
      this.selectList = val;
    },

    handleCurrentChange(val) {
      console.log(val, this.page);
      this.queryTableData();
    },

    handleSizeChange(val) {
      console.log(val, this.page);
      this.queryTableData();
    },

    // 持久化的外部参数存储
    refreshData(data) {
      this.externalParams = {
        ...this.externalParams,
        ...data
      };
      this.queryTableData();
    },

    refresh() {
      this.queryTableData();
    },

    async iconRefresh() {
      if (this.tableDisbaled) return;
      await this.queryTableData();
      this.$success("刷新成功");
    },

    // 获取列表数据接口参数
    getParams(data = {}) {
      const extraParams = {};
      if (this.formOptions?.length) {
        const formItem = this.formOptions[0].formItem;
        formItem.map(item => {
          // 此处要处理两个字段使用同一input的模糊搜索
          const {
            // relateOtherField = [],
            formField = "",
            searchWidgetType
          } = item;
          // if (searchWidgetType === 0 && relateOtherField.length) {
          //   relateOtherField.map((fieldName) => {
          //     extraParams[fieldName] = this.searchForm[formField];
          //   });
          // }
          // 此处要处理日期选择框数组形式后端不识别，改为字段名加end和start
          if (searchWidgetType === 4 && this.searchForm[formField]?.length === 2) {
            extraParams[`${formField}Start`] = this.searchForm[formField][0] || "";
            extraParams[`${formField}End`] = this.searchForm[formField][1] || "";
          }
        });
      }
      return {
        prjId: this?.getPrjInfo?.()?.prjId,
        ...data,
        ...this.searchForm,
        ...extraParams,
        multiFieldSearch: this.multiFieldSearch,
        enterpriseId: this.enterpriseId,
        ...this.externalParams,
        ...this.dynamicExternalParams
      };
    },
    async tableDataLoad(tree, treeNode, resolve) {
      console.log(tree, treeNode);
      const data = await this.queryTableData({ [this.tableAttrs.deliveryLoadFnField]: tree[this.tableAttrs.deliveryLoadFnField] }, true);
      resolve(data);
    },

    // data为外界组件执行某些行为触发更新的参数(一次性参数，不会存储，如果点击分页就会消失，持久化的外部参数存储请使用refreshData方法)
    queryTableData(data = {}, isReturn) {
      const params = this.getParams(data);
      // 如果当前不是项目下路由，把prjId删掉
      if (!this.isProjectRoute) {
        delete params.prjId;
      }
      const { isTree, dataTransitionFn, dataTransitionParentField, dataTransitionCurField, showPagination, onBeforeQueryDataEvent, onAfterQueryDataEvent } = this.tableAttrs;
      if (onBeforeQueryDataEvent) {
        const isContinue = str2Fn(onBeforeQueryDataEvent).call(this, params);
        if (isContinue === false) return;
      }
      return (showPagination ? this.requestTablePaginationData(params, this.page, this.listPageId) : this.requestTableData(params, this.listPageId))
        .then(res => {
          if (res.result === "0") {
            if (onAfterQueryDataEvent) {
              str2Fn(onAfterQueryDataEvent).call(this, params, res.data);
            }
            if (isReturn) {
              return res.data;
            } else {
              if (isTree) {
                if (dataTransitionFn) {
                  try {
                    this.tableData = dataTransitionFn(res.data);
                  } catch (error) {
                    console.error(error);
                    this.tableData = res.data;
                  }
                } else if (dataTransitionParentField && dataTransitionCurField) {
                  try {
                    this.tableData = arrayToTree(res.data, dataTransitionCurField, dataTransitionParentField);
                  } catch (error) {
                    this.tableData = res.data;
                    console.error(`queryTableData arrayToTree error: ${error}`);
                  }
                } else {
                  console.warn("当前tableData配置了树结构，但是同时缺失数据转换函数和转换字段！");
                  this.tableData = res.data;
                }
              } else {
                this.tableData = res.data;
              }
              if (showPagination) {
                this.page.totalCount = res.totalCount;
              }
            }
            // 低代码列表页面，相互切换时，最下面的合计有时展示不出来，需要重新调用此方法
            if (this.attrs.showSummary) {
              setTimeout(() => {
                this.$refs.table.$refs.elTable?.doLayout?.();
              }, 100);
            }
          } else {
            console.error(`queryTableData message: ${res.message}`);
          }
        })
        .catch(e => {
          console.error(`queryTableData error: ${e}`);
          throw new Error(e);
        });
    },

    parseTableConfig(data) {
      const { tableOptions, formOptions, keyField, tableAttrs, fuzzyFieldSearchConfig } = data;
      this.tableAttrs = setTableAttrs(merge({}, this.tableAttrs, tableAttrs), this);
      this.page.pageSize = this.tableAttrs.paginationSize;
      if (formOptions?.length) {
        this.btnRegularOptions = this.composeBtnRegularOptions(cloneDeep(formOptions));
      } else {
        this.showBtns = false;
      }
      this.tableConfigJSON = tableOptions;
      this.keyField = keyField;
      this.fuzzyFieldSearchConfig = fuzzyFieldSearchConfig;
    },

    queryTableConfig() {
      return this.requestTableConfig(this.listPageId)
        .then(res => {
          if (res.result === "0") {
            const data = JSON.parse(res.data);
            this.parseTableConfig(data);
          } else {
            console.error(`queryTableConfig message: ${res}`);
          }
        })
        .catch(e => {
          console.error(`queryTableConfig error: ${e}`);
        });
    },

    // 构成按钮设计区的options
    composeBtnRegularOptions(config) {
      if (this.previewMode) {
        this.disabledBtnsByPreviewStatus(config);
      }
      if (this.tableDisbaled) {
        this.setDisabledBtnsByTableDisbaled(config, true);
      }
      // 处理隐藏按钮逻辑，转为css配置
      config.map(btn => {
        if (btn.extraOption.isHidden) {
          btn.style += ";display: none;";
        }
      });
      this.showBtns = true;

      if (this.isVformWidget) {
        config = this.filterBtnsByVfromWidgetOptions(config);
      } else if (this.isFreeLayoutWidget) {
        // 自由布局暂时不做筛选
        // config = this.filterBtnsByFreeLayuotPermission(config);
      } else {
        config = this.filterBtnsByPermission(config);
      }
      if (config.length === 0) this.showBtns = false;

      return [
        {
          elRowAttrs: {
            gutter: 10,
            type: "flex",
            align: "middle",
            justify: "start"
          },
          style: "padding-left: 5px",
          formItem: config
        }
      ];
    },

    disabledBtnsByPreviewStatus(config) {
      config.map(item => {
        if (item.tagAttrs) {
          item.tagAttrs.disabled = !["add", "edit", "check"].includes(item.extraOption.btnType);
        } else {
          item.tagAttrs = {
            disabled: !["add", "edit", "check"].includes(item.extraOption.btnType)
          };
        }
      });
    },

    setDisabledBtnsByTableDisbaled(config, bool) {
      if (!config) {
        config = this.btnRegularOptions[0]?.formItem;
      }
      config.map(item => {
        if (item.tagAttrs) {
          item.tagAttrs.disabled = bool;
        } else {
          item.tagAttrs = {
            disabled: bool
          };
        }
      });
    },

    // 根据授权筛选按钮
    filterBtnsByPermission(config) {
      // 根据权限筛选
      // 兼容通过弹窗展示的列表，此时rawlistPageId为notVerify，不进行权限校验
      if (!this.previewMode && this.rawRelateId && this.rawRelateId !== "notVerify") {
        return config.filter(item => {
          return this.checkPermission(`${this.rawRelateId}:${item.btnId}:${item.authorize}`) || item.authorize === "defaultShow";
        });
      }
      return config;
    },

    // 在作为vform组件时，进行不同状态下按钮的显示筛选
    filterBtnsByVfromWidgetOptions(config) {
      if (this.previewMode) return config;
      let showBtnList = [];
      const key = this.getDlgConfig()?.btnType;
      switch (key) {
        case "add":
          showBtnList = this.getWidget()?.options?.addBtnShowList;
          break;
        case "edit":
          showBtnList = this.getWidget()?.options?.editBtnShowList;
          break;
        case "check":
          showBtnList = this.getWidget()?.options?.checkBtnShowList;
          break;
      }
      console.log(showBtnList, "showBtnList", config);
      let btnList;
      // 如果是受控模式，在查看状态下，只能展示查看按钮
      if (this.localProcessData && key === "check") {
        btnList = config.filter(btnItem => showBtnList.some(btnId => btnId === btnItem.btnId && btnItem.extraOption.btnType === "check"));
      } else {
        btnList = config.filter(btnItem => showBtnList.some(btnId => btnId === btnItem.btnId));
      }
      // if (this.showBtns && this.getWidget()?.options?.disabled) {
      //   console.log("this.disabled", this.getWidget()?.options?.disabled);
      //   btnList.map(item => {
      //     item.tagAttrs.disabled = true;
      //   });
      // }
      return btnList;
    },

    filterBtnsByFreeLayuotPermission(config) {
      // 根据权限筛选
      // 兼容通过弹窗展示的列表，此时rawlistPageId为notVerify，不进行权限校验
      if (!this.previewMode && this.rawRelateId && this.rawRelateId !== "notVerify") {
        return config.filter(item => {
          // 这里要进行三层复合校验
          return this.checkPermission(`${this.rawRelateId}:${this.getWidgetByFreeLayout()?.options.id}:${item.btnId}:${item.authorize}`) || item.authorize === "defaultShow";
        });
      }
      return config;
    },

    validateSelectList({ paramName, paramType, deliverySelectList, deliverySelectListFields, validate }, row) {
      this.btnConfigs.deliverySelectList = deliverySelectList;
      if (deliverySelectList) {
        this.btnConfigs.btnDisposeParamsRule = {
          paramName,
          paramType,
          deliverySelectListFields
        };
        if (validate.includes(0) && this.checkNoSelection() && !row) {
          this.$warn("请至少勾选一条要处理的数据");
          return false;
        }
        if (validate.includes(1) && !this.checkOnlyOneSelected() && !row) {
          this.$warn("当前操作只允许勾选一条数据");
          return false;
        }
      }
      return true;
    },

    // 处理按钮点击事件
    async handleBtnClick(
      {
        relateFrom = "",
        relateMeta = "",
        relateComponent = "",
        relateTable = "",
        openType = "",
        openUrl = "",
        fn = "",
        isRefresh = false,
        btnType = "",
        dialogTitle = "",
        dialogHeight = "",
        closeOnPressEscape = false,
        dialogWidth = "",
        flowKey = "",
        paramName = "",
        paramType = 0,
        deliverySelectList = false,
        deliverySelectListFields = [],
        validate = [],
        requestUrl = "",
        requestType = "post",
        requestBeforeConfirmHint = false,
        requestBeforeConfirmText = "",
        requestParamsConfig = {},
        useDialog = true,
        showFooter = false,
        validateFn = "",
        command = "",
        btnId,
        authorize
      },
      rowData
    ) {
      const {
        validateSelectList,
        disposeFlowEvent,
        disposeRelateCompEvent,
        disposeDynamicFormEvent,
        disposeDynamicTableEvent,
        disposeRequestEvent,
        disposeThisPageJump,
        disposeDown,
        disposeFlowDocDown,
        disposeFormDown,
        disposeDel,
        previewMode,
        tableDisbaled
      } = this;
      if (previewMode || tableDisbaled) return;
      this.editRow = null;
      this.externalParamsFormRow = null;
      // 只btnConfigs.要执行点击按钮操作，先置空formid
      this.btnConfigs = new BtnConfigs();
      this.btnConfigs.requestUrl = requestUrl;
      this.btnConfigs.requestType = requestType;
      this.btnConfigs.requestFixedParams = requestParamsConfig;
      this.btnConfigs.requestBeforeConfirmHint = requestBeforeConfirmHint;
      this.btnConfigs.requestBeforeConfirmText = requestBeforeConfirmText;
      this.btnConfigs.isRefresh = isRefresh;
      this.btnConfigs.btnType = btnType;
      this.btnConfigs.btnId = btnId;
      this.btnConfigs.authorize = authorize;
      this.btnConfigs.openType = openType;
      this.btnConfigs.dialogHeight = dialogHeight;
      this.btnConfigs.dialogWidth = dialogWidth;
      this.btnConfigs.closeOnPressEscape = closeOnPressEscape;
      await this.$nextTick();
      // 执行任何操作之前都先进行校验
      if (!validateFn || (validateFn && (await Promise.resolve(str2Fn(validateFn).call(this, this.selectList))))) {
        // 如果有自定义事件，则执行自定义事件
        if (fn) {
          str2Fn(fn).call(this, rowData);
        } else {
          if (openType === -1) {
            // openType为-1是固定行为，如下载 批量删除等
            switch (btnType) {
              case "download":
                disposeDown(
                  {
                    command
                  },
                  rowData
                );
                break;
              case "flowDocDownload":
                disposeFlowDocDown(
                  {
                    command
                  },
                  rowData
                );
                break;
              case "formDownload":
                disposeFormDown(
                  {
                    command
                  },
                  rowData
                );
                break;
              case "batchDel":
                disposeDel(rowData);
                break;
              case "import":
                // 处理导入
                this.dealImport(relateMeta);
                break;
              case "importRefresh":
                // 处理导入
                this.dealImportRefresh({ requestBeforeConfirmHint, requestBeforeConfirmText });
                break;
              case "refresh":
                // 处理刷新
                this.refresh();
                break;
              case "qrCode":
                // 处理二维码下载
                this.dealQrDownload(
                  {
                    command
                  },
                  rowData
                );
                break;
              default:
                break;
            }
          } else if (openType === 1) {
            // openType为1是当前页面跳转
            if (
              validateSelectList(
                {
                  paramName,
                  paramType,
                  deliverySelectListFields,
                  deliverySelectList,
                  validate
                },
                rowData
              )
            ) {
              disposeThisPageJump({ openUrl, deliverySelectList, deliverySelectListFields }, rowData);
            }
          } else if (openType === 3) {
            if (
              validateSelectList(
                {
                  paramName,
                  paramType,
                  deliverySelectList,
                  deliverySelectListFields,
                  validate
                },
                rowData
              )
            ) {
              // openType为3是新窗口打开;
              const isAbsoluteUrl = url => {
                try {
                  new URL(url);
                  return true;
                } catch {
                  return false;
                }
              };
              const externalParams = this.formatSelectListParams({ deliverySelectList, deliverySelectListFields }, rowData, "useJoin");
              // 构造目标URL（保持原有逻辑）
              let targetUrl = isAbsoluteUrl(openUrl) ? openUrl : `${window.location.origin}${openUrl.startsWith("/") ? "" : "/"}${openUrl}`;
              // 附加参数到所有场景的URL
              targetUrl = appendParamsToUrl(targetUrl, externalParams);
              window.open(targetUrl, "_blank");
            }
          } else if (openType === 4) {
            // openType为4是打开本地关联代码
            if (
              validateSelectList(
                {
                  paramName,
                  paramType,
                  deliverySelectList,
                  deliverySelectListFields,
                  validate
                },
                rowData
              )
            ) {
              disposeRelateCompEvent(
                {
                  relateComponent,
                  useDialog,
                  showFooter,
                  dialogTitle
                },
                rowData
              );
            }
          } else if (openType === 5) {
            // openType为5是直接调用接口
            if (
              validateSelectList(
                {
                  paramName,
                  paramType,
                  deliverySelectList,
                  deliverySelectListFields,
                  validate
                },
                rowData
              )
            ) {
              disposeRequestEvent(
                {
                  requestBeforeConfirmHint,
                  requestBeforeConfirmText
                },
                rowData
              );
            }
          } else if (openType === 2) {
            // openType为2是打开流程
            if (
              validateSelectList(
                {
                  paramName,
                  paramType,
                  deliverySelectList,
                  deliverySelectListFields,
                  validate
                },
                rowData
              )
            ) {
              disposeFlowEvent({ flowKey, btnType, isRefresh, deliverySelectList }, rowData);
            }
          } else if (openType === 0) {
            // openType为0是打开表单
            if (
              validateSelectList(
                {
                  paramName,
                  paramType,
                  deliverySelectList,
                  deliverySelectListFields,
                  validate
                },
                rowData
              )
            ) {
              disposeDynamicFormEvent(
                {
                  btnType,
                  relateFrom,
                  dialogTitle,
                  deliverySelectList,
                  deliverySelectListFields
                },
                rowData
              );
            }
          } else if (openType === 6) {
            // openType为0是打开列表
            if (
              validateSelectList(
                {
                  paramName,
                  paramType,
                  deliverySelectList,
                  deliverySelectListFields,
                  validate
                },
                rowData
              )
            ) {
              disposeDynamicTableEvent(
                {
                  btnType,
                  relateTable,
                  dialogTitle,
                  deliverySelectList,
                  deliverySelectListFields
                },
                rowData
              );
            }
          }
        }
      }
    },

    disposeRelateCompEvent({ relateComponent, useDialog, showFooter, dialogTitle }, row) {
      if (!useDialog) {
        setTimeout(() => {
          try {
            this.$refs.relateComponent.expose_showDialog(row);
          } catch (error) {
            console.warn("调用本地组件的expose_showDialog方法错误", error);
          }
        }, 100);
      } else {
        this.expose_showDialog();
      }
      this.btnConfigs.relateComponent = this.componentList.find(item => item.id === relateComponent)?.component;
      this.btnConfigs.useDialog = useDialog;
      this.btnConfigs.showFooter = showFooter;
      this.btnConfigs.dialogTitle = dialogTitle || "新增";
    },

    async disposeFlowEvent({ flowKey, btnType, isRefresh, deliverySelectList }, row) {
      const {
        btnConfigs: { dialogHeight, dialogWidth }
      } = this;
      const mainFieldValue = (row || this.getFirstSelectedData())?.[this.keyField];
      if (btnType === "check") {
        const res = await this.generalRequest(`/flow/business/${mainFieldValue}`, "get");
        const params = {
          ...res.data,
          dialogHeight,
          dialogWidth,
          approveType: "view",
          enterpriseId: this.enterpriseId
        };
        if (deliverySelectList) {
          params.sourceData = { mainFieldValue };
        }
        this.openFlow(params);
      } else {
        const res = await this.queryFlowDef("", "", flowKey);
        const flowInfo = res.data;
        flowInfo.name = flowInfo.groupName;
        flowInfo.id = flowInfo.flowDefinitionId;
        flowInfo.dialogHeight = dialogHeight;
        flowInfo.dialogWidth = dialogWidth;
        flowInfo.approveType = "add";
        flowInfo.enterpriseId = this.enterpriseId;
        if (deliverySelectList) {
          flowInfo.sourceData = { mainFieldValue };
          flowInfo.dataFromList = {
            selectList: this.selectList,
            keyFieldName: this.keyField
          };
        }
        // 发起流程
        if (flowInfo.startMode === "stdNew") {
          const routeUrl = this.$router.resolve({
            path: "/examine-new",
            query: flowInfo
          });
          window.open(routeUrl.href, "_blank");
        } else {
          await this.openFlow(flowInfo);
          isRefresh && this.queryTableData();
        }
      }
    },

    disposeDynamicFormEvent({ btnType, relateFrom, dialogTitle, deliverySelectList, deliverySelectListFields }, rowData) {
      this.externalParamsFormRow = this.formatSelectListParams({ deliverySelectList, deliverySelectListFields }, rowData);
      switch (btnType) {
        case "add":
          this.expose_showDialog();
          this.btnConfigs.formId = relateFrom;
          this.onlyRead = false;
          this.primaryKeyValue = "";
          this.btnConfigs.dialogTitle = dialogTitle || "新增";
          break;
        case "check":
        case "edit":
          if (!this.localProcessData) {
            if (rowData) {
              this.primaryKeyValue = rowData[this.keyField];
            } else if (this.checkAnySelected()) {
              this.primaryKeyValue = this.getFirstSelectedData()?.[this.keyField];
            } else {
              return this.$warn("请至少勾选一条要处理的数据！");
            }
            if ([undefined, null].includes(this.primaryKeyValue)) {
              return this.$warn("主键字段未取到值，请检查数据或在列表设计页面重新关联主键！");
            }
          } else {
            if (!(rowData || this.getFirstSelectedData())) {
              return this.$warn("请至少勾选一条要处理的数据！");
            }
          }
          this.editRow = rowData || this.getFirstSelectedData();
          this.expose_showDialog();
          this.btnConfigs.formId = relateFrom;
          this.onlyRead = btnType === "check";
          this.btnConfigs.dialogTitle = dialogTitle || (btnType === "check" ? "查看" : "编辑");
          break;
        default:
          break;
      }
    },

    async disposeDynamicTableEvent({ btnType, relateTable, dialogTitle, deliverySelectList, deliverySelectListFields }, rowData) {
      const externalParams = this.formatSelectListParams({ deliverySelectList, deliverySelectListFields }, rowData, "useArray");
      this.expose_showDialog();
      this.btnConfigs.tableId = relateTable;
      this.onlyRead = true;
      this.btnConfigs.dialogTitle = dialogTitle || (btnType === "check" ? "查看" : "编辑");
      await this.$nextTick();
      this.$refs.nestedTable.init(false, null, { externalParams });
    },

    async disposeThisPageJump({ openUrl, deliverySelectList, deliverySelectListFields }, rowData) {
      const params = this.formatSelectListParams({ deliverySelectList, deliverySelectListFields }, rowData, "useArray");
      // 通过sessionStorage传递参数
      sessionStorage.setItem("lowcodeTableThisPageJumpParams", JSON.stringify(params));
      const res = await this.queryChangePrjId(this.listPageId, params[`${this.keyField}Array`][0]);
      console.log(res, "queryChangePrjId");
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

    getRequestConfig(row) {
      const {
        selectList,
        keyField,
        currentSelectedRow,
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
      console.log(finalData, "finalData");

      if (deliverySelectList) {
        let selectListId;
        if (row) {
          selectListId = [row[keyField]];
        } else {
          selectListId = this.getSelectedData().map(item => item[keyField]);
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

    async disposeRequestEvent({ requestBeforeConfirmHint, requestBeforeConfirmText }, rowData) {
      if (requestBeforeConfirmHint) {
        await this.$confirm(`${requestBeforeConfirmText}`);
      }
      const { finalUrl, finalType, finalData, headers: requestHeaders } = this.getRequestConfig(rowData);

      await this.generalRequest(finalUrl, finalType, finalData, requestHeaders);
      this.btnConfigs.isRefresh && this.queryTableData();
    },
    iconDisposeDown(command) {
      this.disposeDown({ command });
    },
    disposeDown({ command }, row) {
      let params = {
        prjId: this?.getPrjInfo?.()?.prjId,
        enterpriseId: this.enterpriseId
      };
      if (row) {
        params[this.keyField] = [row[this.keyField]];
      } else {
        console.log(command, "command");
        if ([undefined, null].includes(this.tableData[0][this.keyField])) {
          return this.$warn("主键字段未取到值，请检查数据或重新在列表设计页面重新关联主键！");
        }

        const selectList = this.getSelectedData();
        switch (command) {
          case "curSelect":
            if (!selectList.length) {
              return this.$warn("当前未选中任何数据，无法下载！");
            }
            params[this.keyField] = selectList.map(item => item[this.keyField]);
            break;
          case "curPage":
            if (!this.tableData.length) {
              return this.$warn("当前页面无数据，无法下载！");
            }
            params[this.keyField] = this.tableData.map(item => item[this.keyField]);
            break;
          case "all":
            params = this.getParams();
            break;
          default:
            break;
        }
      }
      this.download(params);
    },

    disposeFlowDocDown({ command }, row) {
      if (row) {
        this.requestBatchFlowDoc(command, [row[this.keyField]]);
      } else {
        const selectList = this.getSelectedData();
        if (selectList.length === 0) {
          return this.$warn("请至少勾选一条要处理的数据");
        }
        if ([undefined, null].includes(this.tableData[0][this.keyField])) {
          return this.$warn("主键字段未取到值，请检查数据或重新在列表设计页面重新关联主键！");
        }
        this.requestBatchFlowDoc(
          command,
          selectList.map(item => item[this.keyField])
        );
      }
    },

    async disposeFormDown({ command }, row) {
      if (row) {
        this.requestBatchFlowDoc(command, [row[this.keyField]]);
      } else {
        const selectList = this.getSelectedData();
        if (selectList.length === 0) {
          return this.$warn("请至少勾选一条要处理的数据");
        }
        if ([undefined, null].includes(this.tableData[0][this.keyField])) {
          return this.$warn("主键字段未取到值，请检查数据或重新在列表设计页面重新关联主键！");
        }
        const {
          data: { resultFileName, resultFileFormat }
        } = await this.getPrintTemplateInfo(this.listPageId, this.btnConfigs.btnId);
        this.$refs.printTemplateDlg.open({
          resultFileName,
          resultFileFormat
        });
        // this.requestBatchFlowDoc(
        //   command,
        //   this.selectList.map(item => item[this.keyField])
        // );
      }
    },

    async dealQrDownload({ command }, row) {
      let ids = [];
      const selectList = this.getSelectedData();
      if (command === "curPage") {
        command = "page";
        ids = this.tableData.map(item => item[this.keyField]);
      } else if (command === "curSelect") {
        command = "selected";
        ids = selectList.map(item => item[this.keyField]);
      }
      if (row) {
        this.requestBatchQrDoc({
          dataRange: command,
          ids: [row[this.keyField]],
          actionCode: `${this.rawRelateId.split("__")[0]}:${this.btnConfigs.btnId}:${this.btnConfigs.authorize}`,
          listPageId: this.listPageId,
          queryJson: JSON.stringify(this.getParams())
        });
      } else {
        if (selectList.length === 0) {
          return this.$warn("请至少勾选一条要处理的数据");
        }
        if ([undefined, null].includes(this.tableData[0][this.keyField])) {
          return this.$warn("主键字段未取到值，请检查数据或重新在列表设计页面重新关联主键！");
        }

        this.requestBatchQrDoc({
          dataRange: command,
          ids,
          actionCode: `${this.rawRelateId.split("__")[0]}:${this.btnConfigs.btnId}:${this.btnConfigs.authorize}`,
          listPageId: this.listPageId,
          queryJson: JSON.stringify(this.getParams())
        });
      }
    },

    disposeDel(row) {
      if (!this.localProcessData && !this.isVformWidget) {
        if (row) {
          this.batchDel([row[this.keyField]], [row]);
        } else {
          const selectList = this.getSelectedData();
          if (selectList.length === 0) {
            return this.$warn("请至少勾选一条要处理的数据");
          }
          if ([undefined, null].includes(this.tableData[0][this.keyField])) {
            return this.$warn("主键字段未取到值，请检查数据或重新在列表设计页面重新关联主键！");
          }
          this.batchDel(
            selectList.map(item => item[this.keyField]),
            selectList
          );
        }
      } else if (this.localProcessData && this.isVformWidget) {
        if (this.selectList.length === 0 && !row) {
          return this.$warn("请至少勾选一条要处理的数据");
        }
        this.localDataDel(row);
      } else if (!this.localProcessData && this.isVformWidget) {
        const selectList = this.getSelectedData();
        if (selectList.length === 0 && !row) {
          return this.$warn("请至少勾选一条要处理的数据");
        }
        this.batchDelByVformWidget(row ? [row[this.keyField]] : selectList.map(item => item[this.keyField]), row ? [row] : selectList);
      }
    },

    localDataDel(row) {
      // 非网络请求本地处理数据
      if (row) {
        const index = this.tableData.findIndex(rowItem => rowItem === row);
        this.tableData.splice(index, 1);
      } else {
        const selectList = this.getSelectedData();
        this.tableData = this.tableData.filter(rowItem => {
          return selectList.findIndex(item => item === rowItem) === -1;
        });
      }
      // 同步到表单
      this.syncFormDataByVformWidget();
      const index = Math.ceil(this.tableData.length / this.page.pageSize) || 1;
      if (index < this.page.pageNo) {
        this.page.pageNo = index;
      }
      this.updateTotalCount();
      if (["edit", "check"].includes(this.getDlgConfig().btnType)) {
        // 只有当前数据有主键，才进行记录
        const idList = (row ? [row[this.keyField]] : this.selectList.map(val => val[this.keyField])).filter(v => v);
        this.logDeletedData(idList);
      }
    },

    syncFormDataByVformWidget() {
      this.globalModel.formModel[this.getWidget().options.name] = this.tableData;
    },

    // 处理导入的实现
    async dealImport(metaId) {
      if (!metaId) {
        this.$error("未配置关联的业务模型");
        return;
      }
      this.btnConfigs.importFileCompRelateTableName = metaId;
      await this.$nextTick();
      this.$refs.importFileComp.open();
    },

    // 处理导入更新的实现
    async dealImportRefresh({ requestBeforeConfirmHint, requestBeforeConfirmText }) {
      if (requestBeforeConfirmHint) {
        await this.$confirm(`${requestBeforeConfirmText}`);
      }
      this.$refs.importRefreshComp.open({ refresh: this.queryTableData, listPageId: this.listPageId });
    },

    dynamicFormVNode() {
      const {
        btnConfigs: { formId },
        previewMode,
        primaryKeyValue,
        onlyRead,
        onSubmit,
        expose_hideDialog,
        localProcessData,
        editRow
      } = this;
      const baseAttrs = this.getExternalCompBaseAttrs();
      console.log("adadasd", this.keyField, baseAttrs);

      if (localProcessData && editRow) {
        baseAttrs.editData = cloneDeep(editRow);
      }
      if (formId) {
        this.curDialogCompRef = previewMode ? "VFPreview" : "VFRuntime";
        // 某些情况下需要传递参数给表单的extraData，使之一起提交上去
        if (!isEmpty(this.externalParamsFormRow) && !previewMode) {
          setTimeout(() => {
            this.$refs[this.curDialogCompRef]?.addExtraData(this.externalParamsFormRow);
          }, 300);
        }
        return previewMode ? (
          <VFPreview
            ref={"VFPreview"}
            {...{
              attrs: baseAttrs
            }}
            primaryKeyValue={primaryKeyValue}
            isDisabled={onlyRead}
            hasSubmit={false}
            formId={formId}
            {...{
              on: {
                submit: onSubmit,
                cancel: expose_hideDialog
              }
            }}
          ></VFPreview>
        ) : (
          <VFRuntime
            ref="VFRuntime"
            primaryKeyValue={primaryKeyValue}
            isDisabled={onlyRead}
            hasSubmit={false}
            formId={formId}
            {...{
              attrs: {
                ...baseAttrs
              }
            }}
            {...{
              on: {
                submit: onSubmit,
                cancel: expose_hideDialog
              }
            }}
          ></VFRuntime>
        );
      }
    },
    dynamicTableVNode() {
      const {
        btnConfigs: { tableId }
      } = this;
      if (tableId) {
        this.curDialogCompRef = "nestedTable";
        return <complete-table ref="nestedTable" listPageIdProp={tableId} rawRelateIdProp="notVerify"></complete-table>;
      }
    },

    btnRelateDialogVNode() {
      const {
        btnRelateDialogVisible,
        previewMode,
        onlyRead,
        btnConfigs: { showFooter, useDialog, relateComponent, formId, dialogTitle, dialogWidth, dialogHeight, btnType, closeOnPressEscape },
        dynamicFormVNode,
        dynamicTableVNode,
        relateComponentVNode,
        expose_hideDialog,
        submitForm,
        handleCancel
      } = this;
      // 如果是关联本地组件且不使用本组件提供的弹窗
      if (relateComponent && !useDialog) {
        return relateComponentVNode();
      }
      if (btnRelateDialogVisible) {
        const visibleListeners = {
          // 关键代码 - 1
          "update:visible": val => {
            this.btnRelateDialogVisible = val;
          },
          "before-close": expose_hideDialog
        };
        const width = dialogWidth ? formatterWidthOrHeightStyle(dialogWidth) : "1200px";
        const height = dialogHeight ? formatterWidthOrHeightStyle(dialogHeight, true) : "650px";
        this.$nextTick().then(() => {
          console.log(height, "height");
          this.$refs.eldialog.$el.querySelector(".el-dialog").style.height = height;
        });
        return (
          <el-dialog
            ref="eldialog"
            title={dialogTitle}
            visible={btnRelateDialogVisible}
            {...{ on: visibleListeners }}
            close-on-click-modal={false}
            close-on-press-escape={closeOnPressEscape}
            append-to-body
            v-draggable
            width={width}
          >
            <div
              class="dialogContent"
              style={{
                height: "100%",
                "overflow-y": "auto",
                "overflow-x": "hidden",
                width: `calc(${width} - '40px')`
              }}
            >
              {dynamicFormVNode()}
              {dynamicTableVNode()}
              {relateComponentVNode()}
            </div>
            {/* 只有非只读非预览且是动态表单或本地组件且showFooter为true才会渲染footer */}
            {!onlyRead && !previewMode && (formId || (relateComponent && showFooter)) ? (
              <span slot="footer">
                <el-button
                  size="small"
                  {...{
                    on: {
                      click: handleCancel
                    }
                  }}
                >
                  取 消
                </el-button>
                <el-button
                  type="primary"
                  size="small"
                  {...{
                    on: {
                      click: submitForm
                    }
                  }}
                >
                  确 定
                </el-button>
              </span>
            ) : null}
          </el-dialog>
        );
      }
    },

    importFileVNode() {
      const {
        importFileComp: ImportFileComp,
        onSubmit,
        onSubmitToTable,
        btnConfigs: { importFileCompRelateTableName }
      } = this;
      const baseAttrs = this.getExternalCompBaseAttrs();
      return (
        <ImportFileComp
          ref="importFileComp"
          tableName={importFileCompRelateTableName}
          {...{
            attrs: {
              ...baseAttrs,
              isVformWidgetTable: this.isVformWidget
            }
          }}
          {...{
            on: {
              submit: onSubmit,
              submitToTable: onSubmitToTable
            }
          }}
        ></ImportFileComp>
      );
    },

    importRefreshVNode() {
      const {
        importRefreshComp: ImportRefreshComp,
        btnConfigs: { importFileCompRelateTableName }
      } = this;
      const baseAttrs = this.getExternalCompBaseAttrs();
      return (
        <ImportRefreshComp
          ref="importRefreshComp"
          tableName={importFileCompRelateTableName}
          {...{
            attrs: {
              ...baseAttrs
            }
          }}
        ></ImportRefreshComp>
      );
    },

    relateComponentVNode() {
      if (this.btnConfigs.relateComponent) {
        this.curDialogCompRef = "relateComponent";
        const {
          btnConfigs: { relateComponent: RelateComponent, dialogTitle },
          expose_hideDialog,
          onSubmit
        } = this;
        const baseAttrs = this.getExternalCompBaseAttrs();
        return (
          <RelateComponent
            {...{
              attrs: {
                ...baseAttrs
              }
            }}
            dialogTitle={dialogTitle}
            {...{
              on: {
                submit: onSubmit,
                cancel: expose_hideDialog
              }
            }}
            ref="relateComponent"
          ></RelateComponent>
        );
      }
    },

    getExternalCompBaseAttrs() {
      const {
        selectList,
        keyField,
        btnConfigs: { btnDisposeParamsRule, requestBeforeConfirmHint, requestBeforeConfirmText, deliverySelectList },
        getRequestConfig,
        getPrimaryKeyValue,
        getDlgConfig,
        getWidget,
        dynamicExternalParams
      } = this;
      const { finalUrl, finalType, finalData, headers } = getRequestConfig();
      let config = {
        dynamicExternalParams,
        requestConfig: {
          requestType: finalType,
          requestUrl: finalUrl,
          requestBodyData: finalData,
          requestHeader: headers,
          requestBeforeConfirmHint,
          requestBeforeConfirmText
        },
        tableData: this.tableData,
        externalParams: this.externalParams,
        callingFrom: "dynatic-table",
        dlgFormConfig: this.btnConfigs,
        // 作为vform组件时需要传递以下信息
        isVformWidget: this.isVformWidget,
        localProcessData: this.localProcessData,
        mainDataId: getPrimaryKeyValue?.(),
        mainFormId: getDlgConfig?.()?.formId,
        mainRelateFieldName: getWidget?.()?.options?.name
      };
      if (deliverySelectList) {
        config = Object.assign(config, {
          keyFieldName: keyField,
          selectList,
          paramsRule: btnDisposeParamsRule
        });
      } else {
        config = Object.assign(config, {
          keyFieldName: "",
          selectList: [],
          paramsRule: {
            paramType: "",
            paramName: ""
          }
        });
      }
      return config;
    },

    download(params) {
      this.requestDownload(params, this.listPageId).then(response => {
        const link = document.createElement("a");
        const blob = response;
        link.style.display = "none";
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "导出表格.xlsx");
        console.log(link, "link");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    },

    async batchDelByVformWidget(idList, dataList) {
      const { logDeletedData, batchDel, tableData, page, queryTableData, requestBatchDelByVformWidget, listPageId } = this;
      if (this.getDlgConfig()?.btnType === "add") {
        await batchDel(idList, dataList);
      } else {
        await requestBatchDelByVformWidget(listPageId, idList.join(",")).then(res => {
          if (res.result === "0") {
            if (tableData.length === dataList.length && page.pageNo > 1) {
              page.pageNo--;
            }
            this.$success("删除成功");
            queryTableData();
          } else {
            throw new Error();
          }
        });
      }
      logDeletedData(idList);
    },

    async batchDel(idList = [], listData) {
      return this.requestBatchDel(idList, this.listPageId).then(async res => {
        if (res.result === "0") {
          if (this.tableData.length === listData.length && this.page.pageNo > 1) {
            this.page.pageNo--;
          }
          this.$success("删除成功");
          this.queryTableData();
        } else {
          throw new Error();
        }
      });
    },
    // 记录已删除数据
    logDeletedData(idList, restoreIdList) {
      if (!idList || !idList.length) return;
      const delField = "_DELETE_LIST_";
      const addField = "_SLAVE_LIST_";
      const { extraData } = this;
      const slaveTableField = this.getWidget().options.name;
      if (!extraData[delField]) {
        this.$set(extraData, delField, {});
      }
      if (!extraData[delField][slaveTableField]) {
        this.$set(extraData[delField], slaveTableField, []);
      }
      if (!extraData[addField]) {
        this.$set(extraData, addField, {});
      }
      if (!extraData[addField][slaveTableField]) {
        this.$set(extraData[addField], slaveTableField, []);
      }
      const lastLog = extraData[delField][slaveTableField] || [];
      let newLog = union(lastLog, idList).filter(d => d);
      // 这是可能某些情况要从log中删除id，因为相应数据被恢复了
      if (restoreIdList?.length) {
        newLog = newLog.filter(id => !restoreIdList.includes(id));
      }
      extraData[delField][slaveTableField] = newLog;
      if (!this.localProcessData) {
        // 如果删除的id在slavelist中存在，则删除
        const addListId = extraData[addField][slaveTableField];
        extraData[addField][slaveTableField] = addListId.filter(addId => !idList.some(delId => delId === addId));
      }
    },

    // 记录添加或修改数据
    logAddData(id) {
      if (!id) return;
      const { extraData } = this;
      const slaveTableField = this.getWidget().options.name;
      const field = "_SLAVE_LIST_";
      if (!extraData[field]) {
        this.$set(extraData, field, {});
      }
      if (!extraData[field][slaveTableField]) {
        this.$set(extraData[field], slaveTableField, []);
      }
      extraData[field][slaveTableField].push(id);
    },
    filterFieldChange(val) {
      this.filterField = val;
    },
    handleSetting(e) {
      if (this.tableDisbaled) return;
      e.stopPropagation();
      this.showPanel = !this.showPanel;
    },
    async submitForm() {
      const { localProcessData, isVformWidget, curDialogCompRef, submitFormByVformWidget, submitLocalData } = this;
      if (!isVformWidget) {
        this.$refs[curDialogCompRef]?.submitForm();
      } else {
        if (!localProcessData) {
          submitFormByVformWidget();
        } else {
          submitLocalData();
        }
      }
    },

    async submitFormByVformWidget() {
      const {
        btnConfigs: { btnType, formId },
        logAddData,
        getWidget,
        getPrimaryKeyValue,
        getDlgConfig,
        primaryKeyValue
      } = this;
      if (btnType === "add") {
        const url = `/dyn-common/create-slave/${formId}?mainDataId=${getPrimaryKeyValue()}&mainFormId=${getDlgConfig().formId}&mainRelateFieldName=${getWidget().options.name}`;
        const id = await this.$refs[this.curDialogCompRef]?.submitForm(url);
        logAddData(id);
      } else if (btnType === "edit") {
        const url = `/dyn-common/update-slave/${formId}?id=${primaryKeyValue}`;
        this.$refs[this.curDialogCompRef]?.submitForm(url);
      } else {
        console.warn("当前按钮的btnType既非新增也非编辑！");
      }
    },

    async submitLocalData() {
      const {
        tableData,
        expose_hideDialog,
        editRow,
        btnConfigs: { btnType },
        updateTotalCount,
        syncFormDataByVformWidget
      } = this;
      const rowData = await this.$refs[this.curDialogCompRef]?.getFormData();
      // 根据按钮类型判断怎么处理提交数据
      if (btnType === "edit") {
        const index = tableData.findIndex(row => row === editRow);
        const finalData = {
          ...tableData[index],
          ...rowData
        };
        tableData.splice(index, 1, finalData);
      } else if (btnType === "add") {
        tableData.unshift(rowData);
        updateTotalCount();
      }
      syncFormDataByVformWidget();
      expose_hideDialog();
    },

    updateTotalCount() {
      if (this.tableAttrs.showPagination) {
        this.page.totalCount = this.tableData.length;
      }
    },

    handleCancel() {
      this.$refs[this.curDialogCompRef]?.handleCancel();
    },

    handleGlobalClick() {
      if (this.showPanel) this.showPanel = false;
      console.log("handleGlobalClick");
    },
    updateSelectedRow(row) {
      console.log("updateSelectedRow", row);
      this.currentSelectedRow = row;
    },

    showEditOrCheckDialog(row) {
      console.log("showEditOrCheckDialog", row);
      if (this.previewMode || this.tableDisbaled) return;
      // 先检测编辑按钮
      let target = this.btnRegularOptions[0]?.formItem?.find(btnOptions => btnOptions.extraOption.btnType === "edit");
      // 再检测查看按钮
      if (!target) {
        target = this.btnRegularOptions[0]?.formItem?.find(btnOptions => btnOptions.extraOption.btnType === "check");
      }
      if (target) {
        this.handleBtnClick({ ...target.extraOption, btnId: target.btnId, authorize: target.authorize }, row);
      }
    },
    tableCellClick(row, btnId) {
      if (this.previewMode || this.tableDisbaled) return;
      try {
        const target = this.btnRegularOptions[0].formItem.find(btn => btn.btnId === btnId);
        if (target) {
          this.handleBtnClick({ ...target.extraOption, btnId: target.btnId, authorize: target.authorize }, row);
        } else {
          this.$warn("未找到此操作关联的按钮！请检查权限！");
        }
      } catch (error) {
        console.warn(error);
      }
    },
    emitBtnClick(row, btnName, btnId) {
      if (btnId) {
        this.tableCellClick(row, btnId);
      } else if (btnName) {
        const target = this.btnRegularOptions[0].formItem.find(btn => btn.tagAttrs.value === btnName);
        this.handleBtnClick({ ...target.extraOption, btnId: target.btnId, authorize: target.authorize }, row);
      } else {
        console.warn("调用emitBtnClick参数同时缺失按钮名称和按钮id");
      }
    },
    handleRowClickWrap(cb) {
      return row => {
        if (this.previewMode || this.tableDisbaled) return;
        this.eventBus?.$emit?.(`${this.getWidgetByFreeLayout()?.id}.rowClick`, row);
        cb?.(row);
      };
    },
    handleRowDbClickWrap(cb) {
      return row => {
        if (this.previewMode || this.tableDisbaled) return;
        this.eventBus?.$emit?.(`${this.getWidgetByFreeLayout()?.id}.rowDblclick`, row);
        cb?.(row);
      };
    },
    updateSelectedRowWrap(cb) {
      return row => {
        if (this.previewMode || this.tableDisbaled) return;
        this.eventBus?.$emit?.(`${this.getWidgetByFreeLayout()?.id}.currentChange`, row);
        cb?.(row);
      };
    },
    handleRowDbClickEmitBtn(row) {
      this.emitBtnClick(row, null, this.tableAttrs.dbClickRelateBtnId);
    },
    checkNoSelection() {
      return this.selectList.length === 0 && !this.currentSelectedRow;
    },
    checkOnlyOneSelected() {
      return this.selectList.length === 1 || (this.selectList.length === 0 && this.currentSelectedRow);
    },
    checkAnySelected() {
      return this.selectList.length || this.currentSelectedRow;
    },
    getSelectedData() {
      return this.selectList.length ? this.selectList : this.currentSelectedRow ? [this.currentSelectedRow] : [];
    },
    getFirstSelectedData() {
      return this.selectList[0] || this.currentSelectedRow;
    },
    matchDateRange(rowValue, val) {
      const rowTime = new Date(rowValue).getTime();
      if (isNaN(rowTime)) return false;

      // 区间筛选：val 是 [start, end]
      if (Array.isArray(val) && val.length === 2) {
        const [start, end] = val.map(v => new Date(v).getTime());
        if (isNaN(start) || isNaN(end)) return false;
        return rowTime >= start && rowTime <= end;
      }

      if (typeof val === "string" && val.trim()) {
        const startDate = new Date(val);
        if (isNaN(startDate.getTime())) return false;

        // 当天的开始时间
        const startTime = new Date(startDate.setHours(0, 0, 0, 0)).getTime();
        // 当天的结束时间
        const endTime = new Date(startDate.setHours(23, 59, 59, 999)).getTime();

        return rowTime >= startTime && rowTime <= endTime;
      }

      return true;
    },
    renderLeftBtns() {
      const { showBtns, leftBtnRegularOptions, handleBtnClick } = this;
      if (showBtns && leftBtnRegularOptions?.[0].formItem.length) {
        return <base-render-regular ref="leftBtnForm" render-options={leftBtnRegularOptions} on={{ btnClick: handleBtnClick }} />;
      }
      return <div class="height_0">&nbsp;</div>;
    },
    renderRightBtns() {
      const { showBtns, rightBtnRegularOptions, handleBtnClick } = this;
      if (showBtns && rightBtnRegularOptions?.[0].formItem.length) {
        return <base-render-regular ref="rightBtnForm" style="margin-right: 8px;" render-options={rightBtnRegularOptions} on={{ btnClick: handleBtnClick }} />;
      }
      return null;
    },
    renderOperateArea() {
      let {
        hiddenDefaultArea,
        multiFieldSearch,
        handleNativeFilter,
        handleFilter,
        tableDisbaled,
        isVformWidget,
        handleSetting,
        iconRefresh,
        iconDisposeDown,
        fuzzyFieldSearchConfig: { searchFieldList, placeholder }
      } = this;

      if (hiddenDefaultArea) return "";

      return (
        <div class="flex">
          {searchFieldList.length ? (
            <div class="inlineBlock">
              <el-input style={{ width: "200px" }} size="mini" v-model={this.multiFieldSearch} placeholder={placeholder} nativeOnkeydown={handleNativeFilter} clearable>
                <i slot="prefix" class="el-input__icon el-icon-search"></i>
              </el-input>
              <el-button type="primary" size="mini" disabled={tableDisbaled} style="margin-left: 10px" onClick={handleFilter}>
                搜 索
              </el-button>
            </div>
          ) : null}

          {!isVformWidget && (
            <div>
              <i class="el-icon-s-tools i pointer" onClick={handleSetting}></i>
              <i class="el-icon-refresh-right i pointer" onClick={iconRefresh}></i>
              <el-dropdown onCommand={iconDisposeDown}>
                <span class="el-dropdown-link">
                  <i class="el-icon-download i pointer"></i>
                </span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="curSelect">当前选中</el-dropdown-item>
                  <el-dropdown-item command="curPage">当前页</el-dropdown-item>
                  <el-dropdown-item command="all">全部</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          )}

          {this.renderPanel()}
        </div>
      );
    },
    renderPanel() {
      const { showPanel, panelData, filterFieldChange } = this;
      return (
        <div class={["custom", "absolute", showPanel ? "" : "none"]}>
          <panel data={panelData} on={{ checkedChange: filterFieldChange }} />
        </div>
      );
    },
    renderHeader() {
      const { isVformWidget } = this;
      return (
        <el-header ref="elHeader" class="flex between relative absolute-header-height">
          {this.renderLeftBtns()}
          <div class={["operate", isVformWidget ? "right_0" : ""]}>
            {this.renderRightBtns()}
            {this.renderOperateArea()}
          </div>
        </el-header>
      );
    }
  },

  render() {
    const {
      tableHeight,
      generalRequest,
      showSearchFrom,
      searchForm,
      formOptions,
      attrs,
      filterTableOptions,
      selectListHandler,
      tableAttrs,
      pageLayout,
      page,
      pageSizes,
      handleSizeChange,
      handleCurrentChange,
      btnRelateDialogVNode,
      importFileVNode,
      importRefreshVNode,
      getSelectedData,
      handleGlobalClick,
      handleRowDbClickEmitBtn,
      handleRowClickWrap,
      handleRowDbClickWrap,
      updateSelectedRowWrap,
      showEditOrCheckDialog,
      updateSelectedRow,
      onSave,
      tableCellClick,
      localProcessData,
      finalTableData,
      listPageId,
      btnConfigs,
      keyField,
      getParams,
      renderHeader
    } = this;

    const curPageListeners = localProcessData
      ? {
          "update:currentPage": val => {
            page.pageNo = val;
          },
          "update:pageSize": val => {
            page.pageSize = val;
          }
        }
      : {
          "update:currentPage": val => {
            page.pageNo = val;
          },
          "update:pageSize": val => {
            page.pageSize = val;
          },
          "size-change": handleSizeChange,
          "current-change": handleCurrentChange
        };
    const tableEvent = {
      "selection-change": selectListHandler,
      clickBtn: tableCellClick,
      "row-click": handleRowClickWrap(),
      "current-change": updateSelectedRowWrap(updateSelectedRow),
      "row-dblclick": handleRowDbClickWrap(showEditOrCheckDialog)
    };

    if (tableAttrs.dbClickRelateBtnId) {
      tableEvent["row-dblclick"] = handleRowDbClickWrap(handleRowDbClickEmitBtn);
    }

    const scopedSlots = {
      operator: ({ row }) => {
        row.$edit ? (
          <el-button
            {...{
              on: {
                click: onSave(row)
              }
            }}
          >
            保存
          </el-button>
        ) : null;
      }
    };

    return (
      <el-container class="CompleteTable" style={tableAttrs.style} nativeOnClick={handleGlobalClick}>
        {showSearchFrom ? (
          <el-header ref="elHeaderSearchFrom" style="margin: 20px 0 0 0;" class="flex-header-height">
            {formOptions?.length ? (
              <base-render-form
                ref="form"
                generalRequest={generalRequest}
                form-data={searchForm}
                form-options={formOptions}
                getParams={getParams}
                showFooter={false}
                use-dialog={false}
                list-page-id={listPageId}
                label-width=""
                inline={true}
                maxHeight={86}
                isCollapse={true}
              ></base-render-form>
            ) : null}
          </el-header>
        ) : null}
        <el-main class="main-padding">
          <el-container style="height: 100%">
            {renderHeader()}
            <el-main>
              <base-render-table
                ref="table"
                height={tableHeight}
                table-data={finalTableData}
                table-options={filterTableOptions}
                {...{
                  on: {
                    ...tableEvent
                  }
                }}
                {...{
                  attrs: {
                    ...attrs
                  }
                }}
                scopedSlots={scopedSlots}
              ></base-render-table>
            </el-main>
            {tableAttrs.showPagination ? (
              <el-footer style="height:30px;">
                <el-pagination
                  class="el-pagination"
                  layout={pageLayout}
                  current-page={page.pageNo}
                  page-size={page.pageSize}
                  total={page.totalCount}
                  page-sizes={pageSizes}
                  {...{ on: curPageListeners }}
                ></el-pagination>
              </el-footer>
            ) : null}
          </el-container>
        </el-main>
        <printTemplateDlg ref="printTemplateDlg" listPageId={listPageId} btnId={btnConfigs.btnId + ""} keyField={keyField} selectList={getSelectedData()}></printTemplateDlg>
        {btnRelateDialogVNode()}
        {importFileVNode()}
        {importRefreshVNode()}
      </el-container>
    );
  }
};
