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
import { setPlaceholder, getWidgetOptions, setColSpan } from '../../utils';
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
      btnConfigFromArr: [],
      btnConfigFrom: new BtnConfigFrom(),
    };
  },

  mounted () {
    // this.init()
  },
  methods: {
    expose_getBtnConfigFromArr () {
      return this.btnConfigFromArr
    },
    // TODO应该怎么设计接受外部接口获取来的数据
    expose_setOptions (list) {
      // this.$set()
      this.btnConfigFormOptions[1].formItem.extraOption.options = list
    },
    
    expose_setExtraOption (options) {
      this.btnConfigFormOptions[1].formItem.extraOption = options

    },
    expose_delBtnConfigFromArr (index) {
      this.btnConfigFromArr.splice(index, 1)
    },
    onSubmit (data) {
      this.btnConfigFromArr.push(data)
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
