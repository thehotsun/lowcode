import './index.less';
import BaseRenderTable from '../BaseRenderTable/index';
import BaseRenderForm from '../BaseRenderForm/index';
import BaseRenderRegular from '../BaseRenderRegular/index';
import panel from './component/panel.vue';
import { align, searchWidget } from '../../baseConfig/tableSelectConfigs';
import { getElBtnConfig } from '../../baseConfig/widgetBaseConfig';
import {
  setPlaceholder,
  getWidgetOptions,
  setColSpan,
  exec,
  getWidgetDefaultVal,
  str2obj,
  depthFirstSearchWithRecursive,
  str2Fn,
  setTableAttrs,
  getSummaries,
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
    // pageLayout: {
    //   type: String,
    //   default: function () {
    //     'total,sizes, prev, pager, next,jumper'
    //   }
    // },

    listPageId: String,
  },
  data() {
    return {
      pageLayout: '->, total,sizes, prev, pager, next,jumper',
      dialogVisibleForm: false,
      rule: [],
      option: {},
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
      dialogTitle: '表单',
      btnRegularOptions: [],
      showSearchFrom: true,
      showBtns: true,
      formId: '',
      primaryKeyValue: '',
      // 按钮代表的一系列事件完毕以后是否刷新列表
      isRefresh: false,
      showPanel: false,
      // 选中的table数据
      selectList: [],
      panelData: [],
      filterFiled: [],
      keyField: '',
      onlyRead: false,
      previewMode: false,
      tableAttrs: {
        // 初始化是否显示分页
        showPagination: false,
        isShowCheckbox: false,
        isShowIndex: false,
        index: '',
        stripe: false,
        border: false,
        showSummary: false,
        summaryMethod: getSummaries,
        size: '',
        isTree: false,
        treeProps: '',
        rowKey: '',
        lazy: false,
        load: '',
        isMerge: false,
        spanMethod: '',
      },
      btnsAuthorize: [],
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

  mounted() {
    // this.init()
  },

  methods: {
    expose_showDialog(formId) {
      this.dialogVisibleForm = true;
      this.formId = formId;
      // this.queryFormConfig(formId)
    },

    expose_hideDialog() {
      this.dialogVisibleForm = false;
      this.resetFromData();
    },

    expose_preview(data) {
      this.previewMode = true;
      this.parseTableConfig(data);
      const tableData = {};
      this.composeData(tableData);
      this.tableData = [tableData];
    },

    resetFromData() {
      // this.rule = []
      // this.option = {}
      this.formId = '';
    },

    // queryFormConfig (formId) {
    //   this.requestFormConfig(formId).then(res => {
    //     const { rule, option } = JSON.parse(res.data);
    //     this.rule = rule;
    //     this.option = option;
    //   })
    // },

    // 保存表单
    async onSubmit(data) {
      this.$emit('onSubmit', data);
      this.expose_hideDialog();
      // await this.requestFormConfirm(this.formid, data)
      this.isRefresh && this.queryTableData();
    },

    // 预览的时候用，创建一个全为空字符串的对象
    setEmptyTableData(emptyData = {}, fieldCode) {
      emptyData[fieldCode] = '';
    },

    async init() {
      await this.queryTableConfig();
      this.queryTableData();
      this.composeData();
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
          width: '55',
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
        // 只有搜索控件有值，才会添加到options中
        if (searchWidgetName) {
          // this.$set(this.searchFrom, item.fieldCode, '');
          setFromField(
            this.searchFrom,
            item.fieldCode,
            item.searchWidgetConfig,
            searchWidgetName
          );
          const options = getWidgetOptions(searchWidgetName, item);
          console.log(
            cloneDeep(item.searchWidgetConfig),
            depthFirstSearchWithRecursive(item.searchWidgetConfig)
          );
          formOptions.push(
            merge(
              options,
              depthFirstSearchWithRecursive(item.searchWidgetConfig)
            )
          );
        }
        // 如果循环到最后一个且存在其他筛选项，则对formOptions通过sortNumb进行排序，复制一份最原始的form,添加筛选和重置按钮
        if (length - 1 === index && formOptions.length) {
          this.rawSearchFrom = cloneDeep(this.searchFrom);
          formOptions = formOptions.sort((a, b) => {
            const prev = Number(a.sortNumb);
            const next = Number(b.sortNumb);
            if (prev < next) {
              return -1;
            } else if (prev > next) {
            } else {
              return 0;
            }
          });
          formOptions.push(...this.getBtnConfig());
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

    getBtnConfig() {
      const customAttr = (contentText) =>
        this.previewMode
          ? {
              contentText,
              tagAttrs: {
                disabled: this.previewMode,
              },
            }
          : {
              contentText,
            };
      const filterConfig = getElBtnConfig(
        'primary',
        this.handleFilter,
        customAttr('筛选')
      );
      const resetConfig = getElBtnConfig(
        '',
        this.handleReset,
        customAttr('重置')
      );
      setColSpan(filterConfig, 2);
      setColSpan(resetConfig, 2);
      return [
        {
          formItemAttrs: { 'label-width': '35px' },
          child: [filterConfig, resetConfig],
        },
      ];
    },

    handleFilter() {
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

    refresh() {
      this.queryTableData().then(() => {
        this.$success('刷新成功');
      });
    },
    // 此处要处理两个字段使用同一input的模糊搜索
    getParams() {
      // 去掉最后添加的按钮
      if (this.formOptions?.length) {
        const formItem = this.formOptions[0].formItem.slice(0, -1);
        const extraParams = {};
        formItem.map((item) => {
          const { relateOtherField = [], formField = '' } = item;
          if (relateOtherField.length) {
            relateOtherField.map((fieldName) => {
              extraParams[fieldName] = this.searchFrom[formField];
            });
          }
        });
        return {
          ...this.searchFrom,
          ...extraParams,
        };
      } else {
        return this.searchFrom;
      }
    },

    queryTableData() {
      const params = this.getParams();
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
      const { tableOptions, formOptions, keyField } = data;
      this.tableAttrs = setTableAttrs(data);
      if (formOptions?.length) {
        this.btnRegularOptions = this.composeBtnRegularOptions(formOptions);
      } else {
        this.showBtns = false;
      }
      this.tableConfigJSON = tableOptions;
      this.keyField = keyField;
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
      // config = config.filter((item) => {
      //   return this.btnsAuthorize[item.authorize];
      // });
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

    handleBtnClick({
      relateFrom = '',
      openType = '',
      openUrl = '',
      fn = '',
      isRefresh = false,
      defaultFn = '',
      btnType = '',
    }) {
      console.log(defaultFn, 'defaultFn');
      this.isRefresh = isRefresh;
      if (fn) {
        this.exec(fn);
      } else {
        if (openType === 1) {
          return this.$router.push(openUrl, relateFrom);
        }
        switch (btnType) {
          case 'add':
            this.expose_showDialog(relateFrom);
            this.onlyRead = false;
            this.primaryKeyValue = '';
            this.dialogTitle = '新增';
            break;
          case 'check':
          case 'edit':
            if (this.selectList.length === 1) {
              this.primaryKeyValue = this.selectList[0][this.keyField];
              this.expose_showDialog(relateFrom);
              this.onlyRead = btnType === 'check';
              this.dialogTitle = btnType === 'check' ? '查看' : '编辑';
            } else {
              this.$warn('请确认只选中了一个值');
            }
            break;
          case 'download':
            if (this.previewMode) return;
            this.download(this.selectList.map((item) => item[this.keyField]));
            break;
          case 'batchDel':
            if (this.previewMode) return;
            this.batchDel(this.selectList.map((item) => item[this.keyField]));
            break;
          default:
            break;
        }
      }
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
      this.requestBatchDel(list, this.listPageId).then((res) => {
        if (res.result === '0') {
          this.$success('删除成功');
          this.queryTableData();
        }
      });
    },
    filterFieldChange(val) {
      this.filterFiled = val;
    },
    handleSetting() {
      this.showPanel = !this.showPanel;
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
      dialogVisibleForm,
      expose_hideDialog,
      formId,
      primaryKeyValue,
      onlyRead,
      onSubmit,
      showPanel,
      panelData,
      filterFieldChange,
      handleSetting,
      refresh,
      dialogTitle,
      previewMode,
    } = this;

    const curPageListeners = {
      'update:currentPage': (val) => {
        this.page.pageNo = val;
      },
      'size-change': handleSizeChange,
      'current-change': handleCurrentChange,
    };
    const visibleListeners = {
      // 关键代码 - 1
      'update:visible': (val) => {
        this.dialogVisibleForm = val;
      },
      'before-close': expose_hideDialog,
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
      <el-container class="CompleteTable" style="height: 100%">
        {showSearchFrom ? (
          <el-header style="margin: 20px 0 0 0;" class="flex-header-height">
            <base-render-form
              ref="form"
              generalRequest={generalRequest}
              form-data={searchFrom}
              form-options={formOptions}
              showFooter={false}
              use-dialog={false}
              isSearch={true}
            ></base-render-form>
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
                <i
                  class="el-icon-refresh-left i"
                  {...{
                    on: {
                      click: refresh,
                    },
                  }}
                ></i>
                <i
                  class="el-icon-s-tools i"
                  {...{
                    on: {
                      click: handleSetting,
                    },
                  }}
                ></i>
                {showPanel ? (
                  <div class="custom absolute">
                    <panel
                      data={panelData}
                      {...{
                        on: {
                          checkedChange: filterFieldChange,
                        },
                      }}
                    ></panel>
                  </div>
                ) : null}
              </div>
            </el-header>

            <el-main>
              <base-render-table
                ref="table"
                table-data={tableData}
                table-options={filterTableOptions}
                {...{
                  on: {
                    'selection-change': selectListHandler,
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
        {dialogVisibleForm ? (
          <el-dialog
            title={dialogTitle}
            visible={dialogVisibleForm}
            {...{ on: visibleListeners }}
            close-on-click-modal={false}
            close-on-press-escape={false}
            width="1200px"
            append-to-body
            v-draggable
          >
            {formId ? (
              previewMode ? (
                <VFPreview
                  primaryKeyValue={primaryKeyValue}
                  isDisabled={onlyRead}
                  hasSubmit={!onlyRead && !previewMode}
                  formId={formId}
                  {...{
                    on: {
                      submit: onSubmit,
                    },
                  }}
                ></VFPreview>
              ) : (
                <VFRuntime
                  primaryKeyValue={primaryKeyValue}
                  isDisabled={onlyRead}
                  hasSubmit={!onlyRead && !previewMode}
                  formId={formId}
                  {...{
                    on: {
                      submit: onSubmit,
                    },
                  }}
                ></VFRuntime>
              )
            ) : null}
          </el-dialog>
        ) : null}
      </el-container>
    );
  },
};
