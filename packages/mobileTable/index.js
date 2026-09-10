import "./index.less";
import { merge, isEmpty } from "lodash";
import { getTableAttrs, getMobileAttrs } from "../../baseConfig/tableBaseConfig";
import { align as alignOptions } from "../../baseConfig/tableSelectConfigs";
import { CELL_REBDER_TYPE } from "../../baseConfig/tableSelectConfigs";
import { str2Fn, mergeStyle } from "../../utils";
import { h } from "vue";

// 移动端列表第一期：单列卡片列表 + 详情页覆盖层。
// 仅依赖 lowcode 现有配置协议（tableOptions/tableAttrs/mobileAttrs）与宿主 inject 能力面，
// 与桌面 complete-table 二选一挂载，传参一致。
function InstanceData() {
  return {
    // 配置
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
    // 字典缓存（按dicCode复用）
    dictCache: {},
    detailLoadingMore: false
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
      return this.tableAttrs.showPagination !== false;
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
      return this.mobileAttrs.fieldLayout !== "single";
    },
    isHorizontalLabel() {
      return this.mobileAttrs.labelLayout === "horizontal";
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
      default: () => () => true
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
      getTableRenderInstance: () => this.expose_MobileTableInstance(),
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
      this.tableDisbaled = !!tableDisbaled;
      if (!json || isEmpty(json)) {
        json = await this.queryTableConfig();
      }
      this.parseTableConfig(json);
      const { externalParams = {}, dynamicExternalParams = {} } = options || {};
      this.externalParams = { ...externalParams };
      this.dynamicExternalParams = dynamicExternalParams || {};

      if (this.previewMode) {
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
      this.previewMode = true;
      if (data && !isEmpty(data)) {
        this.parseTableConfig(data);
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
      this.resolveKeyFieldCase(this.tableData);
      this.totalCount = this.tableData.length;
    },

    // 第一期仅提供注入入口，完整执行依赖第二期executeButton抽取
    emitBtnClick(row, btnId) {
      console.warn(`[mobileTable] emitBtnClick 第一期暂未接入按钮体系（btnId: ${btnId}），将于第二期支持`);
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
      this.tableAttrs = merge({}, getTableAttrs(), json.tableAttrs || {});
      // 合并规则（契约§3）：旧JSON无mobileAttrs取默认值，未来新增字段自动补默认值
      this.mobileAttrs = merge({}, getMobileAttrs(), json.mobileAttrs || {});
      this.tableConfigJSON = json.tableOptions || [];
      this.keyField = json.keyField || "";
      this.keyFieldResolved = false;
      this.pageSize = this.tableAttrs.paginationSize || 20;
      this.composeFields();
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
            align: alignOptions.find(alignItem => alignItem.id === item.align)?.value || "left",
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

    // 查询参数合并顺序与桌面getParams一致；第一期searchForm、multiFieldSearch恒为空
    getParams(data = {}) {
      return {
        prjId: this.getPrjInfo?.()?.prjId,
        ...data,
        multiFieldSearch: "",
        enterpriseId: this.enterpriseId,
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
      const page = { pageNo: this.pageNo, pageSize: this.pageSize };
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

    // 首查/刷新/外部参数变更：替换列表并回到第一页
    async loadFirst() {
      this.requestVersion++;
      const version = this.requestVersion;
      this.pageNo = 1;
      this.loading = true;
      this.loadError = false;
      try {
        const result = await this.requestPageData();
        // 旧响应不得回写列表、总数或状态；销毁后禁止异步回写
        if (this._destroyed || version !== this.requestVersion || !result) return;
        this.tableData = result.data;
        this.totalCount = result.totalCount;
        this.resolveKeyFieldCase(this.tableData);
      } catch (error) {
        if (!this._destroyed && version === this.requestVersion) {
          console.error(`[mobileTable] 加载失败：${error}`);
          this.loadError = true;
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
      const nextPage = this.pageNo + 1;
      const version = this.requestVersion;
      try {
        this.pageNo = nextPage;
        const result = await this.requestPageData();
        if (this._destroyed || version !== this.requestVersion || !result) {
          // 被新的首查/刷新抢占，丢弃本页结果
          return false;
        }
        this.tableData = this.tableData.concat(result.data);
        this.totalCount = result.totalCount || this.totalCount;
        this.resolveKeyFieldCase(this.tableData);
        return true;
      } catch (error) {
        // 失败时恢复页码、保留已有卡片、允许重试
        this.pageNo = nextPage - 1;
        this.loadMoreError = true;
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
      this.currentSelectedRow = row;
      this.detailIndex = index;
      this.detailVisible = true;
      // 预览态和禁用态不发布业务事件
      if (!this.previewMode && !this.tableDisbaled) {
        this.$emit("rowClick", row);
      }
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

      // 3. 人员：首字母头像 + 名称
      if (field.cellRenderType === CELL_REBDER_TYPE.PERSON && typeof cellValue === "string" && cellValue) {
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
          const style = `display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600;${bcgColor ? "backgroundColor:" + bcgColor + ";" : ""}${color ? "color:" + color + ";" : ""}`;
          return bcgColor || color ? <span style={style}>{label}</span> : <span>{label}</span>;
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
          // textVal支持{}占位符：{}取当前单元格的值，{fieldName}取行数据中对应字段的值（与桌面端BaseRenderTable一致）
          const text = contentTextAttr.textVal
            ? contentTextAttr.textVal.replace(/\{([^{}]*)\}/g, (match, name) => {
                const key = name.trim();
                if (key === "") {
                  return cellValue ?? "";
                }
                return this.getRowValue(row, key) ?? "";
              })
            : cellValue;
          // clickEvent.relateBtnId第一期不触发（第五期接入）
          if (contentTextAttr.iconName) {
            const iconStyle = { [`${contentTextAttr.iconPosition}TextClass`]: contentTextAttr.iconName };
            return (
              <span key={idx} style={`${style};${contentTextAttr.iconStyle}`}>
                {contentTextAttr.iconPosition === "behind" ? (
                  [
                    <span key="t" style={contentTextAttr.textStyle}>
                      {text}
                    </span>,
                    <i key="i" class={iconStyle.behindTextClass} />
                  ]
                ) : (
                  [
                    <i key="i" class={iconStyle.frontTextClass} />,
                    <span key="t" style={contentTextAttr.textStyle}>
                      {text}
                    </span>
                  ]
                )}
              </span>
            );
          }
          return (
            <span key={idx} style={`${style};${contentTextAttr.textStyle}`}>
              {text}
            </span>
          );
        });
    },

    /** ============ 渲染 ============ */

    renderCardField(field, row, index) {
      return (
        <div class={{ "mt-field": true, "mt-field-h": this.isHorizontalLabel }} key={field.fieldCode}>
          <div class="mt-field-label">{field.fieldName}</div>
          <div class="mt-field-value" style={{ textAlign: field.align }}>
            {this.renderMobileField(field, row, index, "card")}
          </div>
        </div>
      );
    },

    renderCard(row, index) {
      const titleField = this.titleField;
      return (
        <div class="mt-card" key={index} onClick={() => this.handleCardClick(row, index)}>
          {titleField ? <div class="mt-card-title">{this.renderMobileField(titleField, row, index, "card")}</div> : null}
          <div class={{ "mt-card-grid": true, "mt-grid-double": this.isDoubleLayout }}>{this.cardFields.map(field => this.renderCardField(field, row, index))}</div>
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
            <span class="mt-detail-nav-title">记录详情</span>
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
              {detailIndex + 1}/{tableData.length}
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

  render() {
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
