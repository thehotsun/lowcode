<template>
  <base-render-form ref="form" :form-data="btnConfigFrom" :form-options="btnConfigFormOptions" @onSubmit="onSubmit"
    @onClose="onClose" :useDialog="useDialog" style="background: #fff;padding:30px 20px">
    <template #color>
      <el-row>
        <span v-for="item in colorList" :key="item">
          <el-button :type="item" @click="setBtnType(item)"></el-button> <i v-if="btnConfigFrom.tagAttrs.type === item"
            class="el-icon-check middle"></i>
        </span>
      </el-row>
    </template>
  </base-render-form>
</template>

<script>


import BaseRenderForm from '../../../BaseRenderForm/index';
import { btnConfigFormOptions, BtnConfigFrom } from "../../../../baseConfig/btnBaseConfig"
import { findFromOptionsIndexByfieldName } from '../../../../utils';
import { cloneDeep, merge } from "lodash";

export default {
  name: 'setupBtnConfig',
  components: {
    BaseRenderForm,
  },
  props: {
    useDialog: Boolean,
  },
  data () {
    return {
      colorList: ['', 'primary', 'success', 'info', 'warning', 'danger'],
      btnConfigFormOptions,
      rawBtnConfigFormOptions: cloneDeep(btnConfigFormOptions),
      btnConfigFromArr: [],
      originConfigForm: {},
      btnConfigFrom: new BtnConfigFrom(),
    };
  },

  created () {
  },

  mounted () {
    // this.init()
  },
  methods: {
    expose_reductionAll () {
      this.btnConfigFormOptions = cloneDeep(this.rawBtnConfigFormOptions);
      this.btnConfigFrom = new BtnConfigFrom()
    },

    expose_hideSomeFieldOptions (fieldName) {
      if (typeof fieldName === 'string') {
        fieldName = [fieldName]
      } else if (Array.isArray(fieldName)) {
        fieldName.map(item => {
          const index = findFromOptionsIndexByfieldName(this.btnConfigFormOptions, item);
          console.log(index, 'index');
          index !== -1 && this.btnConfigFormOptions.splice(index, 1)
        })
      } else {
        console.error('expose_hideSomeFieldOptions只能接受字符串或者数组');
      }
    },

    expose_setBtnConfigFormOptions (options) {
      this.btnConfigFormOptions = options
    },

    expose_getBtnConfigFormOptions () {
      return this.btnConfigFormOptions
    },

    expose_getRawBtnConfigFormOptions () {
      return this.rawBtnConfigFormOptions
    },

    expose_getBtnConfigFromArr () {
      return this.btnConfigFromArr
    },

    expose_setBtnConfigFromArr (arr) {
      this.btnConfigFromArr = arr
    },

    expose_setBtnConfigFrom (obj) {
      this.originConfigForm = obj
      const btnDefaultConfigFrom = new BtnConfigFrom()
      this.btnConfigFrom = merge(btnDefaultConfigFrom, obj)
    },

    expose_getBtnConfigFrom () {
      return this.btnConfigFrom
    },

    expose_setExtraOption (options, field) {
      const target = this.btnConfigFormOptions.find(item => item.formItem.formField === field)
      console.log(target, 'target');
      if (target) target.formItem.extraOption = options
    },
    expose_delBtnConfigFromArr (index) {
      this.btnConfigFromArr.splice(index, 1)
    },

    // setRules () {
    //   const target1 = this.btnConfigFormOptions.find(item => item.formItem.formField === 'extraOption.relateFrom')
    //   target1.formItem.formItemAttrs.rules = {
    //     validator: this.validateRelateFrom,
    //     trigger: 'change',
    //   }
    //   const target2 = this.btnConfigFormOptions.find(item => item.formItem.formField === 'extraOption.flowKey')
    //   target2.formItem.formItemAttrs.rules = {
    //     validator: this.validateFlowKey,
    //     trigger: 'change',
    //   }
    //   const target3 = this.btnConfigFormOptions.find(item => item.formItem.formField === 'extraOption.openUrl')
    //   target3.formItem.formItemAttrs.rules = {
    //     validator: this.validateOpenUrl,
    //     trigger: 'blur',
    //   }
    // },

    // validateRelateFrom (rule, value, callback) {
    //   console.log('././');
    //   if (this.btnConfigFrom.extraOption.openType === 0 && !value) {
    //     callback(new Error('请选择表单'));
    //   } else {
    //     callback();
    //   }
    // },
    // validateOpenUrl (rule, value, callback) {
    //   if ([1, 3].includes(this.btnConfigFrom.extraOption.openType) && !value) {
    //     callback(new Error('请输入url'));
    //   } else {
    //     callback();
    //   }
    // },
    // validateFlowKey (rule, value, callback) {
    //   if (this.btnConfigFrom.extraOption.openType === 2 && !value) {
    //     callback(new Error('请选择流程'));
    //   } else {
    //     callback();
    //   }
    // },

    onSubmit (data) {
      // 如果相同则说明是编辑，不同则是新增
      if (!this.btnConfigFromArr.some(item => item === this.originConfigForm)) {
        data.renderId = Math.random()
        this.btnConfigFromArr.push(data)
      } else {
        merge(this.originConfigForm, data)
      }
      this.$emit('onSubmit')
      this.btnConfigFrom = new BtnConfigFrom()
    },
    onClose () {
      this.$emit('onClose');
      this.originConfigForm = {}
      this.btnConfigFrom = new BtnConfigFrom()
    },
    setBtnType (type) {
      this.btnConfigFrom.tagAttrs.type = type
    },
  }
};
</script>  

<style lang="less" scoped>
.wrap {
  width: 100%;
}

.middle {
  vertical-align: -webkit-baseline-middle;
}

.edit {
  position: fixed;
  top: 20%;
  left: 0;
  right: 0;
  z-index: 999;
}

.flex {
  display: flex;
  align-items: center;
}
</style>
