import "./index.less";
import { getter, getHandleInput, str2obj, str2Fn, decorator, setter } from "../../utils";
import { convertDynaticData } from "../../utils/interfaceParams";
import { isEmpty, cloneDeep } from "lodash";
import onlineCode from "/packages/completeTable/component/onlineCode.vue";
import { tableBtnCodeExampleList } from "/utils/codeExampleList";
export default {
  name: "BaseRenderForm",
  components: { onlineCode },
  props: {
    isCollapse: {
      type: Boolean
    },
    maxHeight: {
      type: Number
    },
    generalRequest: {
      type: Function
    },
    rules: {
      type: Object
    },
    formOptions: {
      type: Array
    },
    formData: {
      type: Object
    },
    useDialog: {
      type: Boolean,
      default() {
        return true;
      }
    },
    dialogTitle: String,
    dialogOptions: {
      type: Object
    },
    onlyShow: Boolean,
    showFooter: {
      type: Boolean,
      default() {
        return true;
      }
    },
    getParams: {
      type: Function,
      default() {
        return () => () => {};
      }
    },
    listPageId: {
      type: String,
      default() {
        return "";
      }
    },
    mode: {
      type: String,
      default() {
        return "";
      }
    }
  },
  data() {
    return {
      formRef: "elForm",
      dialogRef: "elDialog",
      showDialog: true,
      showCodeEditor: false,
      codeValue: {},
      isExpanded: false,
      isOverflow: false
    };
  },
  computed: {
    finalRenderOptions() {
      // 对所有元素的监听事件进行处理， 使其能访问到当前组件的this
      return (
        this.formOptions?.map(rowItem => {
          const ectype = Vue.observable(cloneDeep(rowItem));
          if (Array.isArray(ectype.formItem)) {
            ectype.formItem.map(item => {
              if (!isEmpty(item.listeners)) {
                Object.keys(item.listeners).map(eventName => {
                  if (item.listeners[eventName].isWrap) return;
                  const originFn = item.listeners[eventName];
                  item.listeners[eventName] = (...argus) => originFn.call(this, ...argus);
                });
              }
              if (item.child?.length) {
                item.child.map(child => {
                  const listeners = child.listeners;
                  if (!isEmpty(listeners)) {
                    Object.keys(listeners).map(eventName => {
                      console.log(eventName, "eventName");
                      if (listeners[eventName].isWrap) return;
                      const originFn = listeners[eventName];
                      child.listeners[eventName] = (...argus) => originFn.call(this, ...argus);
                    });
                  }
                });
              }
              return item;
            });
          } else {
            const listeners = ectype.formItem.listeners;
            if (!isEmpty(listeners)) {
              Object.keys(listeners).map(eventName => {
                console.log(eventName, "eventName");
                if (listeners[eventName].isWrap) return;
                const originFn = listeners[eventName];
                ectype.formItem.listeners[eventName] = (...argus) => originFn.call(this, ...argus);
              });
            }
            if (ectype.formItem.child?.length) {
              ectype.formItem.child.map(child => {
                const listeners = child.listeners;
                if (!isEmpty(listeners)) {
                  Object.keys(listeners).map(eventName => {
                    console.log(eventName, "eventName");
                    if (listeners[eventName].isWrap) return;
                    const originFn = listeners[eventName];
                    child.listeners[eventName] = (...argus) => originFn.call(this, ...argus);
                  });
                }
              });
            }
          }
          return ectype;
        }) || []
      );
    }
  },
  watch: {},
  async created() {
    // this.init();
  },
  mounted() {
    if (this.isCollapse) {
      this.checkOverflow();
    }
  },
  methods: {
    // 可以通过调用此组件的这个方法获取el-form的实例
    expose_getElFormInstance() {
      return this.$refs[this.formRef];
    },

    // 可以通过调用此组件的这个方法获取el-dialog的实例
    expose_getElDialogInstance() {
      if (this.useDialog) return this.$refs[this.dialogRef];
      else console.error("请将porps useDialog设置为true");
    },

    // 设置showDialog
    expose_setShowDialog(bool) {
      this.showDialog = bool;
    },

    toggleExpand() {
      this.isExpanded = !this.isExpanded;
    },

    checkOverflow() {
      this.$nextTick(() => {
        const el = this.$refs.flexWrapBox.$el;
        if (el.scrollHeight > this.maxHeight) {
          this.isOverflow = true;
        }
      });
    },

    requestData({ url = "", type = "get", params = "" }, extraOption) {
      params = str2obj(params);
      const baseParams = this.getParams() || {};
      params = convertDynaticData(params, baseParams, this);
      this.generalRequest(url, type, params).then(res => {
        res.data
          .sort((a, b) => a.sortNum - b.sortNum)
          .map(item => {
            if (extraOption.labelTranslateType === 1) {
              item[extraOption.props.label] = `${item[extraOption.props.key]}-${item[extraOption.props.label]}`;
            }
            extraOption.options.push(item);
          });
        this.$forceUpdate();
      });
    },

    autoFillOptions(request, extraOption, formField) {
      const baseParams = this.getParams() || {};
      this.generalRequest("/dyn-common/page-list/queryDictColumnDataList", "post", {
        listPageId: this.listPageId,
        idFieldName: formField,
        titleFieldName: request?.labelFieldName || "",
        ...baseParams
      }).then(res => {
        if (!request?.labelFieldName) {
          extraOption.options = res.data.map(item => {
            return {
              id: item.id,
              cnName: item.id
            };
          });
        } else {
          extraOption.options = res.data;
        }
        this.$forceUpdate();
      });
    },

    disposeRequest(request, extraOption, formField) {
      // 设计态不请求接口
      if (this.mode === "design") return;
      if (request?.autoFillOptions && request.status === "pending") {
        extraOption.options = [];
        this.autoFillOptions(request, extraOption, formField);
        request.status = "finish";
      } else if (request?.require && request?.url && request.status === "pending") {
        extraOption.options = [];
        // 这个有值代表是字典类型得，字典类型默认props为此
        if (typeof extraOption.labelTranslateType === "number") {
          extraOption.props = {
            key: "dicId",
            label: "cnName"
          };
        }
        this.requestData(request, extraOption);
        request.status = "finish";
        // exec(request);
      }
    },

    handleClose() {
      this.showDialog = false;
      this.$emit("onClose");
    },

    async handleSubmit() {
      this.expose_getElFormInstance().validate(valid => {
        if (valid) {
          this.$emit("onSubmit", this.formData);
          this.handleClose();
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },

    getCooperateComp({ tagName, ...options }) {
      // TODO 待添加，
      const renderFn = {
        "el-select": this.getSelectCompVNode,
        "el-cascader": this.getCascaderCompVNode,
        "el-radio-group": this.getRadioGroupCompVNode,
        "el-checkbox-group": this.getCheckboxGroupCompVNode,
        "el-tooltip": this.getTooltipCompVNode
      };
      return renderFn[tagName] && renderFn[tagName](options);
    },

    getFlatListVNode({ options, key, label, model, attrs, listeners }) {
      console.log(options, "options");
      return (
        <el-checkbox-group
          value={model}
          {...{
            attrs,
            on: listeners
          }}
        >
          {options.map(item => {
            return (
              <el-checkbox-button key={item[key]} label={item[key]}>
                {item[label]}
              </el-checkbox-button>
            );
          })}
        </el-checkbox-group>
      );
    },

    getSelectCompVNode({ tagAttrs: attrs, listeners, formField, extraOption, request, isFlat }) {
      this.disposeRequest(request, extraOption, formField);
      let { options = [], props = {} } = extraOption;
      const { formData, onlyShow } = this;
      // 基础版有个添加维护字典的功能，里面返回的字段为id和cnName，因此以此字段为默认取值
      const { key = "id", label = "cnName" } = props;
      let model = getter(formData, formField);
      return isFlat ? (
        this.getFlatListVNode({ options, key, label, model, attrs, listeners })
      ) : (
        <el-select
          value={model}
          {...{
            attrs,
            on: listeners
          }}
          disabled={onlyShow}
        >
          {options.map(item => {
            return <el-option key={item[key]} label={item[label]} value={item[key]} disabled={item.disabled}></el-option>;
          })}
        </el-select>
      );
    },

    getCascaderCompVNode({ tagAttrs: attrs, listeners, formField, extraOption, request, ref }) {
      this.disposeRequest(request, extraOption, formField);
      const { options = [], props = {} } = extraOption;
      const { formData, onlyShow } = this;
      attrs.options = options;
      attrs.props = props;
      attrs.props.value = props.key;
      let model = getter(formData, formField);
      return (
        <el-cascader
          {...(ref ? { ref } : {})}
          value={model}
          {...{
            attrs,
            on: listeners
          }}
          disabled={onlyShow}
        ></el-cascader>
      );
    },

    getRadioGroupCompVNode({ tagAttrs: attrs, listeners, formField, extraOption, request }) {
      this.disposeRequest(request, extraOption, formField);
      const { options = [], props = {} } = extraOption;
      const { formData, onlyShow } = this;
      // 基础版有个添加维护字典的功能，里面返回的字段为id和cnName，因此以此字段为默认取值
      const { key = "id", label = "cnName" } = props;
      let model = getter(formData, formField);
      return (
        <el-radio-group
          // v-model={1 ? model : ""}
          value={model}
          {...{
            attrs,
            on: listeners
          }}
          disabled={onlyShow}
        >
          {options.map(item => {
            return (
              <el-radio label={item[key]} disabled={item.disabled}>
                {item[label]}
              </el-radio>
            );
          })}
        </el-radio-group>
      );
    },

    getCheckboxGroupCompVNode({ tagAttrs: attrs, listeners, formField, extraOption, request }) {
      this.disposeRequest(request, extraOption, formField);
      const { options = [], props = {} } = extraOption;
      const { formData, onlyShow } = this;
      // 基础版有个添加维护字典的功能，里面返回的字段为id和cnName，因此以此字段为默认取值
      const { key = "id", label = "cnName" } = props;
      let model = getter(formData, formField);
      return (
        <el-checkbox-group
          // v-model={1 ? model : ""}
          value={model}
          {...{
            attrs,
            on: listeners
          }}
          disabled={onlyShow}
        >
          {options.map(item => {
            return (
              <el-checkbox label={item[key]} disabled={item.disabled}>
                {item[label]}
              </el-checkbox>
            );
          })}
        </el-checkbox-group>
      );
    },

    getTooltipCompVNode({ tagAttrs: { internalTagOption, ...attrs }, style: wrapStyle, className: wrapClassName }) {
      const { getSingleCompVNode } = this;
      const { style = "", className = "", tagAttrs = {}, contentText = "", tagName } = internalTagOption;
      return (
        <el-tooltip
          style={wrapStyle}
          class={wrapClassName}
          {...{
            attrs
          }}
        >
          {tagName ? (
            getSingleCompVNode(internalTagOption)
          ) : (
            <span
              style={style}
              class={className}
              {...{
                attrs: tagAttrs
              }}
            >
              {contentText}
            </span>
          )}
        </el-tooltip>
      );
    },

    // 配合组件是所有必须通过嵌套才能正常使用的组件
    isCooperateComp(tagName, contentTextBehindTagOptions, contentTextFrontTagOptions) {
      if (typeof tagName !== "string") {
        console.error("isCooperateComp方法传入的参数必须为字符串");
        return false;
      }
      // TODO 待添加，
      const cooperateComp = ["el-select", "el-cascader", "el-radio-group", "el-checkbox-group", "el-tooltip"];
      return cooperateComp.indexOf(tagName) !== -1 && isEmpty(contentTextBehindTagOptions) && isEmpty(contentTextFrontTagOptions);
    },

    //
    getSingleCompVNode(item) {
      const { formData, isCooperateComp, getCooperateComp, getPureSingleCompVNode } = this;
      let {
        // 自定义插槽
        slotName,
        // behindText和frontText为组件前后的文本，如需更复杂的自定义，请使用slotName
        // 特殊组件的额外属性值例如select组件下的option组件所需的options
        extraOption = {},
        // 当前渲染组件（即Tag）所需的属性值
        tagAttrs = {},
        // 组件所需的监听事件
        listeners = {},
        // 需要绑定的formData的属性名
        formField = "",
        tagName,
        // 接口处理
        request = {},
        contentTextFrontTagOptions = {},
        contentTextBehindTagOptions = {},
        isFlat = false,
        wrapDivStyle = "",
        ref = ""
      } = item;
      // isWrap防止无限循环
      if (!listeners?.input?.isWrap) {
        listeners.input = getHandleInput(formData, formField, listeners.input);
      }
      // 若tag为select这种需要别的标签配合使用的组件，则调用getCooperateComp方法
      return (
        <div style={wrapDivStyle}>
          {slotName
            ? this.$scopedSlots[slotName]
              ? this.$scopedSlots[slotName]({
                  formData: formData
                })
              : (console.warn(`slot : ${slotName} 未定义！`), "")
            : isCooperateComp(tagName, contentTextBehindTagOptions, contentTextFrontTagOptions)
            ? getCooperateComp({
                tagName,
                tagAttrs,
                listeners,
                formField,
                extraOption,
                request,
                isFlat,
                ref
              })
            : getPureSingleCompVNode(item)}
        </div>
      );
    },

    // 不处理slot
    getPureSingleCompVNode(item) {
      const { formData, onlyShow } = this;
      const {
        // class和style不会被组件的attr所处理，会直接赋值到组件的根节点因此需要单独拿出来赋值
        className,
        style,
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
        ref = "",
        // 组件所需的监听事件
        listeners = {},
        // 需要绑定的formData的属性名
        formField = "",
        tagName,
        // 接口处理
        request = {},
        contentTextFrontTagOptions = {},
        contentTextBehindTagOptions = {},
        showCodeEditor = false
      } = item;
      // 取代v-model语法糖，因为它不能实现多个点深层级取值赋值操作,例如fromData['a.b']
      // isWrap防止无限循环
      if (!listeners?.input?.isWrap) {
        listeners.input = getHandleInput(formData, formField, listeners.input);
        if (showCodeEditor && tagName === "el-input") {
          listeners.focus = decorator(() => {
            this.codeValue = { formField };
            this.$nextTick().then(() => {
              this.showCodeEditor = true;
            });
          }, listeners.focus);
        }
      }
      const model = getter(formData, formField);
      // tagName必须是eleui提供的已有组件或HTML已有标签,如果是只读标签，则固定使用span标签
      // Tag必须开头大写，否则会被识别为字符串
      const Tag = onlyShow ? "span" : tagName;
      // 若tag为select这种需要别的标签配合使用的组件，则调用getCooperateComp方法
      return (
        <Tag
          value={model}
          style={style}
          class={className}
          {...(ref ? { ref } : {})}
          {...{
            attrs: tagAttrs,
            on: listeners
          }}
        >
          {frontText ? <span style={frontTextStyle}>{frontText}</span> : null}
          {isEmpty(contentTextFrontTagOptions)
            ? null
            : Array.isArray(contentTextFrontTagOptions)
            ? contentTextFrontTagOptions.map(options => this.getSingleCompVNode(options))
            : this.getSingleCompVNode(contentTextFrontTagOptions)}
          {contentText}
          {isEmpty(contentTextBehindTagOptions)
            ? null
            : Array.isArray(contentTextBehindTagOptions)
            ? contentTextBehindTagOptions.map(options => this.getSingleCompVNode(options))
            : this.getSingleCompVNode(contentTextBehindTagOptions)}
          {behindText ? <span style={behindTextStyle}>{behindText}</span> : null}
        </Tag>
      );
    },

    getFormItemVNode(allItemInfo = {}) {
      // 一个formItem的content也允许渲染多个组件
      const {
        formItemAttrs: { labelSlotName, labelOptions, ...formItemAttrs },
        watch,
        renderDependFn,
        ...item
      } = allItemInfo;
      const { isFlat } = item;
      let renderDepend = renderDependFn;
      if (typeof renderDependFn === "string" && renderDependFn?.length > 0) {
        renderDepend = str2Fn(renderDependFn);
      }
      if (watch && typeof watch.handler === "function") {
        this.$watch("formData", val => watch.handler(val, allItemInfo, this), {
          deep: watch.deep,
          immediate: watch.immediate
        });
      }
      // 先判断是否存在依赖渲染，在判断是否有labelSlotName，在判断是否有labelOptions
      return renderDepend && !renderDepend(this.formData) ? (
        ""
      ) : (
        <el-form-item
          {...{
            attrs: formItemAttrs
          }}
          style={isFlat ? "width: 100%" : ""}
        >
          {labelSlotName || !isEmpty(labelOptions) ? (
            <template slot="label">
              {labelSlotName && this.$scopedSlots[labelSlotName]
                ? this.$scopedSlots[labelSlotName]({
                    formData: formData
                  })
                : this.getSingleCompVNode(labelOptions)}
            </template>
          ) : (
            ""
          )}

          {item.child && Array.isArray(item.child) ? item.child.map(item => this.getSingleCompVNode(item)) : this.getSingleCompVNode(item)}
        </el-form-item>
      );
    },

    customLayoutRender(data) {
      // 由于此处的data为finalRenderOptions，已在props中声明为数组，因此不对data进行再次校验
      // 当前布局组件不提供 Bootstrap式的响应式布局属性
      return data.map(rowItem => {
        const { elRowAttrs = {}, formItem = {}, style = "", className = "" } = rowItem;
        return (
          <el-row
            {...{
              attrs: elRowAttrs
            }}
            style={style}
            class={className + (this.isOverflow ? " flex-container" + (this.isExpanded ? " expanded" : "") : "")}
            ref="flexWrapBox"
          >
            {Array.isArray(formItem)
              ? rowItem.formItem.map(item => {
                  const { elColAttrs = {}, ...formItemAttrs } = item;
                  return elColAttrs?.span ? (
                    <el-col
                      {...{
                        attrs: elColAttrs
                      }}
                    >
                      {this.getFormItemVNode(formItemAttrs)}
                    </el-col>
                  ) : (
                    this.getFormItemVNode(formItemAttrs)
                  );
                })
              : this.getFormItemVNode(formItem)}
            {this.isOverflow ? <el-button class="collapse-btn" type="text" icon={this.isExpanded ? "el-icon-arrow-down" : "el-icon-arrow-up"} onclick={this.toggleExpand} /> : ""}
          </el-row>
        );
      });
    },
    handleCodeEditorClose() {
      this.showCodeEditor = false;
    }
  },

  render() {
    const {
      showFooter,
      handleClose,
      formData,
      handleSubmit,
      customLayoutRender,
      rules,
      finalRenderOptions,
      useDialog,
      dialogTitle,
      showDialog,
      formRef,
      dialogRef,
      dialogOptions,
      $attrs,
      $listeners,
      codeValue,
      showCodeEditor,
      handleCodeEditorClose
    } = this;

    const defaultFormAttrs = {
      rules,
      model: formData,
      size: "mini",
      "label-width": "auto"
    };

    const defaultDialogAttrs = {
      beforeClose: handleClose,
      title: dialogTitle || "弹窗",
      visible: showDialog,
      width: "800px",
      appendToBody: true
    };

    const model = getter(formData, this.codeValue.formField);

    const defaultCodeEditorDialogAttrs = {
      dialogAttrs: {
        title: "代码编写"
      },
      displayHeight: "600px",
      modelValue: model || "",
      showExample: true,
      useTabLayout: true,
      exampleList: tableBtnCodeExampleList[this.codeValue?.formField]
    };

    const codeEditorListeners = {
      confirm: val => {
        console.log(val, "codeEditorListeners");
        setter(formData, codeValue.formField, val);
      },
      close: handleCodeEditorClose
    };

    console.log("baseformrender");
    return (
      <div>
        {useDialog ? (
          <el-dialog
            ref={dialogRef}
            v-draggable
            {...{
              attrs: { ...defaultDialogAttrs, ...dialogOptions }
            }}
          >
            <el-form
              ref={formRef}
              {...{
                attrs: {
                  ...defaultFormAttrs,
                  ...$attrs
                },
                on: {
                  ...$listeners
                }
              }}
              class="BaseRenderFormContainer"
            >
              {customLayoutRender(finalRenderOptions)}
            </el-form>
            <div slot="footer">
              <el-button on-click={handleClose}>取消</el-button>
              <el-button type="primary" on-click={handleSubmit}>
                确定
              </el-button>
            </div>
          </el-dialog>
        ) : (
          <div>
            <el-form
              ref={formRef}
              {...{
                attrs: {
                  ...defaultFormAttrs,
                  ...$attrs
                },
                on: {
                  ...$listeners
                }
              }}
              class="BaseRenderFormContainer"
            >
              {customLayoutRender(finalRenderOptions)}
            </el-form>
            {showFooter ? (
              <div>
                <el-button type="primary" on-click={handleSubmit}>
                  确定
                </el-button>
                <el-button type="" on-click={handleClose}>
                  重置
                </el-button>
              </div>
            ) : (
              ""
            )}
          </div>
        )}
        {showCodeEditor ? (
          <onlineCode
            {...{
              attrs: { ...defaultCodeEditorDialogAttrs },
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
