<template>
  <base-render-form ref="form" :form-data="btnConfigFrom" :form-options="btnConfigFormOptions" @onSubmit="onSubmit"
    @onClose="onClose" label-position="top" :useDialog="useDialog" style="background: #fff;padding:30px 20px">
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


import BaseRenderForm from '../BaseRenderForm/index';
import { btnConfigFormOptions, BtnConfigFrom } from "../../baseConfig/btnBaseConfig"
import { setPlaceholder, getWidgetOptions, setColSpan, findFromOptionsIndexByfieldName } from '../../utils';
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
      btnConfigFrom: new BtnConfigFrom(),
    };
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
      }
      if (Array.isArray(fieldName)) {
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
      this.btnConfigFrom = obj
    },

    expose_getBtnConfigFrom () {
      return this.btnConfigFrom
    },

    expose_setExtraOption (options) {
      // this.$set(this.btnConfigFormOptions[1].formItem, 'extraOption', options )
      // console.log(options, 'expose_setExtraOption', btnConfigFormOptions);
      this.btnConfigFormOptions[1].formItem.extraOption = options

    },
    expose_delBtnConfigFromArr (index) {
      this.btnConfigFromArr.splice(index, 1)
    },
    onSubmit (data) {
      // 如果相同则说明是编辑，不同则是新增
      if (!this.btnConfigFromArr.some(item => item === data)) {
        this.btnConfigFromArr.push(data)
      }
      this.$emit('onSubmit')
      this.btnConfigFrom = new BtnConfigFrom()
    },
    onClose () {
      this.$emit('onClose');
      this.btnConfigFrom = new BtnConfigFrom()
    },
    setBtnType (type) {
      this.btnConfigFrom.tagAttrs.type = type
    },
  }
};
</script>  

<style lang="scss" scoped>
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
