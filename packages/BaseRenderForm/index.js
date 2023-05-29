import {
  getter,
  getHandleInput,
  setPlaceholder,
  str2obj,
  exec,
  str2Fn,
} from '../../utils';
import codemirror from '../components/codemirror';
import { isEmpty } from 'lodash';
export default {
  name: 'BaseRenderForm',
  components: { codemirror },
  props: {
    generalRequest: {
      type: Function,
    },
    rules: {
      type: Object,
    },
    formOptions: {
      type: Array,
    },
    formData: {
      type: Object,
    },
    useDialog: {
      type: Boolean,
      default() {
        return true;
      },
    },
    dialogTitle: String,
    dialogOptions: {
      type: Object,
    },
    onlyShow: Boolean,
    showFooter: {
      type: Boolean,
      default() {
        return true;
      },
    },
  },
  data() {
    return {
      formRef: 'elForm',
      dialogRef: 'elDialog',
      showDialog: true,
    };
  },
  computed: {},
  watch: {},
  async created() {
    // this.init();
  },
  methods: {
    // 可以通过调用此组件的这个方法获取el-form的实例
    expose_getElFormInstance() {
      return this.$refs[this.formRef];
    },

    // 可以通过调用此组件的这个方法获取el-dialog的实例
    expose_getElDialogInstance() {
      if (this.useDialog) return this.$refs[this.dialogRef];
      else console.error('请将porps useDialog设置为true');
    },

    // 设置showDialog
    expose_setShowDialog(bool) {
      this.showDialog = bool;
    },

    requestData({ url = '', type = 'get', params = '' }, extraOption) {
      params = str2obj(params);
      this.generalRequest(url, type, params).then((res) => {
        res.data
          .sort((a, b) => a.sortNum - b.sortNum)
          .map((item) => {
            if (extraOption.labelTranslateType === 1) {
              item[extraOption.props.label] = `${item[extraOption.props.key]}-${
                item[extraOption.props.label]
              }`;
            }
            extraOption.options.push(item);
          });
      });
    },

    disposeRequest(request, extraOption) {
      if (request?.require && request?.url && request.status === 'pending') {
        extraOption.options = [];
        // 这个有值代表是字典类型得，字典类型默认props为此
        if (typeof extraOption.labelTranslateType === 'number') {
          extraOption.props = {
            key: 'dicId',
            label: 'cnname',
          };
        }
        this.requestData(request, extraOption);
        request.status = 'finish';
        // exec(request);
      }
    },

    handleClose() {
      this.showDialog = false;
      this.$emit('onClose');
    },

    async handleSubmit() {
      this.expose_getElFormInstance().validate((valid) => {
        if (valid) {
          this.$emit('onSubmit', this.formData);
          this.handleClose();
        } else {
          console.log('error submit!!');
          return false;
        }
      });
    },

    getCooperateComp({ tagName, ...options }) {
      if (typeof tagName !== 'string') {
        console.error('isCooperateComp方法传入的参数必须为字符串');
        return false;
      }
      // TODO 待添加，
      const renderFn = {
        'el-select': this.getSelectCompVNode,
        'el-cascader': this.getCascaderCompVNode,
        'el-radio-group': this.getRadioGroupCompVNode,
        'el-checkbox-group': this.getCheckboxGroupCompVNode,
        'el-tooltip': this.getTooltipCompVNode,
      };
      return renderFn[tagName] && renderFn[tagName](options);
    },

    getSelectCompVNode({
      tagAttrs: attrs,
      listeners,
      formField,
      extraOption,
      request,
    }) {
      this.disposeRequest(request, extraOption);
      let { options = [], props = {} } = extraOption;
      const { formData, onlyShow } = this;
      // 基础版有个添加维护字典的功能，里面返回的字段为id和cnName，因此以此字段为默认取值
      const { key = 'id', label = 'cnName' } = props;
      let model = getter(formData, formField);
      return (
        <el-select
          value={model}
          {...{
            attrs,
            on: listeners,
          }}
          disabled={onlyShow}
        >
          {options.map((item) => {
            return (
              <el-option
                key={item[key]}
                label={item[label]}
                value={item[key]}
                disabled={item.disabled}
              ></el-option>
            );
          })}
        </el-select>
      );
    },

    getCascaderCompVNode({
      tagAttrs: attrs,
      listeners,
      formField,
      extraOption,
      request,
    }) {
      this.disposeRequest(request, extraOption);
      const { options = [], props = {} } = extraOption;
      const { formData, onlyShow } = this;
      console.log(props, 'props');
      attrs.options = options;
      attrs.props = props;
      attrs.props.value = props.key;
      let model = getter(formData, formField);
      return (
        <el-cascader
          value={model}
          {...{
            attrs,
            on: listeners,
          }}
          disabled={onlyShow}
        ></el-cascader>
      );
    },

    getRadioGroupCompVNode({
      tagAttrs: attrs,
      listeners,
      formField,
      extraOption,
      request,
    }) {
      this.disposeRequest(request, extraOption);
      const { options = [], props = {} } = extraOption;
      const { formData, onlyShow } = this;
      // 基础版有个添加维护字典的功能，里面返回的字段为id和cnName，因此以此字段为默认取值
      const { key = 'id', label = 'cnName' } = props;
      let model = getter(formData, formField);
      return (
        <el-radio-group
          // v-model={1 ? model : ""}
          value={model}
          {...{
            attrs,
            on: listeners,
          }}
          disabled={onlyShow}
        >
          {options.map((item) => {
            return (
              <el-radio label={item[key]} disabled={item.disabled}>
                {item[label]}
              </el-radio>
            );
          })}
        </el-radio-group>
      );
    },

    getCheckboxGroupCompVNode({
      tagAttrs: attrs,
      listeners,
      formField,
      extraOption,
      request,
    }) {
      this.disposeRequest(request, extraOption);
      const { options = [], props = {} } = extraOption;
      const { formData, onlyShow } = this;
      // 基础版有个添加维护字典的功能，里面返回的字段为id和cnName，因此以此字段为默认取值
      const { key = 'id', label = 'cnName' } = props;
      let model = getter(formData, formField);
      return (
        <el-checkbox-group
          // v-model={1 ? model : ""}
          value={model}
          {...{
            attrs,
            on: listeners,
          }}
          disabled={onlyShow}
        >
          {options.map((item) => {
            return (
              <el-checkbox label={item[key]} disabled={item.disabled}>
                {item[label]}
              </el-checkbox>
            );
          })}
        </el-checkbox-group>
      );
    },

    getTooltipCompVNode({ tagAttrs: { internalTagOption, ...attrs } }) {
      const { getSingleCompVNode } = this;
      const {
        style = '',
        className = '',
        tagAttrs = {},
        contentText = '',
        tagName,
      } = internalTagOption;
      return (
        <el-tooltip
          {...{
            attrs,
          }}
        >
          {tagName ? (
            getSingleCompVNode(internalTagOption)
          ) : (
            <span
              style={style}
              class={className}
              {...{
                attrs: tagAttrs,
              }}
            >
              {contentText}
            </span>
          )}
        </el-tooltip>
      );
    },

    //
    getSingleCompVNode(item) {
      const { formData, getCooperateComp, onlyShow } = this;
      let {
        // class和style不会被组件的attr所处理，会直接赋值到组件的根节点因此需要单独拿出来赋值
        className,
        style,
        // 自定义插槽
        slotName,
        // behindText和frontText为组件前后的文本，如需更复杂的自定义，请使用slotName
        behindText = '',
        frontText = '',
        behindTextStyle = '',
        frontTextStyle = '',
        // 如不需要使用formData中的值而只是需要固定文本则可使用此字段
        contentText = '',
        // 特殊组件的额外属性值例如select组件下的option组件所需的options
        extraOption = {},
        // 当前渲染组件（即Tag）所需的属性值
        tagAttrs = {},
        // 组件所需的监听事件
        listeners = {},
        // 需要绑定的formData的属性名
        formField = '',
        tagName,
        // 接口处理
        request = {},
      } = item;
      // 取代v-model语法糖，因为它不能实现多个点深层级取值赋值操作,例如fromData['a.b']
      // isWrap防止无限循环
      if (!listeners?.input?.isWrap) {
        listeners.input = getHandleInput(formData, formField, listeners.input);
      }
      let model = getter(formData, formField);
      // tagName必须是eleui提供的已有组件或HTML已有标签,如果是只读标签，则固定使用span标签
      // Tag必须开头大写，否则会被识别为字符串
      const Tag = onlyShow ? 'span' : tagName;
      // 若tag为select这种需要别的标签配合使用的组件，则调用getCooperateComp方法
      return (
        <div style="display: inline-block">
          {slotName
            ? this.$scopedSlots[slotName]
              ? this.$scopedSlots[slotName]({
                  formData: formData,
                })
              : (console.warn(`slot : ${slotName} 未定义！`), '')
            : getCooperateComp({
                tagName,
                tagAttrs,
                listeners,
                formField,
                extraOption,
                request,
              }) || (
                <div style="display: inline-block">
                  <span style={frontTextStyle}>{frontText}</span>
                  <Tag
                    value={model}
                    style={style}
                    class={className}
                    {...{
                      attrs: tagAttrs,
                      on: listeners,
                    }}
                  >
                    {model || tagAttrs?.value || contentText}
                  </Tag>
                  <span style={behindTextStyle}>{behindText}</span>
                </div>
              )}
        </div>
      );
    },

    getFormItemVNode(allItemInfo = {}) {
      // 一个formItem的content也允许渲染多个组件
      const {
        formItemAttrs: { labelSlotName, labelOptions, ...formItemAttrs },
        renderDependFn,
        ...item
      } = allItemInfo;
      if (typeof renderDependFn === 'string' && renderDependFn?.length > 0) {
        item.renderDependFn = renderDependFn = str2Fn(renderDependFn);
      }
      // 先判断是否存在依赖渲染，在判断是否有labelSlotName，在判断是否有labelOptions
      return renderDependFn && !renderDependFn(this.formData) ? (
        ''
      ) : (
        <el-form-item
          {...{
            attrs: formItemAttrs,
          }}
        >
          {labelSlotName || !isEmpty(labelOptions) ? (
            <div slot="label">
              {labelSlotName && this.$scopedSlots[labelSlotName]
                ? this.$scopedSlots[labelSlotName]({
                    formData: formData,
                  })
                : this.getSingleCompVNode(labelOptions)}
            </div>
          ) : (
            ''
          )}

          {item.child && Array.isArray(item.child)
            ? item.child.map((item) => this.getSingleCompVNode(item))
            : this.getSingleCompVNode(item)}
        </el-form-item>
      );
    },

    customLayoutRender(data) {
      // 由于此处的data为formOptions，已在props中声明为数组，因此不对data进行再次校验
      // 当前布局组件不提供 Bootstrap式的响应式布局属性
      return data.map((rowItem) => {
        const {
          elRowAttrs = {},
          formItem = {},
          style = '',
          className = '',
        } = rowItem;
        return (
          <el-row
            {...{
              attrs: elRowAttrs,
            }}
            style={style}
            class={className}
          >
            {Array.isArray(formItem)
              ? rowItem.formItem.map((item) => {
                  const { elColAttrs = {}, ...formItemAttrs } = item;
                  return elColAttrs?.span ? (
                    <el-col
                      {...{
                        attrs: elColAttrs,
                      }}
                    >
                      {this.getFormItemVNode(formItemAttrs)}
                    </el-col>
                  ) : (
                    this.getFormItemVNode(formItemAttrs)
                  );
                })
              : this.getFormItemVNode(formItem)}
          </el-row>
        );
      });
    },
  },

  render() {
    const {
      showFooter,
      handleClose,
      formData,
      handleSubmit,
      customLayoutRender,
      rules,
      formOptions,
      useDialog,
      dialogTitle,
      showDialog,
      formRef,
      dialogRef,
      dialogOptions,
      $attrs,
      $listeners,
    } = this;

    const defaultFormAttrs = {
      rules,
      model: formData,
      size: 'mini',
      'label-width': 'auto',
    };

    const defaultDialogAttrs = {
      beforeClose: handleClose,
      title: dialogTitle || '弹窗',
      visible: showDialog,
      width: '800px',
    };

    return (
      <div>
        {useDialog ? (
          <el-dialog
            ref={dialogRef}
            {...{
              attrs: { ...defaultDialogAttrs, ...dialogOptions },
            }}
          >
            <el-form
              ref={formRef}
              {...{
                attrs: {
                  ...defaultFormAttrs,
                  ...$attrs,
                },
                on: {
                  ...$listeners,
                },
              }}
            >
              {customLayoutRender(formOptions)}
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
                  ...$attrs,
                },
                on: {
                  ...$listeners,
                },
              }}
            >
              {customLayoutRender(formOptions)}
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
              ''
            )}
          </div>
        )}
      </div>
    );
  },
};
