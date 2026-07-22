import "./table.less";
import { decorator, mergeStyle, str2Fn, str2obj } from "../../utils";
import { omit } from "lodash";
import { tableOptionsCodeExampleList } from "/utils/codeExampleList";
import onlineCode from "/packages/completeTable/component/onlineCode.vue";
import { CELL_REBDER_TYPE } from "/baseConfig/tableSelectConfigs";
import { h } from "vue";
export default {
  name: "BaseRenderTable",
  components: { onlineCode },
  data() {
    return {
      zanwu: require("@/assets/noData.png"),
      seletionList: [],
      curRow: {},
      tableRef: "elTable",
      curCellProperty: "",
      showCodeEditor: false,
      codeValue: {},
      dictRequestCache: {}
      // pageLayout: 'total,sizes, prev, pager, next,jumper', // 分页组件
    };
  },
  created() {
    this._rangeSearchDrafts = {};
    this._popoverInstances = {};
  },
  props: {
    tableData: {
      type: Array,
      required: true,
      default() {
        return [];
      }
    },
    tableOptions: {
      type: Array,
      default() {
        return [];
      }
    },
    height: String,
    listPageId: String,
    editMode: Boolean,
    headerBelowSearchList: {
      type: Array,
      default() {
        return [];
      }
    },
    searchForm: {
      type: Object,
      default() {
        return {};
      }
    },
    generalRequest: {
      type: Function,
      default() {
        return () => {};
      }
    },
    debouncedFilter: {
      type: Function,
      default() {
        return null;
      }
    },
    previewMode: Boolean
    // page: {
    //   type: Object,
    //   default() {
    //     return {
    //       pageNum: 1,
    //       pageSize: 10,
    //       totalCount: 20,
    //     };
    //   },
    // },
  },

  methods: {
    // 可以通过调用此组件的这个方法获取el-table的实例
    expose_getElTableInstance() {
      return this.$refs[this.tableRef];
    },

    // 获取当前table多选时被选中的列表数据
    expose_getSelectionList() {
      return this.seletionList;
    },

    // 获取当前被点击高亮行的数据
    expose_getCurRow() {
      return this.curRow;
    },

    expose_clearCurCellPro() {
      this.curCellProperty = "";
    },

    rowClick(row) {
      this.curRow = row;
    },

    // 批量选中
    selectListHandler(list) {
      this.seletionList = list;
    },

    rowStyle() {
      return "height:40px";
    },

    headerStyle() {
      return "background-color: #F7F9FF;color:#2E384D;padding:6px 0;height:44px;border-top:1px solid #EFF0F9";
    },

    // /** 鼠标移入cell */
    // handleCellEnter(row, column, cell, event) {
    //   const property = column.property;
    //   if (property === 'date' || property === 'name' || property === 'food') {
    //     cell.querySelector('.item__txt').classList.add('item__txt--hover');
    //   }
    // },

    // /** 鼠标移出cell */
    // handleCellLeave(row, column, cell, event) {
    //   this.$set(row, '$edit', fasle);
    // },

    /** 点击cell */
    handleCellClick(row, column, cell, event) {
      if (this.editMode) {
        this.tableData.map(item => this.$set(item, "$edit", false));
        row.$edit = true;
        this.curCellProperty = column.property;
      }
    },

    getCooperateComp(tagName, attrs, listeners, formField, extraOption, data) {
      // TODO 待添加，
      const renderFn = {
        "el-select": this.getSelectCompVNode
      };
      return renderFn[tagName](attrs, listeners, formField, extraOption, data);
    },

    // 为了冒泡，使cell的onclick事件触发
    bubbling(e) {
      const parent = e.target.parentNode;
      parent.click();
    },

    isCooperateComp(tagName) {
      if (typeof tagName !== "string") {
        console.warn("isCooperateComp方法传入的参数必须为字符串");
        return false;
      }
      // TODO 待添加，
      const cooperateComp = ["el-select"];
      return cooperateComp.indexOf(tagName) !== -1;
    },

    getSelectCompVNode(attrs, listeners, formField, extraOption, data) {
      const { options = [], props = {} } = extraOption;
      // 基础版有个添加维护字典的功能，里面返回的字段为id和cnName，因此以此字段为默认取值
      const { key = "id", label = "cnName" } = props;
      // const disabled = !(
      //   this.editMode &&
      //   data.$edit &&
      //   formField === this.curCellProperty
      // );
      attrs.disabled = !this.editMode;
      return (
        <el-select
          nativeOnClick={this.bubbling}
          v-model={data[formField]}
          {...{
            attrs,
            on: listeners
          }}
        >
          {options.map(item => {
            return <el-option key={item[key]} label={item[label]} value={item[key]} disabled={item.disabled}></el-option>;
          })}
        </el-select>
      );
    },

    getCellRender(row, options) {
      const that = this;
      const cellValue = row[options.prop];
      if (options.tagName) {
        // 正常设置的tableJson没有，只有自定义的时候有tagName
        return this.cellRender(row, options);
      } else if (options.contentTextAttrArr?.length) {
        // 检查是否有点击行为的设置
        return options.contentTextAttrArr
          .filter(item => {
            // 如果有条件判断函数，则需要判断函数返回值是否为true
            if (item.conditionalJudgment) {
              try {
                return str2Fn(item.conditionalJudgment).call(this, row);
              } catch (e) {
                console.warn(`contentTextAttr中的conditionalJudgment函数错误：${e}`);
                return false;
              }
            }
            // 否则直接返回true
            return true;
          })
          .map(contentTextAttr => {
            const cellOptions = {};
            cellOptions.wrapListeners = {
              click: function(row, $event) {
                $event.stopPropagation();
                that.$emit("clickBtn", row, contentTextAttr.clickEvent.relateBtnId);
              }
            };
            const style = mergeStyle(null, contentTextAttr);
            cellOptions.contentText = contentTextAttr.textVal || cellValue;
            if (contentTextAttr.iconName) {
              cellOptions[`${contentTextAttr.iconPosition}TextClass`] = contentTextAttr.iconName;
              cellOptions[`${contentTextAttr.iconPosition}TextStyle`] = `${style};${contentTextAttr.iconStyle}`;
            }
            cellOptions.style = `${style};flex: 1; overflow: hidden;white-space: nowrap; text-overflow: ellipsis;${contentTextAttr.textStyle}`;
            return this.cellRender(row, cellOptions);
          });
      } else if (options.cellRenderType === CELL_REBDER_TYPE.PERSON && typeof cellValue === "string") {
        return (
          <div class="user-tag">
            <span class="user-tag-av">{cellValue.at(0)}</span>
            {cellValue}
          </div>
        );
      } else if (
        options.cellRenderType === CELL_REBDER_TYPE.DICT &&
        options.enumDisplayConfig?.dicList?.length &&
        cellValue !== undefined &&
        cellValue !== null &&
        cellValue !== ""
      ) {
        // 检查是否有枚举的设置（实际上就是关联一个字典）,字典现在value只有字符串
        const target = options.enumDisplayConfig.dicList.find(item => item.dicId === `${cellValue}`);
        const label = target?.cnName || cellValue;
        let bcgColor, color;
        try {
          if (target.contentStyle) {
            const contentStyle = JSON.parse(target.contentStyle);
            bcgColor = contentStyle?.backgroundColor;
            color = contentStyle?.color;
          }
        } catch (e) {
          console.warn("解析contentStyle失败", e);
        }
        const baseStyle = `display: inline-block; padding: 2px 6px; border-radius: 6px; color: #fff; font-size: 12px; font-weight: 600; ${
          bcgColor ? "backgroundColor:" + bcgColor : ""
        };${color ? "color:" + color : ""}`;
        return bcgColor ? <div style={baseStyle}> {label}</div> : <span>{label}</span>;
      } else {
        return cellValue;
      }
    },

    cellRender(row, options) {
      const {
        // class和style不会被组件的attr所处理，会直接赋值到组件的根节点因此需要单独拿出来赋值
        className = "",
        style = "",
        // 自定义插槽
        slotName = "",
        // behindText和frontText为组件前后的文本，如需更复杂的自定义，请使用slotName
        behindText = "",
        frontText = "",
        behindTextStyle = "",
        frontTextStyle = "",
        frontTextClass = "",
        behindTextClass = "",
        // 如不需要使用formData中的值而只是需要固定文本则可使用此字段
        contentText = "",
        // 特殊组件的额外属性值例如select组件下的option组件所需的options
        extraOption = {},
        // 当前渲染组件（即Tag）所需的属性值
        tagAttrs = {},
        // 组件所需的监听事件
        listeners = {},
        wrapListeners = {},
        // 需要绑定的formData的属性名
        prop = "",
        tagName = "span",
        disabled,
        showCodeEditor = false
      } = options;

      const finalListeners = {};
      const finalWrapListeners = {};
      Object.keys(listeners).map(key => {
        finalListeners[key] = (...arr) => {
          listeners[key](row, ...arr);
        };
      });

      Object.keys(wrapListeners).map(key => {
        finalWrapListeners[key] = (...arr) => {
          wrapListeners[key](row, ...arr);
        };
      });

      if (showCodeEditor && tagName === "el-input") {
        finalListeners.focus = decorator(() => {
          this.showCodeEditor = true;
          this.codeValue = { row, prop };
        }, finalListeners.focus);
      }
      // 失去input失去焦点变为span
      // if (
      //   this.editMode &&
      //   (tagName === 'el-input' || tagName === 'el-input-number')
      // ) {
      //   listeners.blur = getHandleBlur(row, listeners.blur);
      // }
      // const disabled = !(
      //   this.editMode &&
      //   row?.$edit &&
      //   options.prop === this.curCellProperty
      // );
      // tagAttrs.disabled = disabled;
      // tagName必须是eleui提供的已有组件或HTML已有标签,如果是只读标签，则固定使用span标签
      // Tag必须开头大写，否则会被识别为字符串
      let Tag;
      // 如果当前option中disabled为true且在编辑模式且是输入框格式的，此时应该显示文本
      if (disabled && (tagName === "el-input" || tagName === "el-input-number")) {
        Tag = "span";
      } else {
        // 其余组件是否禁用取决于当前是否为编辑模式
        Tag = tagName;
        tagAttrs.disabled = !this.editMode;
      }
      //  Tag = tagName;
      //  tagAttrs.disabled = !this.editMode;
      const value = row[prop];
      const { getCooperateComp, isCooperateComp } = this;
      if (isCooperateComp(tagName)) {
        return getCooperateComp(tagName, tagAttrs, finalListeners, prop, extraOption, row);
      } else {
        return (
          <div
            style="display: flex;align-items: center;"
            {...{
              on: finalWrapListeners
            }}
          >
            <span class={frontTextClass} style={frontTextStyle}>
              {frontText}
            </span>
            <Tag
              v-model={row[prop]}
              value={value}
              style={style}
              class={className}
              {...{
                attrs: tagAttrs
              }}
              {...{
                on: finalListeners
              }}
            >
              {tagAttrs?.value || contentText || value}
            </Tag>
            <span class={behindTextClass} style={behindTextStyle}>
              {behindText}
            </span>
          </div>
        );
      }
    },

    getSelectOptions(headerItem, createEl) {
      const searchWidgetConfig = headerItem?.searchWidgetConfig || {};
      const extraOption = searchWidgetConfig?.extraOption || {};
      const request = searchWidgetConfig?.request || {};
      let options = [];
      let key = "id";
      let label = "cnName";

      try {
        options = extraOption.options;
        const { key: ek = "id", label: el = "cnName" } = extraOption.props || {};
        key = ek;
        label = el;

        if ((request?.autoFillOptions || (request?.require && request?.url)) && !this.editMode) {
          const cacheKey = `${headerItem.fieldCode}`;
          if (!this.dictRequestCache[cacheKey]) {
            this.$set(this.dictRequestCache, cacheKey, {
              status: "pending",
              options: [],
              labelTranslateType: extraOption.labelTranslateType
            });
          }
          const cacheEntry = this.dictRequestCache[cacheKey];
          if (request.autoFillOptions && cacheEntry.status === "pending") {
            cacheEntry.options = [];
            cacheEntry.status = "loading";
            this.autoFillOptions(request, headerItem.fieldCode, cacheEntry);
          } else if (request?.require && request?.url) {
            if (typeof cacheEntry.labelTranslateType === "number") {
              key = "dicId";
              label = "cnName";
            }
            this.disposeDictRequest(request, cacheEntry);
          }
          options = cacheEntry.options;
        }
      } catch (e) {
        console.error("表头下组件解析SelectOption失败", e);
        options = [];
      }

      return options.map(opt =>
        createEl("el-option", {
          attrs: {
            key: opt[key],
            label: opt[label],
            value: opt[key]
          }
        })
      );
    },

    getCascaderOptions(headerItem) {
      const extraOption = headerItem?.searchWidgetConfig?.extraOption || {};
      const request = headerItem?.searchWidgetConfig?.request || {};
      const { options = [], props = {} } = extraOption;
      const { props: props1 = {} } = headerItem.searchWidgetConfig?.tagAttrs;
      const baseProps = { emitPath: false, ...props1 };
      props.value = props.key;
      if (request?.require && request?.url && !this.editMode) {
        const cacheKey = `${headerItem.fieldCode || request.url}`;
        this.$set(this.dictRequestCache, cacheKey, this.dictRequestCache[cacheKey] || { status: "pending", options: [] });
        const cacheEntry = this.dictRequestCache[cacheKey];
        this.disposeCascaderRequest(request, cacheEntry);
        return { options: cacheEntry.options, props: { ...baseProps, ...props } };
      }
      return { options, props: { ...baseProps, ...props } };
    },

    disposeCascaderRequest(request, cacheEntry) {
      console.log("disposeCascaderRequest", request, cacheEntry);
      if (this.previewMode) return;
      if (cacheEntry.status === "pending") {
        cacheEntry.status = "loading";
        const { url, type, params = "" } = request;
        const finalType = typeof type === "string" ? type : type === 0 ? "post" : "get";
        this.generalRequest(url, finalType, str2obj(params)).then(res => {
          cacheEntry.options = res.data || [];
          this.$forceUpdate();
        });
      }
    },

    autoFillOptions(request, fieldCode, cacheEntry) {
      if (this.previewMode) return;
      this.generalRequest("/dyn-common/page-list/queryDictColumnDataList", "post", {
        listPageId: this.listPageId,
        idFieldName: fieldCode || "",
        titleFieldName: request?.labelFieldName || ""
      }).then(res => {
        if (!request?.labelFieldName) {
          cacheEntry.options = res.data.map(item => ({
            id: item.id,
            cnName: item.id
          }));
        } else {
          cacheEntry.options = res.data;
        }
        this.$forceUpdate();
      });
    },

    disposeDictRequest(request, cacheEntry) {
      if (this.previewMode) return;
      if (request?.require && request?.url && cacheEntry.status === "pending") {
        cacheEntry.status = "loading";
        cacheEntry.options = [];
        // 字典类型默认props
        if (typeof cacheEntry.labelTranslateType === "number") {
          cacheEntry.props = {
            key: "dicId",
            label: "cnName"
          };
        }
        const { url, type, params = "" } = request;
        const finalType = typeof type === "string" ? type : type === 0 ? "post" : "get";
        this.generalRequest(url, finalType, str2obj(params)).then(res => {
          res.data
            .sort((a, b) => a.sortNum - b.sortNum)
            .map(item => {
              if (cacheEntry.labelTranslateType === 1) {
                item[cacheEntry.props.label] = `${item[cacheEntry.props.key]}-${item[cacheEntry.props.label]}`;
              }
              cacheEntry.options.push(item);
            });
          this.$forceUpdate();
        });
      }
    },

    renderHeaderSearch(column, headerItem, createEl) {
      const { searchWidgetConfig, fieldCode } = headerItem;
      const { searchWidgetType, tagAttrs = {} } = searchWidgetConfig || {};
      const value = this.searchForm?.[fieldCode];

      const baseAttrs = {
        clearable: true,
        size: "small",
        ...tagAttrs
      };
      delete baseAttrs.placeholder;
      const setValue = val => {
        if (this.searchForm) {
          this.$set(this.searchForm, fieldCode, val);
        }
      };
      const filterHandler = () => {
        if (!this.editMode) {
          this.debouncedFilter?.();
        }
      };
      const setValueAndFilter = val => {
        setValue(val);
        filterHandler();
      };

      switch (searchWidgetType) {
        case 0:
          // el-input 单行文本框
          return createEl("el-input", {
            attrs: baseAttrs,
            model: { value, callback: setValue },
            on: { change: filterHandler }
          });
        case 1: {
          // 范围输入字段 - 只读input + popover弹窗（无蒙层，类似select）
          // 弹窗内数据不依赖响应式，走原生DOM读写
          const startKey = fieldCode + "Start";
          const endKey = fieldCode + "End";
          const draftKey = `_r_${fieldCode}`;
          if (!this._rangeSearchDrafts[draftKey]) {
            this._rangeSearchDrafts[draftKey] = { start: "", end: "" };
          }
          const draft = this._rangeSearchDrafts[draftKey];
          const popperClass = `search-range-${fieldCode.replace(/[^a-zA-Z0-9]/g, "")}`;
          const startVal = this.searchForm?.[startKey] || "";
          const endVal = this.searchForm?.[endKey] || "";
          const displayText = startVal || endVal ? `${startVal}-${endVal}` : "";
          const closePopover = () => {
            const inst = this._popoverInstances[fieldCode];
            if (inst && inst.doClose) inst.doClose();
          };
          const readInputs = () => {
            const popperEl = document.querySelector(`.${popperClass}`);
            if (popperEl) {
              const inputs = popperEl.querySelectorAll("input.el-input__inner");
              draft.start = inputs[0]?.value || "";
              draft.end = inputs[1]?.value || "";
            }
          };

          return createEl(
            "el-popover",
            {
              ref: el => {
                this._popoverInstances[fieldCode] = el;
              },
              attrs: {
                placement: "bottom-start",
                trigger: "click",
                "popper-class": popperClass
              },
              on: {
                show: () => {
                  draft.start = this.searchForm?.[startKey] || "";
                  draft.end = this.searchForm?.[endKey] || "";
                  setTimeout(() => {
                    const popperEl = document.querySelector(`.${popperClass}`);
                    if (popperEl) {
                      const inputs = popperEl.querySelectorAll("input.el-input__inner");
                      if (inputs[0]) inputs[0].value = draft.start;
                      if (inputs[1]) inputs[1].value = draft.end;
                    }
                  }, 100);
                }
              }
            },
            [
              createEl("el-input", {
                slot: "reference",
                style: { cursor: "pointer" },
                attrs: {
                  ...baseAttrs,
                  readonly: true,
                  value: displayText
                }
              }),
              createEl("div", { style: "padding: 12px; width: 340px;" }, [
                createEl("div", { style: "display: flex; align-items: center; margin-bottom: 12px;" }, [
                  createEl("div", { class: "el-input el-input--small", style: "flex: 1;" }, [
                    createEl("input", {
                      class: "el-input__inner",
                      attrs: { placeholder: "起始值", type: "text" },
                      on: { input: readInputs }
                    })
                  ]),
                  createEl("span", { style: "margin: 0 8px; flex-shrink: 0; color: #999;" }, ["-"]),
                  createEl("div", { class: "el-input el-input--small", style: "flex: 1;" }, [
                    createEl("input", {
                      class: "el-input__inner",
                      attrs: { placeholder: "结束值", type: "text" },
                      on: { input: readInputs }
                    })
                  ])
                ]),
                createEl("div", { style: "text-align: right;" }, [
                  createEl(
                    "el-button",
                    {
                      attrs: { size: "mini" },
                      on: { click: closePopover }
                    },
                    ["取消"]
                  ),
                  createEl(
                    "el-button",
                    {
                      attrs: { size: "mini", type: "primary" },
                      on: {
                        click: () => {
                          readInputs();
                          this.$set(this.searchForm, startKey, draft.start);
                          this.$set(this.searchForm, endKey, draft.end);
                          filterHandler();
                          closePopover();
                        }
                      }
                    },
                    ["确认"]
                  )
                ])
              ])
            ]
          );
        }
        case 2:
          // el-select 组合下拉框
          return createEl(
            "el-select",
            {
              attrs: {
                ...baseAttrs,
                placeholder: " "
              },
              model: { value, callback: setValueAndFilter }
            },
            this.getSelectOptions(headerItem, createEl)
          );
        case 3:
          // el-date-picker 日期选择框
          return createEl("el-date-picker", {
            attrs: {
              ...baseAttrs,
              type: "date",
              "value-format": "yyyy-MM-dd"
            },
            model: { value, callback: setValueAndFilter }
          });
        case 5:
          // el-cascader 级联选择器
          return createEl("el-cascader", {
            attrs: {
              "show-all-levels": false,
              ...baseAttrs,
              ...this.getCascaderOptions(headerItem),
              placeholder: " "
            },
            props: { value },
            on: { change: setValueAndFilter }
          });
        case 6: {
          // dictionary 字典选择器
          const { extraOption: dictExtraProp = {}, request } = searchWidgetConfig;
          const cacheKey = fieldCode;
          let cacheEntry = this.dictRequestCache[cacheKey];
          if (!cacheEntry) {
            cacheEntry = {
              status: "pending",
              options: [],
              props: dictExtraProp.props || {},
              labelTranslateType: dictExtraProp.labelTranslateType
            };
            this.dictRequestCache[cacheKey] = cacheEntry;
          }
          this.disposeDictRequest(request, cacheEntry);
          const { key: dictKey = "id", label: dictLabel = "cnName" } = cacheEntry.props;
          const dictOptions = cacheEntry.options;
          return createEl(
            "el-select",
            {
              attrs: { ...baseAttrs, placeholder: " " },
              model: { value, callback: setValueAndFilter }
            },
            dictOptions.map(opt =>
              createEl("el-option", {
                attrs: {
                  key: opt[dictKey],
                  label: opt[dictLabel],
                  value: opt[dictKey]
                }
              })
            )
          );
        }
        case 4:
          // 日期范围选择器 - 表现是一个input，操作同日期范围选择器
          return createEl("el-date-picker", {
            class: "no-date-picker-icons",
            attrs: {
              ...baseAttrs,
              type: "daterange",
              "range-separator": "-",
              "value-format": "yyyy-MM-dd"
            },
            model: { value, callback: setValueAndFilter }
          });
        default:
          return createEl("el-input", {
            attrs: baseAttrs,
            model: { value, callback: setValue },
            on: { change: filterHandler }
          });
      }
    },

    tableColumnRender(item) {
      const { getCellRender, tableColumnRender } = this;
      if (item.formatter && !item.cellFormatterComponent) {
        const { components = {}, inject = ["getTableRenderInstance", "emitBtnClick"], data, computed = {}, watch = {}, methods = {}, template = "" } = item.formatter();
        item.cellFormatterComponent = Vue.extend({
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
      if (item.renderHeader && !item.cellHeaderFormatterComponent) {
        item.cellHeaderFormatterComponent = Vue.extend({
          components: item.renderHeader().components || {},
          props: { column: Object, index: Number },
          // eslint-disable-next-line
          data:
            item.renderHeader().data ||
            function() {
              return {};
            },
          computed: item.renderHeader().computed || {},
          watch: item.renderHeader().watch || {},
          methods: item.renderHeader().methods || {},
          render: Vue.compile(item.renderHeader().template || "").render
        });
      }
      const renderHeader = (createEl, { column, index }) => {
        if (item.cellHeaderFormatterComponent) {
          return createEl(item.cellHeaderFormatterComponent, {
            props: { column, index }
          });
        } else if (this.headerBelowSearchList?.some(hItem => hItem.fieldCode === column.property)) {
          // 处理表头下的搜索
          const headerItem = this.headerBelowSearchList.find(hItem => hItem.fieldCode === column.property);
          return createEl("div", { class: "hb-search-header", on: { click: e => e.stopPropagation() } }, [
            createEl("div", { class: "hb-search-label" }, [column.label]),
            this.renderHeaderSearch(column, headerItem, createEl)
          ]);
        } else {
          return createEl("span", [`${column.label}`]);
        }
      };

      const formatter = (row, column, cellValue, index) => {
        return item.slotName
          ? this.$scopedSlots[item.slotName]
            ? this.$scopedSlots[item.slotName]({
                row: row
              })
            : (console.warn(`slot : ${item.slotName} 未定义！`), "")
          : item.formatter
          ? h(item.cellFormatterComponent, {
              props: { row, index }
            })
          : getCellRender(row, item);
      };

      const attr = omit(item, [
        "className",
        "style",
        "formatter",
        "cellFormatterComponent",
        "renderHeader",
        "cellHeaderFormatterComponent",
        "contentTextAttrArr",
        "enumDisplayConfig"
      ]);

      return (
        <el-table-column
          {...{
            attrs: {
              ...attr,
              key: item?.prop || item.type,
              formatter,
              renderHeader
            }
          }}
        >
          {item.children && item.children.length
            ? item.children.map(child => {
                return tableColumnRender(child);
              })
            : null}
        </el-table-column>
      );
    },

    // handleSizeChange(val) {
    //   this.$emit('handleSizeChange', val);
    // },

    // handleCurrentChange(val) {
    //   this.$emit('handleCurrentChange', val);
    // },

    // prevClick(val) {
    //   this.$emit('prevClick', val);
    // },

    // nextClick(val) {
    //   this.$emit('nextClick', val);
    // },
    handleClose() {
      this.showCodeEditor = false;
    }
  },

  render() {
    const {
      tableOptions,
      tableData,
      tableRef,
      rowStyle,
      headerStyle,
      selectListHandler,
      zanwu,
      handleCellClick,
      rowClick,
      $attrs,
      $listeners,
      tableColumnRender,
      codeValue,
      showCodeEditor,
      handleClose,
      height
    } = this;
    const defaultTableAttrs = {
      "row-style": rowStyle,
      "header-cell-style": headerStyle,
      "highlight-current-row": true,
      data: tableData,
      height
    };

    const defaultTableEvent = {
      "selection-change": selectListHandler,
      "row-click": rowClick,
      "cell-click": handleCellClick
      // 'cell-mouse-enter': handleCellEnter,
      // 'cell-mouse-leave': handleCellLeave,
    };
    let defaultOnlineDialogAttrs;
    if (showCodeEditor) {
      defaultOnlineDialogAttrs = {
        dialogAttrs: {
          title: tableOptions.find(item => item.prop === codeValue.prop)?.label || "代码编写"
        },
        modelValue: codeValue.row[codeValue.prop]
      };
      if (["formatter", "renderHeader"].includes(codeValue.prop)) {
        defaultOnlineDialogAttrs.useTabLayout = true;
        defaultOnlineDialogAttrs.exampleList = tableOptionsCodeExampleList[codeValue.prop];
      } else {
        defaultOnlineDialogAttrs.codeExampleVal = tableOptionsCodeExampleList[codeValue.prop];
      }
    }

    const codeEditorListeners = {
      confirm: val => {
        codeValue.row[codeValue.prop] = val;
      },
      close: handleClose
    };
    // const defaultPageAttrs = {
    //   'current-page': page.pageNum,
    //   'page-size': page.pageSize,
    //   layout: pageLayout,
    //   total: page.total,
    //   'page-sizes': [10, 20, 50, 100],
    //   size: 'small',
    //   background: true,
    // };

    // const defaultPageEvent = {
    //   'on-handle-size-change': handleSizeChange,
    //   'on-handle-current-change': handleCurrentChange,
    //   'on-prev-click': prevClick,
    //   'on-next-click': nextClick,
    // };

    return (
      <div class="baseRenderTableMidd">
        {/* el-table对于rowkey属性并没有进行watch，导致如果一开始传入undefined。则后续传入值也不会应用树状结构 */}
        {tableOptions && tableOptions.length ? (
          <el-table
            ref={tableRef}
            {...{
              attrs: {
                ...defaultTableAttrs,
                ...$attrs
              },
              on: {
                ...defaultTableEvent,
                ...$listeners
              }
            }}
          >
            {tableOptions && tableOptions.length > 0 ? (
              tableOptions.map(item => {
                return tableColumnRender(item);
              })
            ) : (
              <div slot="empty">
                <img src={zanwu} alt="" />
                <p style="font-size: 16px; color: #000; margin-top: 36px">暂无数据</p>
              </div>
            )}
          </el-table>
        ) : null}
        {showCodeEditor ? (
          <onlineCode
            {...{
              attrs: { ...defaultOnlineDialogAttrs },
              on: {
                ...codeEditorListeners
              }
            }}
          ></onlineCode>
        ) : null}
      </div>
    );
  }
};
