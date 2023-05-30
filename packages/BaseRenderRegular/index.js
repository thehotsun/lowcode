import { isEmpty, cloneDeep } from 'lodash';
import { getter, getHandleInput } from '../../utils';

export default {
  name: 'BaseRenderRegular',
  props: {
    renderOptions: {
      type: Array,
    },
    onlyShow: Boolean,
    formData: Object,
  },
  data() {
    return {};
  },
  computed: {
    finalRenderOptions() {
      // 对所有元素的监听事件进行处理， 使其能访问到当前组件的this
      return (
        this.renderOptions?.map((rowItem) => {
          const ectype = cloneDeep(rowItem);
          if (Array.isArray(ectype.formItem)) {
            ectype.formItem.map((item) => {
              if (!isEmpty(item.listeners)) {
                Object.keys(item.listeners).map((eventName) => {
                  if (item.listeners[eventName].isWrap) return;
                  const originFn = item.listeners[eventName];
                  item.listeners[eventName] = (...argus) =>
                    originFn.call(this, ...argus);
                });
              }
              return item;
            });
          } else {
            const listeners = ectype.formItem.listeners;
            if (!isEmpty(listeners)) {
              Object.keys(listeners).map((eventName) => {
                console.log(eventName, 'eventName');
                if (listeners[eventName].isWrap) return;
                const originFn = listeners[eventName];
                ectype.formItem.listeners[eventName] = (...argus) =>
                  originFn.call(this, ...argus);
              });
            }
          }
          return ectype;
        }) || []
      );
    },
  },
  watch: {},
  async created() {
    // this.init();
  },
  methods: {
    btnClick(extraOption) {
      return (e) => {
        try {
          this.$emit('btnClick', {
            ...extraOption,
            e,
          });
        } catch (error) {
          console.error(error);
        }
      };
    },
    getCooperateComp(tagName, attrs, listeners, formField, extraOption) {
      // TODO 待添加，
      const renderFn = {
        'el-select': this.getSelectCompVNode,
      };
      return renderFn[tagName](attrs, listeners, formField, extraOption);
    },

    // 配合组件是所有必须通过嵌套才能正常使用的组件
    isCooperateComp(tagName) {
      if (typeof tagName !== 'string') {
        console.error('isCooperateComp方法传入的参数必须为字符串');
        return false;
      }
      // TODO 待添加，
      const cooperateComp = ['el-select'];
      return cooperateComp.indexOf(tagName) !== -1;
    },

    getSelectCompVNode(attrs, listeners, formField, extraOption) {
      const { options = [], props = {} } = extraOption;
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

    getSingleCompVNode(item) {
      const {
        formData,
        isCooperateComp,
        getCooperateComp,
        onlyShow,
        btnClick,
      } = this;
      const {
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
        contentTextFrontTagOptions = {},
        contentTextBehindTagOptions = {},
      } = item;
      // 取代v-model语法糖，因为它不能实现多个点深层级取值赋值操作,例如fromData['a.b']
      listeners.input = getHandleInput(formData, formField, listeners.input);
      // 暂时只针对按钮的点击事件
      listeners.click = btnClick(extraOption);
      let model = getter(formData, formField);
      // tagName必须是eleui提供的已有组件或HTML已有标签,如果是只读标签，则固定使用span标签
      // Tag必须开头大写，否则会被识别为字符串
      const Tag = onlyShow ? 'span' : tagName;
      // 若tag为select这种需要别的标签配合使用的组件，则调用getCooperateComp方法
      return (
        <div style="display: inline-block">
          {slotName ? (
            this.$scopedSlots[item.slotName]({
              formData: formData,
            })
          ) : isCooperateComp(tagName) ? (
            getCooperateComp(
              tagName,
              tagAttrs,
              listeners,
              formField,
              extraOption
            )
          ) : (
            <div style="display: inline-block">
              {frontText ? (
                <span style={frontTextStyle}>{frontText}</span>
              ) : null}
              <Tag
                value={model}
                style={style}
                class={className}
                {...{
                  attrs: tagAttrs,
                  on: listeners,
                }}
              >
                {isEmpty(contentTextFrontTagOptions)
                  ? null
                  : Array.isArray(contentTextFrontTagOptions)
                  ? contentTextFrontTagOptions.map((options) =>
                      this.getSingleCompVNode(options)
                    )
                  : this.getSingleCompVNode(contentTextFrontTagOptions)}
                {model || tagAttrs?.value || contentText}
                {isEmpty(contentTextBehindTagOptions)
                  ? null
                  : Array.isArray(contentTextBehindTagOptions)
                  ? contentTextBehindTagOptions.map((options) =>
                      this.getSingleCompVNode(options)
                    )
                  : this.getSingleCompVNode(contentTextBehindTagOptions)}
              </Tag>
              {behindText ? (
                <span style={behindTextStyle}>{behindText}</span>
              ) : null}
            </div>
          )}
        </div>
      );
    },

    customLayoutRender(data) {
      // 由于此处的data为formOptions，已在props中声明为数组，因此不对data进行再次校验
      // 当前布局组件不提供 Bootstrap式的响应式布局属性
      console.log(data);
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
                      {this.getSingleCompVNode(formItemAttrs)}
                    </el-col>
                  ) : (
                    this.getSingleCompVNode(formItemAttrs)
                  );
                })
              : this.getSingleCompVNode(formItem)}
          </el-row>
        );
      });
    },
  },

  render() {
    const {
      customLayoutRender,
      rules,
      finalRenderOptions,
      formRef,
      $attrs,
      $listeners,
    } = this;

    return (
      <div
        ref={formRef}
        {...{
          attrs: {
            ...$attrs,
          },
          on: {
            ...$listeners,
          },
        }}
      >
        {customLayoutRender(finalRenderOptions)}
      </div>
    );
  },
};
