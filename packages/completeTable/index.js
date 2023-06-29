import './index.less';
import BaseRenderTable from '../BaseRenderTable/index';
import BaseRenderForm from '../BaseRenderForm/index';
import BaseRenderRegular from '../BaseRenderRegular/index';
import panel from './component/panel.vue';
import { align, searchWidget } from '../../baseConfig/tableSelectConfigs';
import { requestTypeList } from '../../baseConfig/btnBaseConfig';

import { getTableAttrs } from '../../baseConfig/tableBaseConfig';

import {
  getWidgetOptions,
  exec,
  getWidgetDefaultVal,
  str2obj,
  depthFirstSearchWithRecursive,
  str2Fn,
  setTableAttrs,
  getSummaries,
  addQueryString,
  BtnConfigs,
} from '../../utils';
import { cloneDeep, omit, merge } from 'lodash';

export default {
  name: 'completeTable',
  components: {
    BaseRenderTable,
    BaseRenderForm,
    BaseRenderRegular,
    panel,
  },
  props: {
    pageCode: {
      type: String,
    },
    requestTableData: {
      type: Function,
    },
    requestTablePaginationData: {
      type: Function,
    },
    requestFormData: {
      type: Function,
    },
    requestTableConfig: {
      type: Function,
      require: true,
    },
    requestFormConfig: {
      type: Function,
    },
    requestDownload: {
      type: Function,
    },
    requestBatchDel: {
      type: Function,
    },
    generalRequest: {
      type: Function,
    },
    checkPermission: {
      type: Function,
    },
    listPageId: String,
  },

  data() {
    return {
      fuzzySearchPlaceholder: '',
      pageLayout: '->, total,sizes, prev, pager, next,jumper',
      // 显示动态表单相关
      btnRelateDialogVisible: false,
      rule: [],
      option: {},
      multiFieldSearch: '',
      // tabledata 属性值要做到和tableOptions中的prop相对应
      tableConfigJSON: [],
      tableOptions: [],
      tableData: [],
      formOptions: [],
      searchFrom: {},
      rawSearchFrom: {},
      page: {
        pageNo: 1,
        pageSize: 10,
        totalCount: 0,
      },
      btnRegularOptions: [],
      showSearchFrom: true,
      showBtns: true,
      primaryKeyValue: '',
      showPanel: false,
      // 选中的table数据
      selectList: [],
      panelData: [],
      filterFiled: [],
      externalParmas: {},
      keyField: '',
      onlyRead: false,
      previewMode: false,
      curDialogCompRef: '',
      tableAttrs: {},
      btnConfigs: new BtnConfigs(),
    };
  },

  computed: {
    attrs() {
      const props = [
        'isTree',
        'isMerge',
        'isShowIndex',
        'showPagination',
        'isShowIndex',
        'isShowCheckbox',
        'keyField',
        'tableOptions',
        'formOptions',
        'style',
      ];
      if (!this.tableAttrs.isShowIndex) {
        props.push('index');
      }
      if (!this.tableAttrs.showSummary || !this.tableAttrs.summaryMethod) {
        props.push('summaryMethod');
      }
      if (!this.tableAttrs.isTree) {
        props.push('treeProps', 'rowKey', 'load', 'lazy');
      }
      if (!this.tableAttrs.lazy && props.indexOf('load') !== -1) {
        props.push('load');
      }
      if (!this.tableAttrs.isMerge) {
        props.push('spanMethod');
      }
      if (!this.tableAttrs.elTableStyle) {
        props.push('elTableStyle');
      }
      return omit(this.tableAttrs, props);
    },

    filterTableOptions() {
      const { tableOptions, filterFiled } = this;
      if (tableOptions?.length === 0) return [];
      let configOptions = [];
      if (
        tableOptions[1]?.type === 'selection' ||
        tableOptions[1]?.type === 'index'
      ) {
        configOptions = tableOptions.slice(0, 2);
      } else if (
        tableOptions[0]?.type === 'selection' ||
        tableOptions[0]?.type === 'index'
      ) {
        configOptions = tableOptions.slice(0, 1);
      }

      const options = filterFiled.map((field) =>
        tableOptions.find((rawitem) => rawitem.prop === field)
      );
      return [...configOptions, ...options];
    },
  },

  provide() {
    return {
      getTableRenderInstance: () => this.expose_CompleteTableInstance(),
    };
  },
  created() {
    this.initTableAttrs();
  },
  mounted() {
    // this.init()
  },

  errorCaptured(err) {
    // 看着心烦，直接屏蔽，elform计算label值得时候得问题，在beforeDestroy周期里，不影响功能
    if (err.message === '[ElementForm]unpected width ') return false;
    else return true;
  },

  inject: ['flowComp', 'importFileComp', 'queryFlowDef', 'componentList'],

  methods: {
    expose_CompleteTableInstance() {
      return this;
    },
    expose_showDialog() {
      this.btnRelateDialogVisible = true;
    },

    expose_hideDialog() {
      this.btnRelateDialogVisible = false;
      this.resetBtnConfigs();
    },

    expose_preview(data) {
      this.previewMode = true;
      this.parseTableConfig(data);
      const tableSingleData = {};
      this.composeData(tableSingleData);
      this.tableData = [tableSingleData];
      // for (let index = 0; index < 10; index++) {
      //   this.tableData.push(tableSingleData);
      // }
    },

    initTableAttrs() {
      this.tableAttrs = getTableAttrs();
      this.tableAttrs.summaryMethod = getSummaries;
    },

    resetBtnConfigs() {
      this.btnConfigs = new BtnConfigs();
    },

    // 保存表单
    async onSubmit(data) {
      this.$emit('onSubmit', data);
      this.expose_hideDialog();
      // await this.requestFormConfirm(this.formid, data)
      this.btnConfigs.isRefresh && this.queryTableData();
    },

    // 预览的时候用，创建一个全为空字符串的对象
    setEmptyTableData(emptyData = {}, fieldCode) {
      emptyData[fieldCode] = '';
    },

    async init(isPreview, json) {
      this.resetAllData();
      await this.$nextTick();
      this.previewMode = !!isPreview;
      if (!json) {
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
        this.queryTableData();
        this.composeData();
      }
    },

    // 清空数据
    resetAllData() {
      this.fuzzySearchPlaceholder = '';
      this.pageLayout = '->, total,sizes, prev, pager, next,jumper';
      this.btnRelateDialogVisible = false;
      this.rule = [];
      this.option = {};
      this.multiFieldSearch = '';
      this.tableConfigJSON = [];
      this.tableOptions = [];
      this.tableData = [];
      this.formOptions = [];
      this.searchFrom = {};
      this.rawSearchFrom = {};
      this.btnRegularOptions = [];
      this.showSearchFrom = true;
      this.showBtns = true;
      this.primaryKeyValue = '';
      this.showPanel = false;
      this.selectList = [];
      this.panelData = [];
      this.filterFiled = [];
      this.keyField = '';
      this.onlyRead = false;
      this.previewMode = false;
      this.page = {
        pageNo: 1,
        pageSize: 10,
        totalCount: 0,
      };
      this.btnConfigs = new BtnConfigs();
      this.initTableAttrs();
    },

    setSingleTableOptions(item, emptyData) {
      const obj = {};
      obj.prop = item.fieldCode;
      emptyData && this.setEmptyTableData(emptyData, item.fieldCode);
      obj.label = item.fieldName;
      obj.align = align.find((alignitem) => alignitem.id === item.align).value;
      obj['min-width'] = item.width;
      obj.sortable = !!item.sort;
      obj['show-overflow-tooltip'] = item['show-overflow-tooltip'];
      if (item.fixed) obj.fixed = item.fixed;
      if (item.filters) obj.filters = str2obj(item.filters);

      // 某些函数转换
      const fnProps = ['sort-method', 'formatter', 'renderHeader'];
      if (obj.filters && obj.filters.length) {
        fnProps.push('filter-method');
      }
      fnProps.map((prop) => {
        if (item[prop]) {
          obj[prop] = str2Fn(item[prop]);
        }
      });

      if (item.children) {
        obj.children = item.children.map((item) =>
          this.setSingleTableOptions(item, emptyData)
        );
      }
      return obj;
    },

    composeData(emptyData) {
      this.formOptions = this.composeFromOptions(this.tableConfigJSON);
      this.filterFiled = [];
      this.tableOptions = this.tableConfigJSON
        .filter((item) => item.show)
        .map((item) => {
          this.filterFiled.push(item.fieldCode);
          return this.setSingleTableOptions(item, emptyData);
        });

      this.panelData = this.tableOptions.map((item) => {
        return {
          key: item.prop,
          label: item.label,
        };
      });

      if (this.tableAttrs.isShowIndex) {
        const obj = {
          type: 'index',
          width: '50',
          label: '序号',
          align: 'center',
        };
        if (this.tableAttrs.index) {
          obj.index = this.tableAttrs.index;
        }
        this.tableOptions.unshift(obj);
      }
      if (this.tableAttrs.isShowCheckbox) {
        this.tableOptions.unshift({
          type: 'selection',
          width: '46',
          align: 'center',
        });
      }
    },

    // 由数据组成searchFrom
    setFromField(source, fieldCode, formOptions, searchWidgetName) {
      this.$set(
        source,
        fieldCode,
        getWidgetDefaultVal(formOptions, searchWidgetName)
      );
    },

    // 设置searchFrom和装配fromOptions
    composeFromOptions(tableData) {
      this.showSearchFrom = false;
      if (!tableData.length) return [];
      const { setFromField } = this;
      let formOptions = [];
      const length = tableData.length;
      tableData.map((item, index) => {
        const searchWidgetName = searchWidget.find(
          (widgetitem) => widgetitem.id === item.searchWidget
        )?.tagName;
        // 只有搜索控件有值且开启了搜索项，才会添加到options中
        if (searchWidgetName && item.isSearchWidget) {
          // this.$set(this.searchFrom, item.fieldCode, '');
          setFromField(
            this.searchFrom,
            item.fieldCode,
            item.searchWidgetConfig,
            searchWidgetName
          );
          const options = getWidgetOptions(searchWidgetName, item);
          const finalOptions = merge(
            options,
            depthFirstSearchWithRecursive(item.searchWidgetConfig)
          );
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
              change: changeFn,
            };
          }
          formOptions.push(finalOptions);
        }
        // 如果循环到最后一个且存在其他筛选项，则对formOptions通过sortNumb进行排序，复制一份最原始的form,添加筛选和重置按钮
        if (length - 1 === index && formOptions.length) {
          this.rawSearchFrom = cloneDeep(this.searchFrom);
          formOptions = formOptions.sort((a, b) => a.sortNumb - b.sortNumb);
          // formOptions.push(...this.getBtnConfig());
          this.showSearchFrom = true;
        }
      });

      return [
        {
          elRowAttrs: {
            gutter: 10,
            type: 'flex',
            align: 'middle',
            justify: 'start',
          },
          style: 'flex-wrap: wrap',
          formItem: formOptions,
        },
      ];
    },

    handleFilter() {
      if (this.previewMode) return;
      this.page.pageNo = 1;
      this.queryTableData();
    },

    handleReset() {
      this.searchFrom = cloneDeep(this.rawSearchFrom);
      this.page.pageNo = 1;
      this.queryTableData();
    },

    onSave(row) {
      // 推出编辑清空状态
      row.$edit = false;
      // this.$refs.table.expose_clearCurCellPro();
    },

    rowClick(val) {
      this.$emit(rowClick, val);
      console.log(val);
    },

    selectListHandler(val) {
      this.$emit('selectListHandler', val);
      console.log(val);
      this.selectList = val;
    },

    handleCurrentChange(val) {
      console.log(val, this.page);
      this.queryTableData();
    },

    handleSizeChange(val) {
      console.log(val, this.page);
      this.page.pageSize = val;
      this.queryTableData();
    },

    // 持久化的外部参数存储
    refreshData(data) {
      this.externalParmas = data;
      this.queryTableData();
    },

    refresh() {
      this.queryTableData();
    },

    // 获取列表数据接口参数
    getParams(data) {
      const extraParams = {};
      if (this.formOptions?.length) {
        const formItem = this.formOptions[0].formItem;
        formItem.map((item) => {
          // 此处要处理两个字段使用同一input的模糊搜索
          const {
            // relateOtherField = [],
            formField = '',
            searchWidgetType,
          } = item;
          // if (searchWidgetType === 0 && relateOtherField.length) {
          //   relateOtherField.map((fieldName) => {
          //     extraParams[fieldName] = this.searchFrom[formField];
          //   });
          // }
          // 此处要处理日期选择框数组形式后端不识别，改为字段名加end和start
          if (
            searchWidgetType === 4 &&
            this.searchFrom[formField]?.length === 2
          ) {
            extraParams[`${formField}Start`] =
              this.searchFrom[formField][0] || '';
            extraParams[`${formField}End`] =
              this.searchFrom[formField][1] || '';
          }
        });
      }
      return {
        ...data,
        ...this.searchFrom,
        ...extraParams,
        ...this.externalParmas,
        multiFieldSearch: this.multiFieldSearch,
      };
    },

    // data为外界组件执行某些行为触发更新的参数(一次性参数，不会存储，如果点击分页就会消失，持久化的外部参数存储请使用refreshData方法)
    queryTableData(data = {}) {
      const params = this.getParams(data);
      return (this.tableAttrs.showPagination
        ? this.requestTablePaginationData(params, this.page, this.listPageId)
        : this.requestTableData(params, this.listPageId)
      )
        .then((res) => {
          if (res.result === '0') {
            this.tableData = res.data;
            if (this.tableAttrs.showPagination) {
              this.page.totalCount = res.totalCount;
            }
          } else {
            console.error(`queryTableData message: ${res.message}`);
          }
        })
        .catch((e) => {
          console.error(`queryTableData error: ${e}`);
          throw new Error(e);
        });
    },

    parseTableConfig(data) {
      const {
        tableOptions,
        formOptions,
        keyField,
        tableAttrs,
        fuzzyFieldSearchConfig,
      } = data;
      this.tableAttrs = setTableAttrs(tableAttrs);
      if (formOptions?.length) {
        this.btnRegularOptions = this.composeBtnRegularOptions(
          cloneDeep(formOptions)
        );
      } else {
        this.showBtns = false;
      }
      this.tableConfigJSON = tableOptions;
      this.keyField = keyField;
      if (fuzzyFieldSearchConfig?.searchFieldList?.length > 0) {
        this.fuzzySearchPlaceholder = fuzzyFieldSearchConfig.placeholder;
      }
    },

    queryTableConfig() {
      return this.requestTableConfig()
        .then((res) => {
          if (res.result === '0') {
            const data = JSON.parse(res.data);
            this.parseTableConfig(data);
          } else {
            console.error(`queryTableConfig message: ${res}`);
          }
        })
        .catch((e) => {
          console.error(`queryTableConfig error: ${e}`);
        });
    },

    // 构成按钮设计区的options
    composeBtnRegularOptions(config) {
      if (this.previewMode) {
        config.map((item) => {
          if (item.tagAttrs) {
            item.tagAttrs.disabled = !['新增', '查看', '编辑'].includes(
              item.tagAttrs.value
            );
          } else {
            item.tagAttrs = {
              disabled: !['新增', '查看', '编辑'].includes(item.tagAttrs.value),
            };
          }
        });
      }
      this.showBtns = true;
      // 根据权限筛选
      if (!this.previewMode) {
        config = config.filter((item) => {
          return (
            this.checkPermission(
              `${this.pageCode}:${item.btnId}:${item.authorize}`
            ) || item.authorize === 'defaultShow'
          );
        });
        if (config.length === 0) this.showBtns = false;
      }

      return [
        {
          elRowAttrs: {
            gutter: 10,
            type: 'flex',
            align: 'middle',
            justify: 'start',
          },
          style: 'padding-left: 5px',
          formItem: config,
        },
      ];
    },

    exec,

    // 格式化高度宽度
    formatterWidthOrHeightStyle(length) {
      if (typeof length === 'string') length = length.trim();
      if (/^\d+$/.test(length)) {
        return `${length}px`;
      } else if (/^\d+(%|px)?$/.test(length)) {
        return length;
      } else {
        console.warn('输入的高度或者宽度格式不正确！');
        return '';
      }
    },

    validateSelectList({ paramName, paramType, deliverySelectList, validate }) {
      const { selectList } = this;
      this.btnConfigs.deliverySelectList = deliverySelectList;
      if (deliverySelectList) {
        this.btnConfigs.btnDisposeParamsRule = {
          paramName,
          paramType,
        };
        if (validate.includes(0) && selectList.length === 0) {
          this.$warn('请至少勾选一条要处理的数据');
          return false;
        }
        if (validate.includes(1) && selectList.length !== 1) {
          this.$warn('当前操作只允许勾选一条数据');
          return false;
        }
      }
      return true;
    },

    // 处理按钮点击事件
    async handleBtnClick({
      relateFrom = '',
      relateMeta = '',
      relateComponent = '',
      openType = '',
      openUrl = '',
      fn = '',
      isRefresh = false,
      btnType = '',
      dialogTitle = '',
      dialogHeight = '',
      dialogWidth = '',
      flowKey = '',
      paramName = '',
      paramType = 0,
      deliverySelectList = false,
      validate = [],
      requestUrl = '',
      requestType = 'post',
      requestBeforeConfirmHint = false,
      requestBeforeConfirmText = '',
      requestParamsConfig = {},
      useDialog = true,
      showFooter = false,
    }) {
      const {
        validateSelectList,
        disposeFlowEvent,
        disposeRelateCompEvent,
        disposeDynamicEvent,
        disposeRequestEvent,
        disposeDownOrDel,
      } = this;
      // 只btnConfigs.要执行点击按钮操作，先置空formid
      this.btnConfigs = new BtnConfigs();
      this.btnConfigs.requestUrl = requestUrl;
      this.btnConfigs.requestType = requestType;
      this.btnConfigs.requestFixedParams = requestParamsConfig;
      this.btnConfigs.requestBeforeConfirmHint = requestBeforeConfirmHint;
      this.btnConfigs.requestBeforeConfirmText = requestBeforeConfirmText;
      this.btnConfigs.isRefresh = isRefresh;
      this.btnConfigs.btnType = btnType;
      this.btnConfigs.openType = openType;
      this.btnConfigs.dialogHeight = dialogHeight;
      this.btnConfigs.dialogWidth = dialogWidth;
      await this.$nextTick();
      // 如果有自定义事件，则执行自定义事件
      if (fn) {
        this.exec(fn);
      } else {
        if (openType === -1) {
          // openType为-1是固定行为，如下载 批量删除等
          switch (btnType) {
            case 'download':
            case 'batchDel':
              disposeDownOrDel({
                btnType,
              });
              break;
            case 'import':
              // 处理导入
              this.dealImport(relateMeta);
              break;
            default:
              break;
          }
        } else if (openType === 1) {
          // openType为1是当前页面跳转
          this.$router.push(openUrl, relateFrom);
        } else if (openType === 3) {
          // openType为3是新窗口打开;
          var reg = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
          window.open(
            reg.test(openUrl)
              ? openUrl
              : `${window.location.origin}${
                  openUrl.at(0) === '/' ? '' : '/'
                }${openUrl}`,
            '_blank'
          );
        } else if (openType === 4) {
          // openType为4是打开本地关联代码
          if (
            validateSelectList({
              paramName,
              paramType,
              deliverySelectList,
              validate,
            })
          ) {
            disposeRelateCompEvent({
              relateComponent,
              useDialog,
              showFooter,
              dialogTitle,
            });
          }
        } else if (openType === 5) {
          // openType为5是直接调用接口
          if (
            validateSelectList({
              paramName,
              paramType,
              deliverySelectList,
              validate,
            })
          ) {
            disposeRequestEvent({
              requestBeforeConfirmHint,
              requestBeforeConfirmText,
            });
          }
        } else if (openType === 2) {
          // openType为2是打开流程
          if (
            validateSelectList({
              paramName,
              paramType,
              deliverySelectList,
              validate,
            })
          ) {
            disposeFlowEvent({ flowKey, btnType });
          }
        } else if (openType === 0) {
          // openType为0是打开表单
          if (
            validateSelectList({
              paramName,
              paramType,
              deliverySelectList,
              validate,
            })
          ) {
            disposeDynamicEvent({
              btnType,
              relateFrom,
              dialogTitle,
            });
          }
        }
      }
    },

    disposeRelateCompEvent(
      { relateComponent, useDialog, showFooter, dialogTitle },
      row
    ) {
      if (!useDialog) {
        setTimeout(() => {
          try {
            this.$refs.relateComponent.expose_showDialog(row);
          } catch (error) {
            console.warn('调用本地组件的expose_showDialog方法错误', error);
          }
        }, 100);
      } else {
        this.expose_showDialog();
      }
      this.btnConfigs.relateComponent = this.componentList.find(
        (item) => item.id === relateComponent
      )?.component;
      this.btnConfigs.useDialog = useDialog;
      this.btnConfigs.showFooter = showFooter;
      this.btnConfigs.dialogTitle = dialogTitle || '新增';
    },

    async disposeFlowEvent({ flowKey, btnType }, row) {
      if (btnType === 'check') {
        const res = await this.generalRequest(
          `/flow/business/${(row || this.selectList[0])[this.keyField]}`,
          'get'
        );
        this.$refs.flowDialogSummary.openEditDialog(res.data);
      } else {
        const res = await this.queryFlowDef('', '', flowKey);
        const flowInfo = res.data;
        flowInfo.name = flowInfo.groupName;
        flowInfo.id = flowInfo.flowDefinitionId;
        // 发起流程
        if (flowInfo.startMode === 'stdNew') {
          const query = {
            queryMode: 'add',
            currentVersionId: flowInfo.currentVersionId,
          };
          const routeUrl = this.$router.resolve({
            path: '/examine-approve-detail',
            query,
          });
          window.open(routeUrl.href, '_blank');
        } else {
          this.$refs.flowDialogSummary.openAddDialog(flowInfo);
        }
      }
    },

    disposeDynamicEvent({ btnType, relateFrom, dialogTitle }, rowData) {
      switch (btnType) {
        case 'add':
          this.expose_showDialog();
          this.btnConfigs.formId = relateFrom;
          this.onlyRead = false;
          this.primaryKeyValue = '';
          this.btnConfigs.dialogTitle = dialogTitle || '新增';
          break;
        case 'check':
        case 'edit':
          if (rowData) {
            this.primaryKeyValue = rowData[this.keyField];
          } else {
            this.primaryKeyValue =
              this.selectList[0] && this.selectList[0][this.keyField];
          }
          if ([undefined, null].includes(this.primaryKeyValue)) {
            return this.$warn(
              '主键字段未取到值，请检查数据或在列表设计页面重新关联主键！'
            );
          }
          this.expose_showDialog();
          this.btnConfigs.formId = relateFrom;
          this.onlyRead = btnType === 'check';
          this.btnConfigs.dialogTitle =
            dialogTitle || (btnType === 'check' ? '查看' : '编辑');
          break;
        default:
          break;
      }
    },

    transformParamsValue(value) {
      if ([null, undefined, ''].includes(value)) return '';
      if (typeof value === 'string') {
        value = value.trim();
        return value.replace(/^\{(\w*)\}$/g, (value, $1) => {
          if ($1) return this[$1];
          else return value;
        });
      } else {
        console.warn('参数值不是字符串！');
        return '';
      }
    },

    getRequestConfig() {
      const {
        btnConfigs: { requestUrl, requestType, requestFixedParams = {} },
      } = this;
      const { params = [], data = [] } = requestFixedParams;
      const { transformParamsValue } = this;
      let finalUrl = requestUrl;
      if (params?.length) {
        const finalParams = {};
        params.map((item) => {
          finalParams[item.name] = transformParamsValue(item.value);
        });
        finalUrl = addQueryString(finalParams, requestUrl);
      }
      const finalData = {};
      if (data?.length) {
        data.map((item) => {
          finalData[item.name] = transformParamsValue(item.value);
        });
      }
      const finalType =
        requestTypeList.find((item) => item.id === requestType)?.cnName || '';
      return {
        finalUrl,
        finalData,
        finalType,
      };
    },

    async disposeRequestEvent({
      requestBeforeConfirmHint,
      requestBeforeConfirmText,
    }) {
      if (requestBeforeConfirmHint) {
        await this.$confirm(`${requestBeforeConfirmText}`);
      }
      const { finalUrl, finalType, finalData } = this.getRequestConfig();
      this.generalRequest(finalUrl, finalType, finalData);
    },

    disposeDownOrDel({ btnType }) {
      if (this.previewMode) return;
      if (this.selectList.length === 0 && btnType !== 'download') {
        return this.$warn('请至少勾选一条要处理的数据');
      }
      if ([undefined, null].includes(this.tableData[0][this.keyField])) {
        return this.$warn(
          '主键字段未取到值，请检查数据或重新在列表设计页面重新关联主键！'
        );
      }
      (btnType === 'download' ? this.download : this.batchDel)(
        this.selectList.map((item) => item[this.keyField])
      );
    },

    // 处理导入的实现
    async dealImport(metaId) {
      if (!metaId) {
        this.$error('未配置关联的业务模型');
        return;
      }
      this.btnConfigs.importFileCompRelateTableName = metaId;
      await this.$nextTick();
      this.$refs.importFileComp.open();
    },

    dynamicFormVNode() {
      const {
        btnConfigs: { formId },
        previewMode,
        primaryKeyValue,
        onlyRead,
        onSubmit,
        expose_hideDialog,
      } = this;
      const baseAttrs = this.getExternalCompBaseAttrs();
      if (formId) {
        this.curDialogCompRef = previewMode ? 'VFPreview' : 'VFRuntime';
        return previewMode ? (
          <VFPreview
            ref={'VFPreview'}
            {...{
              attrs: baseAttrs,
            }}
            primaryKeyValue={primaryKeyValue}
            isDisabled={onlyRead}
            hasSubmit={false}
            formId={formId}
            {...{
              on: {
                submit: onSubmit,
                cancel: expose_hideDialog,
              },
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
                ...baseAttrs,
              },
            }}
            {...{
              on: {
                submit: onSubmit,
                cancel: expose_hideDialog,
              },
            }}
          ></VFRuntime>
        );
      }
    },

    btnRelateDialogVNode() {
      const {
        btnRelateDialogVisible,
        previewMode,
        onlyRead,
        btnConfigs: {
          showFooter,
          useDialog,
          relateComponent,
          formId,
          dialogTitle,
          dialogWidth,
          dialogHeight,
        },
        dynamicFormVNode,
        relateComponentVNode,
        expose_hideDialog,
        submitForm,
        handleCancel,
        formatterWidthOrHeightStyle,
      } = this;
      // 如果是关联本地组件且不使用本组件提供的弹窗
      if (relateComponent && !useDialog) {
        return relateComponentVNode();
      }
      if (btnRelateDialogVisible) {
        const visibleListeners = {
          // 关键代码 - 1
          'update:visible': (val) => {
            this.btnRelateDialogVisible = val;
          },
          'before-close': expose_hideDialog,
        };
        const width = dialogWidth
          ? formatterWidthOrHeightStyle(dialogWidth)
          : '1200px';
        return (
          <el-dialog
            title={dialogTitle}
            visible={btnRelateDialogVisible}
            {...{ on: visibleListeners }}
            close-on-click-modal={false}
            close-on-press-escape={false}
            append-to-body
            v-draggable
            width={
              dialogWidth ? formatterWidthOrHeightStyle(dialogWidth) : '1200px'
            }
          >
            <div
              style={{
                height: dialogHeight
                  ? formatterWidthOrHeightStyle(dialogHeight)
                  : '650px',
                overflow: 'auto',
                width: `calc(${width} - '40px')`,
              }}
            >
              {dynamicFormVNode()}
              {relateComponentVNode()}
            </div>
            {/* 只有非只读非预览且是动态表单或本地组件且showFooter为true才会渲染footer */}
            {!onlyRead &&
            !previewMode &&
            (formId || (relateComponent && showFooter)) ? (
              <span slot="footer">
                <el-button
                  type="primary"
                  size="small"
                  {...{
                    on: {
                      click: submitForm,
                    },
                  }}
                >
                  提 交
                </el-button>
                <el-button
                  size="small"
                  {...{
                    on: {
                      click: handleCancel,
                    },
                  }}
                >
                  取 消
                </el-button>
              </span>
            ) : null}
          </el-dialog>
        );
      }
    },

    flowVNode() {
      const {
        flowComp: FlowComp,
        btnConfigs: { dialogHeight, dialogWidth, btnType },
      } = this;
      const baseAttrs = this.getExternalCompBaseAttrs();
      baseAttrs.dialogHeight = dialogHeight;
      baseAttrs.dialogWidth = dialogWidth;
      return (
        <FlowComp
          ref="flowDialogSummary"
          mode={btnType === 'check' ? 'edit' : 'add'}
          view={btnType === 'check' ? 2 : 0}
          {...{
            attrs: {
              ...baseAttrs,
            },
          }}
          {...{
            on: {
              updateTable: this.queryTableData,
            },
          }}
        ></FlowComp>
      );
    },

    importFileVNode() {
      const {
        importFileComp: ImportFileComp,
        onSubmit,
        btnConfigs: { importFileCompRelateTableName },
      } = this;
      const baseAttrs = this.getExternalCompBaseAttrs();
      return (
        <ImportFileComp
          tableName={importFileCompRelateTableName}
          {...{
            attrs: {
              ...baseAttrs,
            },
          }}
          ref="importFileComp"
          {...{
            on: {
              submit: onSubmit,
            },
          }}
        ></ImportFileComp>
      );
    },

    relateComponentVNode() {
      if (this.btnConfigs.relateComponent) {
        this.curDialogCompRef = 'relateComponent';
        const {
          btnConfigs: { relateComponent: RelateComponent, dialogTitle },
          expose_hideDialog,
          onSubmit,
        } = this;
        const baseAttrs = this.getExternalCompBaseAttrs();
        return (
          <RelateComponent
            {...{
              attrs: {
                ...baseAttrs,
              },
            }}
            dialogTitle={dialogTitle}
            {...{
              on: {
                submit: onSubmit,
                cancel: expose_hideDialog,
              },
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
        btnConfigs: {
          btnDisposeParamsRule,
          requestBeforeConfirmHint,
          requestBeforeConfirmText,
          deliverySelectList,
        },
        getRequestConfig,
      } = this;
      const { finalUrl, finalType, finalData } = getRequestConfig();
      let config = {
        requestConfig: {
          requestType: finalType,
          requestUrl: finalUrl,
          requestBodyData: finalData,
          requestBeforeConfirmHint,
          requestBeforeConfirmText,
        },
        tableData: this.tableData,
        externalParmas: this.externalParmas,
      };
      if (deliverySelectList) {
        config = Object.assign(config, {
          keyFieldName: keyField,
          selectList,
          paramsRule: btnDisposeParamsRule,
        });
      } else {
        config = Object.assign(config, {
          keyFieldName: '',
          selectList: [],
          paramsRule: {
            paramType: '',
            paramName: '',
          },
        });
      }
      return config;
    },

    download(list = []) {
      this.requestDownload(
        {
          [this.keyField]: list.length ? list : [],
        },
        this.listPageId
      ).then((response) => {
        const link = document.createElement('a');
        const blob = response;
        link.style.display = 'none';
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', '导出表格');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    },

    batchDel(list = []) {
      this.requestBatchDel(list, this.listPageId).then(async (res) => {
        if (res.result === '0') {
          if (this.tableData.length === list.length && this.page.pageNo > 1) {
            this.page.pageNo--;
          }
          this.$success('删除成功');
          this.queryTableData();
        }
      });
    },
    filterFieldChange(val) {
      this.filterFiled = val;
    },
    handleSetting(e) {
      e.stopPropagation();
      this.showPanel = !this.showPanel;
    },
    submitForm() {
      this.$refs[this.curDialogCompRef]?.submitForm();
    },
    handleCancel() {
      this.$refs[this.curDialogCompRef]?.handleCancel();
    },

    handleGlobalClick() {
      if (this.showPanel) this.showPanel = false;
      console.log('handleGlobalClick');
    },

    showCheckDialog(row) {
      console.log('showCheckDialog', row);
      const target = this.btnRegularOptions[0]?.formItem?.find(
        (btnOptions) => btnOptions.extraOption.btnType === 'check'
      );
      if (target) {
        switch (target.extraOption.openType) {
          case 0:
            this.disposeDynamicEvent(target.extraOption, row);
            break;
          case 2:
            this.btnConfigs.btnType = 'check';
            this.disposeFlowEvent({ btnType: 'check' }, row);
            break;
          case 4:
            this.disposeRelateCompEvent(target.extraOption, row);
            break;
          default:
            console.warn(
              '当前页面未配置openType为流程或表单或本地组件的按钮！'
            );
            break;
        }
      } else {
        console.warn('当前页面未配置btnType为check的按钮！');
      }
    },
  },

  render() {
    const {
      generalRequest,
      showSearchFrom,
      searchFrom,
      formOptions,
      attrs,
      showBtns,
      btnRegularOptions,
      handleBtnClick,
      tableData,
      filterTableOptions,
      selectListHandler,
      tableAttrs,
      pageLayout,
      page,
      handleSizeChange,
      handleCurrentChange,
      showPanel,
      panelData,
      filterFieldChange,
      handleSetting,
      refresh,
      flowVNode,
      btnRelateDialogVNode,
      importFileVNode,
      fuzzySearchPlaceholder,
      handleFilter,
      handleGlobalClick,
      showCheckDialog,
    } = this;

    const curPageListeners = {
      'update:currentPage': (val) => {
        this.page.pageNo = val;
      },
      'size-change': handleSizeChange,
      'current-change': handleCurrentChange,
    };
    console.log(
      tableAttrs.clickRowShowDetialDialog,
      'tableAttrs.clickRowShowDetialDialog'
    );
    const tableEvent = tableAttrs.clickRowShowDetialDialog
      ? {
          'row-click': showCheckDialog,
          'selection-change': selectListHandler,
        }
      : {
          'row-dblclick': showCheckDialog,
          'selection-change': selectListHandler,
        };

    const scopedSlots = {
      operator: ({ row }) => {
        row.$edit ? (
          <el-button
            {...{
              on: {
                click: onSave(row),
              },
            }}
          >
            保存
          </el-button>
        ) : null;
      },
    };

    return (
      <el-container
        class="CompleteTable"
        style={tableAttrs.style}
        nativeOnClick={handleGlobalClick}
      >
        {showSearchFrom ? (
          <el-header style="margin: 20px 0 0 0;" class="flex-header-height">
            {formOptions?.length ? (
              <base-render-form
                ref="form"
                generalRequest={generalRequest}
                form-data={searchFrom}
                form-options={formOptions}
                showFooter={false}
                use-dialog={false}
                label-width=""
                inline={true}
              ></base-render-form>
            ) : null}
          </el-header>
        ) : null}
        <el-main class="main-padding">
          <el-container style="height: 100%">
            <el-header class="flex between relative absolute-header-height">
              {showBtns ? (
                <base-render-regular
                  ref="btnForm"
                  render-options={btnRegularOptions}
                  {...{
                    on: {
                      btnClick: handleBtnClick,
                    },
                  }}
                ></base-render-regular>
              ) : null}
              <div class="operate">
                {fuzzySearchPlaceholder ? (
                  <el-input
                    style={{ width: '200px' }}
                    size="mini"
                    v-model={this.multiFieldSearch}
                    placeholder={fuzzySearchPlaceholder}
                    onChange={handleFilter}
                    clearable={true}
                  >
                    <i slot="prefix" class="el-input__icon el-icon-search"></i>
                  </el-input>
                ) : null}
                <i
                  class="el-icon-refresh-left i pointer"
                  {...{
                    on: {
                      click: refresh,
                    },
                  }}
                ></i>
                <i
                  class="el-icon-s-tools i pointer"
                  {...{
                    on: {
                      click: handleSetting,
                    },
                  }}
                ></i>

                <div class={['custom', 'absolute', showPanel ? '' : 'none']}>
                  <panel
                    data={panelData}
                    {...{
                      on: {
                        checkedChange: filterFieldChange,
                      },
                    }}
                  ></panel>
                </div>
              </div>
            </el-header>

            <el-main>
              <base-render-table
                ref="table"
                table-data={tableData}
                table-options={filterTableOptions}
                {...{
                  on: {
                    ...tableEvent,
                  },
                }}
                {...{
                  attrs: {
                    ...attrs,
                  },
                }}
                scopedSlots={scopedSlots}
              ></base-render-table>
            </el-main>
            {tableAttrs.showPagination ? (
              <el-footer>
                <el-pagination
                  class="el-pagination"
                  layout={pageLayout}
                  current-page={page.pageNo}
                  page-size={page.pageSize}
                  total={page.totalCount}
                  page-sizes={[10, 20, 50, 100]}
                  {...{ on: curPageListeners }}
                ></el-pagination>
              </el-footer>
            ) : null}
          </el-container>
        </el-main>
        {btnRelateDialogVNode()}
        {flowVNode()}
        {importFileVNode()}
      </el-container>
    );
  },
};
