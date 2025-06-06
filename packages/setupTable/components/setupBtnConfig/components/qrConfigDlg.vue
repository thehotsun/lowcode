<template>
  <el-dialog v-dialogDrag title="字段配置" :visible.sync="dialogVisible" width="600px" append-to-body>
    <el-form ref="dlgForm" :model="form" :rules="rules" label-width="100px" size="small">
      <el-form-item label="字段名称" prop="fieldName" required>
        <el-input v-model="form.fieldName" placeholder="仅支持字母、数字、划线" />
      </el-form-item>

      <el-form-item label="显示名称" prop="fieldDisplayName">
        <el-input v-model="form.fieldDisplayName" />
      </el-form-item>

      <el-form-item label="大小(毫米)" prop="qr.qrSize">
        <el-input-number v-model="form.qr.qrSize" :min="0" :step="1" />
        <div class="el-form-item__tip">0 表示以生成的实际大小为准</div>
      </el-form-item>

      <el-form-item label="跳转类型" prop="qr.useCustomPage">
        <el-radio-group v-model="form.qr.useCustomPage">
          <el-radio :label="0">公共页面</el-radio>
          <el-radio :label="1">自定义页面</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.qr.useCustomPage === 0" label="显示字段配置">
        <div class="QRCodePageDataConent">
          <div class="QRCodetextConent">
            {{ form.qr.briefPageFields?.length ? form.qr.briefPageFields?.map(item => `${item.fieldDisplayName}(${item.fieldName})`).join(",") : "" }}
            &nbsp;
          </div>
          <el-button type="text" @click="handleQRCodePageData"> {{ form.qr.briefPageFields?.length ? "编辑" : "添加数据" }}</el-button>
        </div>
      </el-form-item>
      <el-form-item v-if="form.qr.useCustomPage === 0" label="页面操作项">
        <el-select v-model="form.qr.briefPageOperations" multiple placeholder="请选择">
          <el-option v-for="item in QRCodePageOperateList" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.qr.useCustomPage === 0 && form.qr.briefPageOperations.includes('form')" label="选择表单">
        <el-select v-model="form.qr.targetFormId" placeholder="请选择">
          <el-option v-for="item in formList" :key="item.formId" :label="item.formName" :value="item.formId"> </el-option>
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.qr.useCustomPage === 1" label="自定义地址" prop="qr.customPageUrlTemplate">
        <el-input v-model="form.qr.customPageUrlTemplate" placeholder="请输入相对或绝对 URL" />
        <div class="el-form-item__tip">
          说明：请在 url 中使用以下变量：<br />
          (1) dataId：当前数据的主键 id<br />
          (2) formId：对应表单的 id 或列表页的 id<br />
          (3) source：来源，如 detail / form / list / flow 等<br />
          (4) baseUrl：表示系统地址，包含 host 和一级地址<br />
          示例：<br />
          (1)${baseUrl}/#/pub/h5?datald=${datald}&formld=${formld}&source=${source}<br />
          (2)/other/#/pub/h5?datald=${datald}&formld=${formld}&source=${source}
        </div>
      </el-form-item>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </span>
    <!-- 二维码页面数据 -->
    <setQRCodePageDataDlg ref="setQRCodePageDataDlg" @ok="handleUpdateQRCodePageData"></setQRCodePageDataDlg>
  </el-dialog>
</template>

<script>
import { merge } from "lodash";
import setQRCodePageDataDlg from "./setQRCodePageDataDlg.vue";
function FieldInfo() {
  return {
    templateFieldId: "",
    fieldName: "",
    fieldDisplayName: "",
    qr: {
      qrSize: 0,
      briefPageFields: [],
      briefPageOperations: [],
      targetFormId: "",
      useCustomPage: 0,
      customPageUrlTemplate: ""
    }
  };
}

export default {
  components: { setQRCodePageDataDlg },
  props: {
    groupId: {
      type: String,
      default: () => {
        return "";
      }
    },
    btnId: {
      type: Number,
      default() {
        return "";
      }
    }
  },
  data() {
    return {
      dialogVisible: false,
      form: new FieldInfo(),
      formList: [],
      QRCodePageOperateList: [
        {
          id: "form",
          cnName: "表单"
        }
      ],
      rules: {
        fieldName: [
          { required: true, message: "字段名称不能为空", trigger: "blur" },
          {
            pattern: /^[A-Za-z0-9\-]+$/,
            message: "仅支持字母、数字、划线",
            trigger: "blur"
          }
        ],
        "qr.qrSize": [{ type: "number", required: true, message: "请输入有效的大小", trigger: "change" }],
        "qr.useCustomPage": [{ required: true, message: "请选择跳转类型", trigger: "change" }],
        "qr.customPageUrlTemplate": [
          {
            required: true,
            message: "请输入自定义页面地址",
            trigger: "blur",
            validator: (rule, value, callback, source, options) => {
              if (source.qr.useCustomPage === 1 && !value) {
                callback(new Error("请输入自定义页面地址"));
              } else {
                callback();
              }
            }
          }
        ]
      }
    };
  },
  inject: {
    saveQrCodeField: {
      default: () => () => {}
    },
    getFormList: {
      default: () => () => {}
    }
  },
  methods: {
    async open(data) {
      const base = FieldInfo(); // 默认结构
      this.form = data
        ? merge(base, data) // 深度合并
        : base;
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.dlgForm.clearValidate();
      });
      this.formList = await this.getFormList();
    },
    handleCancel() {
      this.dialogVisible = false;
      this.form = FieldInfo();
    },
    async handleConfirm() {
      this.$refs.dlgForm.validate(async valid => {
        if (!valid) return;
        await this.saveQrCodeField({
          ...this.form,
          listPageId: this.groupId,
          buttonId: this.btnId
        });
        console.log("提交数据：", this.form);
        this.$emit("ok", this.form);
        this.handleCancel();
      });
    },
    // 设计二维码数据
    async handleQRCodePageData() {
      this.$refs.setQRCodePageDataDlg.openDlg(
        this.form.qr.briefPageFields.map(item => {
          item.show = true;
          return item;
        })
      );
    },
    handleUpdateQRCodePageData(briefPageFields) {
      this.form.qr.briefPageFields = briefPageFields;
    }
  }
};
</script>

<style lang="less" scoped>
.el-form-item__tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  line-height: 1.6;
}
.QRCodePageDataConent {
  display: flex;

  .QRCodetextConent {
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
