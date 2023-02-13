<template>
  <div>
    <base-render-form ref="form" :form-data="formData" :form-options="formOptions" :only-show="false" :rules="rules"
      @onClose="onClose" @onSubmit="onSubmit">
      <!-- 注意这里的slot值要和formOptions中配置的slotName一致 -->
      <!-- #operator是简写，详细查阅文档 -->
      <template #operator="{ formData }">
        <!-- 自定义组件使用changeFormData给formdata赋值 -->
        <customCompVue :form-data="formData" @changeFormData="changeFormData"></customCompVue>
      </template>
      <!--
      <template #input="{ formData }">
        <input :formData="formData" @focus="focus" />
      </template> -->
    </base-render-form>
  </div>
</template>

<script>
// BaseRenderForm组件内置了expose_getElFormInstance方法，可以通过调用此组件的这个方法获取el-table的实例，例如
// const elFormInstance = this.$refs.form.expose_getElFormInstance()

// BaseRenderForm组件内置了expose_getElDialogInstance方法，可以通过调用此组件的这个方法获取el-dialog的实例(使用此方法请确认useDialog传入的值不为false，true为此prop的默认值)，例如
// const elDialogInstance = this.$refs.form.expose_getElDialogInstance()

// BaseRenderForm组件内置了expose_setShowDialog方法，可以通过调用此组件的这个方法设置当前dialog的显隐

import BaseRenderForm from '../packages/BaseRenderForm/index';
import customCompVue from './customComp.vue';

// 建议单独建立一个options文件，用以描述静态属性
import formOptions from './formOptions';

export default {
  components: {
    BaseRenderForm,
    customCompVue
  },
  data () {
    return {
      // tabledata 属性值要做到和tableOptions中的formField相对应
      formData: {
        coverId: '123',
        format: '222',
        pageNum: '4',
        pageAllNum: '8',
        input: '78',
        count: 1
      },
      // formOptions必须为数组，元素必须为obj，且必须包含formItem 属性
      formOptions: formOptions,
      // 如需自定义校验，参照如下写法
      rules: {
        input: [
          { validator: this.validatePass, trigger: 'blur' }
        ],
        coverId: [
          { required: true, message: '请选择coverId', trigger: 'change' }
        ],
        pageNum: [
          { required: true, message: '请选择pageNum', trigger: 'blur' }
        ],
        count: [
          { required: true, message: '请选择count', trigger: 'blur' }
        ]
      }
    };
  },

  mounted () {
    this.queryOptions();
  },

  methods: {
    validatePass (rule, value, callback) {
      console.log(value, this.formData.input);
      if (this.formData.input === '') {
        callback(new Error('请输入密码'));
      } else {
        callback();
      }
    },

    queryOptions () {
      setTimeout(() => {
        this.$set(this.formOptions[1].formItem.extraOption, 'options', [{ id: '123', cnName: 'hi好' }, { id: '1', cnName: '好' }]);
      }, 1000);

      // 如想使用这种方式，请提前在target上声明好属性，否则请使用$set方法
      // this.formOptions[1].formItem.extraOption.options = [{ id: '123', cnName: 'hi好' }, { id: '1', cnName: '好' }]
    },

    changeFormData (key, value) {
      // 防止用户赋值给没有声明的属性值，导致其变为非响应式数据
      this.$set(this.formData, key, value);
    },

    onSubmit () {
      console.log('父组件执行onSubmit');
    },
    onClose () {
      console.log('父组件执行onclose');
    }
  }
};
</script>

<style lang="scss" scoped>
/deep/ .input {
  border: 1px solid red;
}
</style>
