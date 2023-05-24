<template>
  <div class="wrap">

    <base-render-form ref="form" :form-data="btnConfigFrom" :form-options="btnConfigFormOptions" @onSubmit="onSubmit"
      @onClose="onClose" :useDialog="useDialog" style="background: #fff;padding:30px 20px">
      <template #requestUrl="{ formData }">
        <div>
          <el-input v-model="formData.extraOption.requestUrl" style="width: 180px" placeholder="请输入接口地址"></el-input>
          <el-button type="text" @click="handleRequestParamsConfigEdit"> 编辑请求 </el-button>
        </div>
      </template>
      <template #color>
        <el-row>
          <span v-for="item in colorList" :key="item">
            <el-button :type="item" @click="setBtnType(item)"></el-button> <i v-if="btnConfigFrom.tagAttrs.type === item"
              class="el-icon-check middle"></i>
          </span>
        </el-row>
      </template>
    </base-render-form>

    <el-dialog title="请求接口设置" :visible.sync="showParamsConfig" :close-on-click-modal="false"
      :close-on-press-escape="false" width="40%" append-to-body>
      <template>
        <el-form :model="paramsConfig" ref="dsForm" label-width="160px" label-position="left" class="ds-form">
          <el-form-item label="参数（queryString）">
            <el-row v-for="(rp, pIdx) in paramsConfig.params" :key="pIdx" class="rd-row" :gutter="8">
              <el-col :span="7">
                <el-form-item :rules="nameRules" label-width="0">
                  <el-input v-model="rp.name" placeholder="名称"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item>
                  <el-input v-model="rp.value" placeholder="值"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="3">
                <el-button icon="el-icon-delete" plain circle @click="deleteRequestParam(pIdx)"></el-button>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="6">
                <el-button type="text" icon="el-icon-plus" @click="addRequestParam">
                  新增请求参数</el-button>
              </el-col>
            </el-row>
          </el-form-item>
          <el-form-item label="发送数据（body）">
            <el-row v-for="(rd, dIdx) in paramsConfig.data" :key="dIdx" class="rd-row" :gutter="8">
              <el-col :span="7">
                <el-form-item label-width="0">
                  <el-input v-model="rd.name" placeholder="请输入名称"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item>
                  <el-input v-model="rd.value" placeholder="值"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="3">
                <el-button icon="el-icon-delete" plain circle @click="deleteRequestData(dIdx)"></el-button>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="6">
                <el-button type="text" icon="el-icon-plus" @click="addRequestData">新增发送数据</el-button>
              </el-col>
            </el-row>
          </el-form-item>
        </el-form>
      </template>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showParamsConfig = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>


import BaseRenderForm from '../../../BaseRenderForm/index';
import { BtnConfigFormOptions, BtnConfigFrom } from "../../../../baseConfig/btnBaseConfig"
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
      btnConfigFormOptions: new BtnConfigFormOptions(),
      btnConfigFromArr: [],
      originConfigForm: {},
      btnConfigFrom: new BtnConfigFrom(),
      showParamsConfig: false,
      paramsConfig: {
        params: [
        ],
        data: [
        ],
      }
    };
  },

  created () {
    // const target = this.btnConfigFormOptions.find(option => option.formItem.formField === 'authorize');
    // if (target) {

    //   target.listeners = {
    //     change: this.handleAuthorizeChange
    //   }
    // }
  },

  mounted () {
    // this.init()
  },
  methods: {
    expose_reductionAll () {
      this.btnConfigFormOptions = new BtnConfigFormOptions();
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
      return new BtnConfigFormOptions()
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

    handleRequestParamsConfigEdit () {
      this.showParamsConfig = true;
      // const 
      // if (Object.prototype.toString(this.btnConfigFrom.requestParamsConfig) === '[object Object]') {

      // }
      this.paramsConfig = cloneDeep(this.btnConfigFrom.extraOption.requestParamsConfig)
    },

    addRequestParam () {
      this.paramsConfig.params.push({
        name: '',
        value: ''
      })
    },

    deleteRequestParam (idx) {
      this.paramsConfig.params.splice(idx, 1)
    },

    addRequestData () {
      this.paramsConfig.data.push({
        name: '',
        value: ''
      })
    },

    deleteRequestData (idx) {
      this.paramsConfig.data.splice(idx, 1)
    },

    handleConfirm () {
      this.showParamsConfig = false
      this.extraOption.requestParamsConfig = this.paramsConfig
    },


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

    // handleAuthorizeChange (authorize) {
    //   const map = {
    //     A: 'add',
    //     U: 'edit',
    //     V: 'check',
    //     D: 'batchDel',
    //     E: 'download',
    //     I: 'import',
    //   }
    //   this.btnConfigFrom.btnType = map[authorize]
    // },

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

  }
};
</script>  

<style lang="less" scoped>
.wrap {
  width: 100%;
  height: 100%;
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

.wrap /deep/ .el-form-item__content {
  margin-left: 0 !important;
}
</style>
