<template>
  <div class="wrap">
    <base-render-form
      ref="form"
      :form-data="btnConfigFrom"
      :form-options="btnConfigFormOptions"
      :use-dialog="useDialog"
      style="background: #fff;padding:5px 20px 30px"
      @onSubmit="onSubmit"
      @onClose="onClose"
    >
      <template #requestUrl="{ formData }">
        <div>
          <el-input v-model="formData.extraOption.requestUrl" style="width: 180px" placeholder="请输入接口地址"></el-input>
          <el-button type="text" @click="handleRequestParamsConfigEdit"> 编辑请求 </el-button>
          <el-button type="text" @click="handleRequestTest"> 测试 </el-button>
        </div>
      </template>

      <template #deliverySelectListFields="{ formData }">
        <div>
          <div class="flex">
            <div v-if="formData.extraOption.deliverySelectListFields.length > 0" class="showdeliveryField">
              {{ getDisplayText(formData.extraOption.deliverySelectListFields) }}
            </div>
            <el-button type="text" @click="showRenameDlg">
              设置 <el-tooltip content="提示：如果不设置提交字段，则默认提交主键字段"><i style="width: 20px" class="el-icon-question"></i> </el-tooltip>
            </el-button>
          </div>
        </div>
      </template>

      <template #color>
        <el-row>
          <span v-for="item in colorList" :key="item">
            <el-button :type="item" @click="setBtnType(item)"></el-button> <i v-if="btnConfigFrom.tagAttrs.type === item" class="el-icon-check middle"></i>
          </span>
        </el-row>
      </template>
      <template #iconName="{ formData }"> <icon-picker v-model="formData.extraOption.iconName"></icon-picker> </template>

      <template #formDownloadSlot class="formDownloadSlot">
        <div class="file-actions">
          <!-- 自定义触发按钮 -->
          <el-upload ref="upload" :http-request="uploadFile" class="upload-file" accept=".docx" :show-file-list="false" style="display: inline-block; margin: 0 10px" action="/">
            <el-button type="text" size="mini" icon="el-icon-upload2">
              {{ printDesignForm.templateFileId ? "重新上传" : "上传" }}
            </el-button>
          </el-upload>

          <!-- 上传格式提示组件 -->
          <el-tooltip placement="top" content="本地上传只能上传docx格式的模板">
            <i class="el-icon-question" style="margin-left: 2px; margin-right: 5px"></i>
          </el-tooltip>
          <!-- 条件渲染的下载按钮 -->
          <el-button v-if="printDesignForm.templateFileId" type="text" size="mini" @click="handleDesignDown">
            下载
          </el-button>

          <!-- 带条件渲染的删除按钮 -->
          <el-button v-if="printDesignForm.templateFileId" type="text" size="mini" @click="handleDesignDel">
            删除
          </el-button>

          <el-button v-if="printDesignForm.templateFileId" type="text" @click="handlePreview">
            预览
          </el-button>
        </div>
        <div v-if="printDesignForm.templateFileName">
          <el-button type="text" class="underline" @click="handlePreview">{{ printDesignForm.templateFileName }}</el-button>
        </div>
      </template>
      <template #formDownloadFileNameSlot class="formDownloadSlot">
        <div>
          {{ printDesignForm.resultFileName }} <el-button type="text" @click="handleResultFileName"> {{ printDesignForm.resultFileName ? "编辑" : "设计文件名" }}</el-button>
        </div>
      </template>
      <template #formDownloadFileTypeSlot class="formDownloadSlot">
        <el-select v-model="printDesignForm.resultFileFormat" placeholder="请选择" @change="handleUpdateResultFileFormat">
          <el-option v-for="item in outputFileFormatList" :key="item.id" :label="item.name" :value="item.id"> </el-option>
        </el-select>
      </template>
      <template v-if="resourceInfo.name" #relateFrom>
        <el-button type="text" @click="openSource">{{ resourceInfo.name }}</el-button>
      </template>

      <template #refreshList>
        <el-button type="text" icon="el-icon-refresh-right" @click="refreshList"></el-button>
      </template>

      <template #formDownloadDataSlot class="formDownloadSlot">
        <div class="flex">
          自定义字段
          <el-button type="text" class="underline" icon="el-icon-plus" @click="addCustomField">添加</el-button>
        </div>

        <el-table :data="printDesignForm.customFields" border stripe max-height="300" style="width: 100%" class="table">
          <el-table-column prop="customizedFieldName" label="字段名称" width="150px" align="center" show-overflow-tooltip></el-table-column>
          <el-table-column prop="customizedFieldDisplayName" label="显示名称" align="center" show-overflow-tooltip></el-table-column>
          <el-table-column label="操作" prop="" align="center">
            <template #default="{ row }">
              <el-button type="text" class="operBtn" @click.stop="editCustomField('customField', row)">编辑</el-button>
              <el-button type="text" class="operBtn" @click.stop="delCustomField(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="flex">
          自定义数据
          <el-button type="text" class="underline" icon="el-icon-edit" @click="editCustomField('customData')">编辑</el-button>
        </div>
        <div>自定义方法： {{ printDesignForm?.customizedMethod }}</div>
        <div>自定义SQL： {{ printDesignForm?.customizedSql }}</div>
      </template>

      <template #QRCodeTitle="{ formData }" class="formDownloadSlot">
        <div>
          {{ formData.extraOption.QRCodeTitle }} <el-button type="text" @click="handleQRCodeTitle"> {{ formData.extraOption.QRCodeTitle ? "编辑" : "设计标题" }}</el-button>
        </div>
      </template>

      <template #QRCodePageData="{ formData }" class="formDownloadSlot">
        <div class="QRCodePageDataConent">
          <div class="QRCodetextConent">
            {{ formData.extraOption.QRCodePageData?.length ? formData.extraOption.QRCodePageData.map(item => `${item.fieldName}(${item.fieldCode})`).join(",") : "" }}
          </div>
          <el-button type="text" @click="handleQRCodePageData"> {{ formData.extraOption.QRCodePageData?.length ? "编辑" : "添加数据" }}</el-button>
        </div>
      </template>
    </base-render-form>

    <interfaceDlg ref="interfaceDlg" :params-config="paramsConfig" :interface-config="interfaceConfig" @confirm="handleConfirm"></interfaceDlg>

    <fieldRenameDlg ref="fieldRenameDlg" @confirm="handleFieldRenameConfirm"></fieldRenameDlg>
    <!-- 模板弹窗 -->
    <component :is="editPrintTemplateDataDlg" ref="codeMirrorDlg" @ok="getTemplateInfo"></component>
    <!-- 内容构造器 -->
    <setTemplateNameDlg ref="setTemplateNameDlg" @ok="handleUpdateTemplateName"></setTemplateNameDlg>
    <!-- 二维码页面数据 -->
    <setQRCodePageDataDlg ref="setQRCodePageDataDlg" @ok="handleUpdateQRCodePageData"></setQRCodePageDataDlg>
  </div>
</template>

<script>
import BaseRenderForm from "../../../BaseRenderForm/index";
import { BtnConfigFormOptions, BtnConfigFrom } from "../../../../baseConfig/btnBaseConfig";
import { findFromOptionsIndexByfieldName } from "../../../../utils";
import interfaceDlg from "../dialogs/interfaceDlg.vue";
import fieldRenameDlg from "../dialogs/fieldRenameDlg.vue";
import setTemplateNameDlg from "./components/setTemplateNameDlg.vue";
import setQRCodePageDataDlg from "./components/setQRCodePageDataDlg.vue";
import IconPicker from "./components/iconPicker";
import { cloneDeep, merge } from "lodash";
function PrintDesignForm() {
  return {
    resultFileFormat: "",
    templateFileId: "",
    templateFileVersion: 1,
    templateFileName: "",
    resultFileName: null,
    customFields: []
  };
}
export default {
  name: "SetupBtnConfig",
  components: {
    interfaceDlg,
    fieldRenameDlg,
    BaseRenderForm,
    IconPicker,
    setTemplateNameDlg,
    setQRCodePageDataDlg
  },
  inject: {
    printTemplateUpload: {
      default: () => () => {}
    },
    getPrintTemplateInfo: {
      default: () => () => {}
    },
    updateTemplateName: {
      default: () => () => {}
    },
    delTemplate: {
      default: () => () => {}
    },
    deleteCustomField: {
      default: () => () => {}
    },
    queryEnterpriseIdhiddenFolder: {
      default: () => () => {}
    },
    enterpriseId: {
      default: () => {}
    },
    downloadUrltoken: {
      default: () => () => {}
    },
    downloadFile: {
      default: () => () => {}
    },
    filePreviewV1: {
      default: () => () => {}
    },
    editPrintTemplateDataDlg: {
      default: () => {}
    },
    queryFormNamePath: {
      default: () => () => {}
    },
    queryPrintParamFields: {
      default: () => () => {}
    }
  },
  props: {
    useDialog: Boolean,
    drawer: Boolean,
    keyField: {
      type: String,
      default: () => {
        return "";
      }
    },
    groupId: {
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
      },
      printDesignForm: new PrintDesignForm(),
      resourceInfo: {
        name: "",
        id: ""
      },
      outputFileFormatList: [
        {
          id: "",
          name: "打印时用户自行选择"
        },
        {
          id: "pdf",
          name: "pdf"
        },
        {
          id: "docx",
          name: "word"
        }
      ]
      // nameRules: { required: true, trigger: ['blur', 'change'], message: '请输入名称' },
    };
  },
  computed: {
    interfaceConfig() {
      const apiUrl = this.btnConfigFrom.extraOption.requestUrl;
      const apiMethod = this.btnConfigFrom.extraOption.requestType;
      return {
        apiUrl,
        apiMethod
      };
    },
    watchRefreshData() {
      return [this.btnConfigFrom.extraOption.openType, this.drawer];
    }
  },

  watch: {
    "btnConfigFrom.extraOption.QRCodeRelateFrom": {
      handler(val) {
        if (this.btnConfigFrom.extraOption.openType === -1 && this.btnConfigFrom.extraOption.btnType === "QRCode" && val) {
          this.getResourceInfo({
            formCode: val
          });
        }
      },
      deep: true
    },
    "btnConfigFrom.extraOption.relateFrom": {
      handler(val) {
        if (this.btnConfigFrom.extraOption.openType === 0 && val) {
          this.getResourceInfo({
            formCode: val
          });
        }
      },
      deep: true
    },
    "btnConfigFrom.extraOption.relateTable": {
      handler(val) {
        if (this.btnConfigFrom.extraOption.openType === 6 && val) {
          this.getResourceInfo({
            formCode: val
          });
        }
      },
      deep: true
    },
    "btnConfigFrom.extraOption.flowKey": {
      handler(val) {
        if (this.btnConfigFrom.extraOption.openType === 2 && val) {
          this.$nextTick(() => {
            this.getResourceInfo({
              flowKey: val,
              enterpriseId: this.enterpriseId
            });
            // const node = this.$refs.form.$refs.chooseFlow.getCheckedNodes();
            // console.log("node", node);
            // this.resourceInfo.id = node[0].id;
            // this.resourceInfo.name = node[0].pathLabels.join("/");
          });
        }
      },
      deep: true
    },
    // 当抽屉打开时，一定刷新资源列表，当打卡方式更改时，也刷新资源列表
    watchRefreshData: {
      handler(newVal, oldVal) {
        let newopenType, newdrawer, oldopenType, olddrawer;
        if (newVal) {
          [newopenType, newdrawer] = newVal;
        }
        if (oldVal) {
          [oldopenType, olddrawer] = oldVal;
        }
        console.log("watchRefreshData", newopenType, newdrawer, oldopenType, olddrawer);

        if (olddrawer !== true && newdrawer === true) {
          this.refreshList(false);
        } else if (olddrawer === true && newdrawer === true && newopenType !== oldopenType) {
          this.refreshList(false);
        }
        this.resourceInfo = {
          name: "",
          id: ""
        };
      },
      immediate: true
    }
  },

  created() {
    // const target = this.btnConfigFormOptions.find(option => option.formItem.formField === 'authorize');
    // if (target) {
    //   target.listeners = {
    //     change: this.handleAuthorizeChange
    //   }
    // }
  },

  mounted() {},
  methods: {
    expose_reductionAll() {
      this.btnConfigFormOptions = new BtnConfigFormOptions();
      this.resetData();
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

    expose_setBtnConfigFrom(obj, isEdit = false) {
      this.originConfigForm = obj;
      const btnDefaultConfigFrom = new BtnConfigFrom();
      if (!isEdit) {
        // 获取所有现有ID的集合（性能优化）
        const existingIds = new Set(this.btnConfigFromArr.map(item => item.btnId));
        console.log("existingIds", existingIds, existingIds.has(btnDefaultConfigFrom.btnId));
        // 安全计数器防止无限循环
        let attempts = 0;
        const maxAttempts = 200;
        do {
          // 首次循环检查初始ID是否可用
          if (attempts === 0 && !existingIds.has(btnDefaultConfigFrom.btnId)) {
            console.log("break");
            break;
          }

          // 生成新ID
          btnDefaultConfigFrom.btnId = Math.floor(Math.random() * 900) + 100;
          attempts++;

          // 当尝试次数超过理论最大值时报错
          if (attempts > maxAttempts) {
            throw new Error("无法生成唯一ID，尝试次数超过200次");
          }
        } while (existingIds.has(btnDefaultConfigFrom.btnId));
      }
      this.btnConfigFrom = merge(btnDefaultConfigFrom, obj);
      if (isEdit && this.btnConfigFrom.extraOption.btnType === "formDownload") {
        this.getTemplateInfo();
      }
    },

    expose_getBtnConfigFrom() {
      return this.btnConfigFrom;
    },

    expose_setExtraOption(options, field, objectHierarchy) {
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
        if (objectHierarchy) {
          const finalObj = objectHierarchy.reduce((acc, cur) => {
            return acc?.[cur];
          }, item.formItem);
          if (finalObj?.formField === field) {
            target = finalObj;
          }
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

    getExtraOption(field) {
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
      return target.extraOption;
    },

    handleRequestParamsConfigEdit(dlgParams) {
      this.paramsConfig = {
        ...this.paramsConfig,
        ...cloneDeep(this.btnConfigFrom.extraOption.requestParamsConfig)
      };
      this.$refs.interfaceDlg.showDlg(dlgParams);
    },

    handleRequestTest() {
      this.handleRequestParamsConfigEdit({
        hiddenFooter: true,
        showTestRequest: true
      });
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
      this.resetData();
    },
    onClose() {
      this.$emit("onClose");
      this.resetData();
    },
    resetData() {
      this.originConfigForm = {};
      this.printDesignForm = new PrintDesignForm();
      this.btnConfigFrom = new BtnConfigFrom();
      this.resourceInfo = {
        name: "",
        id: ""
      };
      this.$nextTick(() => {
        this.$refs?.form?.$refs?.elForm?.clearValidate();
      });
    },
    setBtnType(type) {
      this.btnConfigFrom.tagAttrs.type = type;
    },

    showRenameDlg() {
      const deliverySelectListFields = this.btnConfigFrom.extraOption.deliverySelectListFields;
      const fieldArr = this.getExtraOption("extraOption.deliverySelectListFields")?.options?.map(item => {
        const target = deliverySelectListFields?.find?.(filedInfo => filedInfo?.fieldCode === item.fieldCode || filedInfo === item.fieldCode);
        return {
          errorMessage: "",
          fieldCode: item.fieldCode,
          fieldName: item.fieldName,
          renamed: target?.renamed || "",
          isSelected: !!target
        };
      });
      const target = deliverySelectListFields?.find?.(filedInfo => filedInfo?.fieldCode === this.keyField || filedInfo === this.keyField);
      fieldArr.unshift({
        errorMessage: "",
        fieldCode: this.keyField,
        fieldName: "主键",
        // this?.btnConfigFrom?.extraOption?.paramName 是 paramName字段的兼容性代码
        renamed: target?.renamed || this?.btnConfigFrom?.extraOption?.paramName || "",
        isSelected: !!target
      });
      this.$refs.fieldRenameDlg.openDialog(fieldArr);
      console.log("showRenameDlg");
    },

    handleFieldRenameConfirm(deliverySelectListFields) {
      this.btnConfigFrom.extraOption.deliverySelectListFields = deliverySelectListFields;
      // paramName字段的兼容性代码
      if (this.btnConfigFrom.extraOption.openType === 5 && this.btnConfigFrom.extraOption.paramName) {
        this.btnConfigFrom.extraOption.paramName = "";
      }
    },

    getDisplayText(deliverySelectListFields) {
      const that = this;
      function getLabel(field) {
        if (typeof field === "string") {
          field = that.getExtraOption("extraOption.deliverySelectListFields")?.options?.find(item => item.fieldCode === field);
        }
        return `${field?.fieldName}(${field?.renamed || field?.fieldCode})`;
      }
      let str = "";
      str += getLabel(deliverySelectListFields[0]);
      if (deliverySelectListFields.length > 1) {
        str += "， ";
        str += getLabel(deliverySelectListFields[1]);
      }
      const maxlength = 30;
      if (deliverySelectListFields.length > 2 || str.length > maxlength) {
        str = str.slice(0, maxlength) + "...";
      }
      return str;
    },

    async uploadFile({ file }) {
      try {
        this.loading = true;
        const data = new FormData();
        data.append("file", file);
        data.append("listPageId", this.groupId);
        data.append("buttonId", this.btnConfigFrom.btnId);
        await this.printTemplateUpload(data);
        this.$success("上传成功");
        this.getTemplateInfo();
      } catch (error) {
        console.error(error);
        this.$message.error("上传失败");
        this.loading = false;
      }
    },

    // 隐藏文件夹
    async getFolder() {
      const { data } = await this.queryEnterpriseIdhiddenFolder(this.enterpriseId);
      return data || "";
    },

    handleDesignDown() {
      const fileId = this.printDesignForm.templateFileId;
      const url = this.downloadUrltoken("EnterpriseDoc", fileId);
      this.downloadFile(url);
    },
    async handleResultFileName() {
      const fields = await this.getFields("queryPrintParamFields", this.groupId);
      this.$refs.setTemplateNameDlg.handleGenerateName(this.printDesignForm.resultFileName, fields);
    },
    // TODO
    // 设计文件名
    async handleQRCodeTitle() {
      const fields = await this.getFields("queryPrintParamFields", this.groupId);
      this.$refs.setTemplateNameDlg.handleGenerateName(this.btnConfigFrom.QRCodeTitle, fields);
    },
    // TODO
    // 设计二维码数据
    handleQRCodePageData() {
      this.$refs.setQRCodePageDataDlg.openDlg(this.btnConfigFrom.extraOption.QRCodePageData);
    },

    handleUpdateQRCodePageData(QRCodePageData) {
      console.log("QRCodePageData", QRCodePageData);

      this.btnConfigFrom.extraOption.QRCodePageData = QRCodePageData;
    },

    async handleUpdateTemplateName(resultFileName) {
      const params = {
        listPageId: this.groupId,
        buttonId: this.btnConfigFrom.btnId,
        resultFileName,
        resultFileFormat: this.printDesignForm.resultFileFormat
      };
      this.updateAttributes(params);
    },

    handleUpdateResultFileFormat(resultFileFormat) {
      const params = {
        listPageId: this.groupId,
        buttonId: this.btnConfigFrom.btnId,
        resultFileName: this.printDesignForm.resultFileName,
        resultFileFormat
      };
      this.updateAttributes(params);
    },

    async updateAttributes(params) {
      await this.updateTemplateName(params);
      this.getTemplateInfo();
    },

    handleDesignDel() {
      this.$confirm("警告：如果删除模板，将不会再生成成果文件，确认继续吗？", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(async () => {
        await this.delTemplate(this.groupId, this.btnConfigFrom.btnId);
        this.getTemplateInfo();
      });
    },
    handlePreview() {
      const { templateFileId: fileId, templateFileVersion: versionId } = this.printDesignForm;
      const data = { fileId, versionId, fileType: 12 };
      this.filePreviewV1(data);
    },
    addCustomField() {
      this.$refs.codeMirrorDlg.open({ val: "customField", mode: 0, listPageId: this.groupId, buttonId: this.btnConfigFrom.btnId }, "table");
    },
    editCustomField(val, row) {
      let params = {};
      if (val === "customField") {
        params = { ...row };
      } else {
        params = {
          customizedMethod: this.printDesignForm.customizedMethod,
          customizedSql: this.printDesignForm.customizedSql
        };
      }
      this.$refs.codeMirrorDlg.open({ val, mode: 1, listPageId: this.groupId, buttonId: this.btnConfigFrom.btnId, params }, "table");
    },
    async delCustomField(row) {
      await this.$confirm(`您确定要删除这个自定义字段吗?`, { type: "warning" });
      const { customizedFieldName } = row;
      await this.deleteCustomField(customizedFieldName, this.groupId, this.btnConfigFrom.btnId);
      this.$message.success("删除成功");
      this.getTemplateInfo();
    },
    async getTemplateInfo() {
      const res = await this.getPrintTemplateInfo(this.groupId, this.btnConfigFrom.btnId);
      if (!res.data.resultFileFormat) {
        res.data.resultFileFormat = "";
      }
      this.printDesignForm = res.data || new PrintDesignForm();
    },
    async getResourceInfo({ formCode, flowKey, enterpriseId }) {
      if (!formCode && !flowKey) {
        return;
      }
      const pathInfo = await this.queryFormNamePath(formCode, null, flowKey, enterpriseId);
      this.resourceInfo = pathInfo;
    },
    async openSource() {
      const routeUrl = this.$router.resolve({ name: "meta-data", query: { type: "form", id: this.resourceInfo.id } });
      window.open(routeUrl.href, "_blank");
    },
    refreshList(isTip = true) {
      this.$emit("refreshList", {
        openType: this.btnConfigFrom.extraOption.openType,
        btnType: this.btnConfigFrom.extraOption.btnType,
        isTip
      });
    },
    async getFields(interfaceName, ...params) {
      return this[interfaceName](...params).then(({ data }) => {
        const fields = [];
        Object.entries(data).forEach(([key, value]) => {
          const obj = {};
          obj.type = key;
          switch (key) {
            case "commonColumns":
              obj.typeDispalyName = "公共字段";
              obj.btnInfoArr = value;
              break;
            case "metaColumns":
              obj.typeDispalyName = "主表字段";
              obj.btnInfoArr = value.map(item => {
                item.fieldName = `m.${item.fieldName}`;
                return item;
              });
              break;
            case "viewColumns":
              obj.typeDispalyName = "视图字段";
              obj.btnInfoArr = value.map(item => {
                item.fieldName = `v.${item.fieldName}`;
                return item;
              });
              break;
            default:
              break;
          }
          fields.push(obj);
        });
        return fields;
      });
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
  .formDownloadSlot {
    padding: 0 30px;
  }

  .showdeliveryField {
    display: inline-block;
    white-space: nowrap; /* 不允许文本换行 */
  }
  ::v-deep .el-form-item {
    margin-bottom: 8px !important;
  }
  .ml10 {
    margin-left: 10px;
  }
  .table {
    margin: 5px 0;
  }
  .file-actions {
    .upload-file {
      margin: 0 !important;
    }
    .el-button {
      margin: 0 !important;
      padding: 0 !important;
    }
  }
  .underline {
    text-decoration: underline;
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
}
</style>
