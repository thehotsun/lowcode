<template>
  <el-dialog
    title="树属性设置"
    :visible.sync="dialogVisibleTreeAttrs"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="900px"
    :before-close="handleCloseTreeAttrs"
  >
    <div style="min-width: 60px;background: #fff;padding: 10px; margin-top: 60px;margin-bottom: 60px;">
      <el-form ref="ruleForm" :model="treeAttrs" :rules="rules" label-width="130px" style="padding-bottom: 20px">
        <el-form-item label="数据模型">
          <el-switch v-model="treeAttrs.isDataModel"></el-switch>
        </el-form-item>
        <el-form-item v-if="!treeAttrs.isDataModel" label="接口地址">
          <el-input v-model="treeAttrs.requestUrl" style="width: 180px" placeholder="请输入接口地址"></el-input>
          <el-button type="text" @click="handleRequestParamsConfigEdit"> 编辑请求 </el-button>
        </el-form-item>
        <el-form-item v-if="!treeAttrs.isDataModel" label="请求类型">
          <el-select v-model="treeAttrs.requestType" placeholder="请选择">
            <el-option v-for="item in requestTypeList" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="指定node-key">
          <el-select v-if="treeAttrs.isDataModel" v-model="treeAttrs.nodeKey" placeholder="请选择">
            <el-option v-for="item in deliveryFieldsOption.options" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
          </el-select>
          <el-input v-else v-model="treeAttrs.nodeKey" placeholder="请输入"></el-input>
        </el-form-item>
        <el-form-item label="配置props" prop="props">
          <el-input v-model="treeAttrs.props" type="textarea" :rows="2" placeholder="请输入{children: 'children', label: 'label'}格式"></el-input>
        </el-form-item>
        <el-form-item label="显示复选框" prop="showCheckbox">
          <el-switch v-model="treeAttrs.showCheckbox" />
        </el-form-item>
        <el-form-item label="显示过滤框" prop="filter">
          <el-switch v-model="treeAttrs.filter" />
        </el-form-item>
        <el-form-item label="默认展开所有节点" prop="defaultExpandAll">
          <el-switch v-model="treeAttrs.defaultExpandAll" />
        </el-form-item>
        <el-form-item label="点击节点可收缩" prop="filter">
          <el-switch v-model="treeAttrs.expandOnClickNode" />
        </el-form-item>
        <el-form-item label="数据转换函数">
          <el-tooltip
            slot="label"
            class="item"
            effect="dark"
            content="由于当前通过sql查询很难直接生成树形结构所需的数据结构，因为通过此函数进行数据结构转换（优先级最高）"
            placement="top-start"
          >
            <span style="cursor: pointer;font-size: 14px">数据转换函数</span>
          </el-tooltip>
          <el-input v-model="treeAttrs.dataTransitionFn" placeholder="请输入数据转换函数" @focus="handleShow('dataTransitionFn', $event)"></el-input>
        </el-form-item>
        <el-form-item v-if="treeAttrs.isDataModel" label="数据转换配置">
          <el-tooltip
            slot="label"
            class="item"
            effect="dark"
            content="由于当前通过sql查询很难直接生成树形结构所需的数据结构，因为通过配置父子字段进行数据关联生成树状结构（优先级最比数据转换函数低）"
            placement="top-start"
          >
            <span style="cursor: pointer;font-size: 14px">数据转换配置</span>
          </el-tooltip>
          <span>父级id字段：</span>
          <el-select v-model="treeAttrs.dataTransitionParentField" placeholder="请选择">
            <el-option v-for="item in deliveryFieldsOption.options" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
          </el-select>
          <span>id字段：</span>
          <el-select v-model="treeAttrs.dataTransitionCurField" placeholder="请选择">
            <el-option v-for="item in deliveryFieldsOption.options" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="懒加载" prop="lazy">
          <el-switch v-model="treeAttrs.lazy" />
        </el-form-item>
        <el-form-item label="传递字段">
          <el-tooltip slot="label" class="item" effect="dark" content="选中某个节点后传递给右侧列表刷新接口的字段" placement="top-start">
            <span style="cursor: pointer;font-size: 14px">传递字段</span>
          </el-tooltip>
          <el-select v-if="treeAttrs.isDataModel" v-model="treeAttrs.deliveryField" placeholder="请选择">
            <el-option v-for="item in deliveryFieldsOption.options" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
          </el-select>
          <el-input v-else v-model="treeAttrs.deliveryField" placeholder="请输入"></el-input>
        </el-form-item>

        <el-form-item label="渲染函数">
          <el-input
            v-model="treeAttrs.renderContent"
            placeholder="请输入function(h, { node, data, store }){ return <span>{node.label}</span>}格式"
            @focus="handleShow('renderContent', $event)"
          ></el-input>
        </el-form-item>

        <el-form-item label="筛选函数">
          <el-input
            v-model="treeAttrs.filterFn"
            placeholder="请输入function(value, data){  return data.label.indexOf(value) !== -1;}格式"
            @focus="handleShow('filterFn', $event)"
          ></el-input>
        </el-form-item>

        <el-form-item label="自定义样式" prop="style">
          <el-input v-model="treeAttrs.style" type="textarea" :rows="2" placeholder="请输入样式"></el-input>
        </el-form-item>
      </el-form>
      <el-dialog :before-close="handleClose" title="代码编写" :visible="showCodeEditor" width="900px" :append-to-body="true">
        <js-code-editor ref="chEditor" mode="javascript" :readonly="false" :value="treeAttrs[curFn]" @input="handleEditorInput"></js-code-editor>
      </el-dialog>
    </div>
    <el-dialog title="请求接口设置" :visible.sync="showParamsConfig" :close-on-click-modal="false" :close-on-press-escape="false" width="40%" append-to-body>
      <template>
        <el-form ref="dsForm" :model="paramsConfig" label-width="0px" label-position="left" class="ds-form">
          <div class="config">
            <div class="configLeft">url参数（queryString）</div>
            <div class="configRight">
              <el-row v-for="(rp, pIdx) in paramsConfig.params" :key="pIdx" class="rd-row" :gutter="8">
                <el-col :span="7">
                  <el-form-item :required="true">
                    <el-input v-model="rp.name" placeholder="请输入名称"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item>
                    <el-input v-model="rp.value" placeholder="请输入值"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="3">
                  <el-button icon="el-icon-delete" plain circle @click="deleteRequestParam(pIdx)"></el-button>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="6">
                  <el-button type="text" icon="el-icon-plus" @click="addRequestParam">新增请求参数</el-button>
                </el-col>
              </el-row>
            </div>
          </div>
          <div class="config">
            <div class="configLeft">body参数（data）</div>
            <div class="configRight">
              <el-row v-for="(rd, dIdx) in paramsConfig.data" :key="dIdx" class="rd-row" :gutter="8">
                <el-col :span="7">
                  <el-form-item :required="true">
                    <el-input v-model="rd.name" placeholder="请输入名称"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item>
                    <el-input v-model="rd.value" placeholder="请输入值"></el-input>
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
            </div>
          </div>
          <div class="config">
            <div class="configLeft">请求头</div>
            <div class="configRight">
              <el-row v-for="(rd, dIdx) in paramsConfig.headers" :key="dIdx" class="rd-row" :gutter="8">
                <el-col :span="7">
                  <el-form-item :required="true">
                    <el-input v-model="rd.name" placeholder="请输入名称"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item>
                    <el-input v-model="rd.value" placeholder="请输入值"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="3">
                  <el-button icon="el-icon-delete" plain circle @click="deleteHeaderData(dIdx)"></el-button>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="6">
                  <el-button type="text" icon="el-icon-plus" @click="addHeaderData">新增请求头</el-button>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-form>
      </template>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showParamsConfig = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </span>
    </el-dialog>
  </el-dialog>
</template>

<script>
import { requestTypeList } from "/baseConfig/btnBaseConfig";
import { TreeAttrs } from "/baseConfig/treeBaseConfig";
import { merge, cloneDeep } from "lodash";

export default {
  data() {
    return {
      dialogVisibleTreeAttrs: false,
      showCodeEditor: false,
      treeAttrs: new TreeAttrs(),
      curFn: "",
      rules: {},
      deliveryFieldsOption: {
        options: []
      },
      requestTypeList,
      showParamsConfig: false,
      paramsConfig: {
        params: [],
        data: [],
        headers: []
      }
    };
  },

  methods: {
    init(id, formCode, attrs) {
      this.treeAttrs = attrs;
    },
    showTreeAttrs() {
      this.dialogVisibleTreeAttrs = true;
    },
    handleCloseTreeAttrs() {
      this.dialogVisibleTreeAttrs = false;
    },
    async handleShow(field) {
      this.curFn = field;
      this.showCodeEditor = true;
      await this.$nextTick();
      this.$refs.chEditor.aceEditor.setOptions({
        value: this.treeAttrs[this.curFn]
      });
      this.$refs.chEditor.codeValue = this.treeAttrs[this.curFn];
    },
    handleEditorInput(val) {
      this.treeAttrs[this.curFn] = val;
    },
    handleClose() {
      this.showCodeEditor = false;
    },
    setTreeAttrs(attrs) {
      this.treeAttrs = merge(new TreeAttrs(), attrs);
    },
    handleRequestParamsConfigEdit() {
      this.showParamsConfig = true;
      this.paramsConfig = {
        ...this.paramsConfig,
        ...cloneDeep(this.treeAttrs.requestParamsConfig)
      };
    },
    handleConfirm() {
      this.$refs.dsForm.validate((valid, fields) => {
        if (!valid) {
          this.$message.error("请求接口设置存在错误，请修改");
          return;
        }
        this.showParamsConfig = false;
        this.treeAttrs.requestParamsConfig = this.paramsConfig;
      });
    },
    addRequestParam() {
      this.paramsConfig.params.push({
        name: "",
        value: ""
      });
    },

    deleteRequestParam(idx) {
      this.paramsConfig.params.splice(idx, 1);
    },

    addRequestData() {
      this.paramsConfig.data.push({
        name: "",
        value: ""
      });
    },

    deleteRequestData(idx) {
      this.paramsConfig.data.splice(idx, 1);
    },

    addHeaderData() {
      this.paramsConfig.headers.push({
        name: "",
        value: ""
      });
    },

    deleteHeaderData(idx) {
      this.paramsConfig.headers.splice(idx, 1);
    },
    getRenderParams() {
      return this.treeAttrs;
    }
  }
};
</script>

<style lang="less" scoped>
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
