<template>
  <div class="wrap">
    <base-render-form
      ref="form"
      :form-data="btnConfigFrom"
      :form-options="btnConfigFormOptions"
      :use-dialog="useDialog"
      style="background: #fff;padding:30px 20px"
      @onSubmit="onSubmit"
      @onClose="onClose"
      @showRenameDlg="showRenameDlg"
    >
      <template #requestUrl="{ formData }">
        <div>
          <el-input v-model="formData.extraOption.requestUrl" style="width: 180px" placeholder="请输入接口地址"></el-input>
          <el-button type="text" @click="handleRequestParamsConfigEdit"> 编辑请求 </el-button>
        </div>
      </template>
      <template #color>
        <el-row>
          <span v-for="item in colorList" :key="item">
            <el-button :type="item" @click="setBtnType(item)"></el-button> <i v-if="btnConfigFrom.tagAttrs.type === item" class="el-icon-check middle"></i>
          </span>
        </el-row>
      </template>
      <template #iconName="{ formData }">
        <icon-picker v-model="formData.extraOption.iconName"></icon-picker>
      </template>
    </base-render-form>

    <interfaceDlg ref="interfaceDlg" :params-config="paramsConfig" @confirm="handleConfirm"></interfaceDlg>

    <fieldRenameDlg ref="fieldRenameDlg" @confirm="handleFieldRenameConfirm"></fieldRenameDlg>
  </div>
</template>

<script>
import BaseRenderForm from "../../../BaseRenderForm/index";
import { BtnConfigFormOptions, BtnConfigFrom } from "../../../../baseConfig/btnBaseConfig";
import { findFromOptionsIndexByfieldName } from "../../../../utils";
import interfaceDlg from "../dialogs/interfaceDlg.vue";
import fieldRenameDlg from "../dialogs/fieldRenameDlg.vue";

import IconPicker from "./components/iconPicker";
import { cloneDeep, merge } from "lodash";

export default {
  name: "SetupBtnConfig",
  components: {
    interfaceDlg,
    fieldRenameDlg,
    BaseRenderForm,
    IconPicker
  },
  props: {
    useDialog: Boolean,
    keyField: {
      type: String,
      default: () => {
        return "";
      }
    }
  },
  data() {
    return {
      colorList: ["", "primary", "success", "info", "warning", "danger"],
      btnConfigFormOptions: new BtnConfigFormOptions(),
      btnConfigFromArr: [],
      originConfigForm: {},
      btnConfigFrom: new BtnConfigFrom(),
      showParamsConfig: false,
      paramsConfig: {
        params: [],
        data: [],
        headers: []
      }
      // nameRules: { required: true, trigger: ['blur', 'change'], message: '请输入名称' },
    };
  },

  created() {
    // const target = this.btnConfigFormOptions.find(option => option.formItem.formField === 'authorize');
    // if (target) {
    //   target.listeners = {
    //     change: this.handleAuthorizeChange
    //   }
    // }
  },

  mounted() {
    // this.init()
  },
  methods: {
    expose_reductionAll() {
      this.btnConfigFormOptions = new BtnConfigFormOptions();
      this.btnConfigFrom = new BtnConfigFrom();
    },

    expose_hideSomeFieldOptions(fieldName) {
      if (typeof fieldName === "string") {
        fieldName = [fieldName];
      } else if (Array.isArray(fieldName)) {
        fieldName.map(item => {
          const index = findFromOptionsIndexByfieldName(this.btnConfigFormOptions, item);
          console.log(index, "index");
          index !== -1 && this.btnConfigFormOptions.splice(index, 1);
        });
      } else {
        console.error("expose_hideSomeFieldOptions只能接受字符串或者数组");
      }
    },

    expose_setBtnConfigFormOptions(options) {
      this.btnConfigFormOptions = options;
    },

    expose_getBtnConfigFormOptions() {
      return this.btnConfigFormOptions;
    },

    expose_getRawBtnConfigFormOptions() {
      return new BtnConfigFormOptions();
    },

    expose_getBtnConfigFromArr() {
      return this.btnConfigFromArr;
    },

    expose_setBtnConfigFromArr(arr) {
      this.btnConfigFromArr = arr;
    },

    expose_setBtnConfigFrom(obj) {
      this.originConfigForm = obj;
      const btnDefaultConfigFrom = new BtnConfigFrom();
      this.btnConfigFrom = merge(btnDefaultConfigFrom, obj);
    },

    expose_getBtnConfigFrom() {
      return this.btnConfigFrom;
    },

    expose_setExtraOption(options, field) {
      let target;
      this.btnConfigFormOptions.some(item => {
        if (item.formItem.child?.length) {
          const index = item.formItem.child.findIndex(child => child.formField === field);
          if (index !== -1) {
            target = item.formItem.child[index];
          }
          return target;
        }
        if (item.formItem.formField === field) {
          target = item.formItem;
        }
        return target;
      });
      console.log(target, "target");
      if (target) {
        target.extraOption = options;
      }
    },
    expose_delBtnConfigFromArr(index) {
      this.btnConfigFromArr.splice(index, 1);
    },

    handleRequestParamsConfigEdit() {
      this.paramsConfig = {
        ...this.paramsConfig,
        ...cloneDeep(this.btnConfigFrom.extraOption.requestParamsConfig)
      };
      this.$refs.interfaceDlg.showDlg();
    },

    handleConfirm(paramsConfig) {
      this.btnConfigFrom.extraOption.requestParamsConfig = paramsConfig;
    },

    onSubmit(data) {
      const iconName = data.extraOption.iconName;
      const val = data.extraOption.iconPosition;
      if (val === "front") {
        data.tagAttrs.icon = iconName;
        data.contentTextBehindTagOptions = {};
      } else {
        data.tagAttrs.icon = "";
        data.contentTextBehindTagOptions = {
          tagName: "i",
          className: iconName
        };
      }
      // 如果相同则说明是编辑，不同则是新增
      if (!this.btnConfigFromArr.some(item => item === this.originConfigForm)) {
        data.renderId = Math.random();
        this.btnConfigFromArr.push(data);
      } else {
        Object.assign(this.originConfigForm, data);
      }
      this.$emit("onSubmit");
      this.btnConfigFrom = new BtnConfigFrom();
    },
    onClose() {
      this.$emit("onClose");
      this.originConfigForm = {};
      this.btnConfigFrom = new BtnConfigFrom();
    },
    setBtnType(type) {
      this.btnConfigFrom.tagAttrs.type = type;
    },

    showRenameDlg() {
      if (this.btnConfigFrom.extraOption.deliverySelectListFields.length === 0) {
        return this.$warn("请先选择提交字段！");
      }
      const fieldConversions = this.btnConfigFrom.extraOption.fieldConversions;
      this.btnConfigFrom.extraOption.fieldConversions = [];
      this.btnConfigFrom.extraOption.deliverySelectListFields?.map(field => {
        this.btnConfigFrom.extraOption.fieldConversions.push({
          original: field,
          renamed: fieldConversions?.find?.(item => item.original === field)?.renamed || ""
        });
      });
      this.btnConfigFrom.extraOption.fieldConversions.unshift({
        original: `${this.keyField}（主键默认传入）`,
        renamed: fieldConversions?.find?.(item => item.original === `${this.keyField}（主键默认传入）`)?.renamed || ""
      });
      this.$refs.fieldRenameDlg.openDialog(this.btnConfigFrom.extraOption.fieldConversions);
      console.log("showRenameDlg");
    },

    handleFieldRenameConfirm(fieldConversions) {
      this.btnConfigFrom.extraOption.fieldConversions = fieldConversions;
    }

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

.config {
  display: flex;
  align-items: flex-start;
  font-size: 14px;
}

.configLeft {
  font-size: 14px;
  width: 160px;
}

.configRight {
  font-size: 14px;
  flex: 1;
}
</style>
