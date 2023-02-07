import "./table.scss";
import { mapState } from "vuex";

export default {
  data() {
    return {
      zanwu: require("@/CommonDP/assets/暂无数据.png"),
      seletionList: [],
      curRow: {},
      tableRef: "elTable",
      curCellProperty: ""
      // pageLayout: 'total,sizes, prev, pager, next,jumper', // 分页组件
    };
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
    editMode: Boolean
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

  computed: {
    ...mapState({
      enterpriseId: state => state.enterprise.enterpriseId
    })
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
      return "height:60px";
    },

    headerStyle() {
      return "background-color: #F7F9FF;color:#2E384D;padding:6px 0;height:54px;border-top:1px solid #EFF0F9";
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
        console.error("isCooperateComp方法传入的参数必须为字符串");
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
      const disabled = !(this.editMode && data.$edit && formField === this.curCellProperty);
      attrs.disabled = disabled;
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
      if (options.tagName) {
        return this.cellRender(row, options);
      } else {
        return row[options.prop];
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
        // 如不需要使用formData中的值而只是需要固定文本则可使用此字段
        contentText = "",
        // 特殊组件的额外属性值例如select组件下的option组件所需的options
        extraOption = {},
        // 当前渲染组件（即Tag）所需的属性值
        tagAttrs = {},
        // 组件所需的监听事件
        listeners = {},
        // 需要绑定的formData的属性名
        prop = "",
        tagName
      } = options;
      const disabled = !(this.editMode && row.$edit && options.prop === this.curCellProperty);
      tagAttrs.disabled = disabled;
      // tagName必须是eleui提供的已有组件或HTML已有标签,如果是只读标签，则固定使用span标签
      // Tag必须开头大写，否则会被识别为字符串
      let Tag;
      // 如果当前cell不在编辑模式且是输入框格式的，此时应该显示文本
      if (disabled && (tagName === "el-input" || tagName === "el-input-number")) {
        Tag = "span";
      } else {
        Tag = tagName;
      }
      const { getCooperateComp, isCooperateComp } = this;
      return (
        <div style="display: inline-block">
          {isCooperateComp(tagName) ? (
            getCooperateComp(tagName, tagAttrs, listeners, prop, extraOption, row)
          ) : (
            <div style="display: inline-block">
              <span style={frontTextStyle}>{frontText}</span>
              <Tag
                v-model={row[prop]}
                value={row[prop]}
                style={style}
                class={className}
                {...{
                  attrs: tagAttrs,
                  on: listeners
                }}
              >
                {row[prop] || tagAttrs?.value || contentText}
              </Tag>
              <span style={behindTextStyle}>{behindText}</span>
            </div>
          )}
        </div>
      );
    }

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
      getCellRender,
      handleCellEnter,
      handleCellLeave,
      handleCellClick,
      rowClick,
      $attrs,
      $listeners
    } = this;

    const defaultTableAttrs = {
      "row-style": rowStyle,
      "header-cell-style": headerStyle,
      "highlight-current-row": true,
      height: "100%",
      data: tableData
    };

    const defaultTableEvent = {
      "selection-change": selectListHandler,
      "row-click": rowClick,
      "cell-click": handleCellClick
      // 'cell-mouse-enter': handleCellEnter,
      // 'cell-mouse-leave': handleCellLeave,
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
      <div class="midd">
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
              return (
                <el-table-column
                  {...{
                    attrs: {
                      ...item,
                      formatter: (row, column, cellValue, index) => {
                        return item.slotName
                          ? this.$scopedSlots[item.slotName]({
                              row: row
                            })
                          : getCellRender(row, item);
                      }
                    }
                  }}
                ></el-table-column>
              );
            })
          ) : (
            <div slot="empty">
              <img src={zanwu} alt="" />
              <p style="font-size: 16px; color: #000; margin-top: 36px">暂无数据</p>
            </div>
          )}
        </el-table>
        {/* {page.totalCount > page.pageSize ? (
          <el-pagination
            class="el-pagination"
            {...{
              attrs: {
                ...defaultPageEvent,
                ...defaultPageAttrs,
              },
            }}
          ></el-pagination>
        ) : (
          ''
        )} */}
      </div>
    );
  }
};
