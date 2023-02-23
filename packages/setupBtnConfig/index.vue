<template>
  <base-render-form ref="form" :form-data="btnConfigFrom" :form-options="btnConfigFormOptions" @onSubmit="onSubmit"
    label-position="top" :useDialog="useDialog">
    <template #color>
      <el-row>
        <span v-for="item in colorList" :key="item">
          <el-button :type="item" @click="setBtnType(item)"></el-button> <el-button
            v-if="btnConfigFrom.tagAttrs.type === item" type="success" icon="el-icon-check" circle></el-button>
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
    onSubmit (data) {
      this.btnConfigFromArr.push(data)
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
