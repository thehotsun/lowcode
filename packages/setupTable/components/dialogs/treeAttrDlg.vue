<template>
  <el-dialog
    title="树属性设置"
    :visible.sync="dialogVisibleTreeAttrs"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="900px"
    :before-close="handleCloseTreeAttrs"
  >
    <div style="min-width: 60px;background: #fff;padding: 10px;">
      <el-form ref="ruleForm" :model="treeAttrs" :rules="rules" label-width="130px" style="padding-bottom: 20px">
        <el-form-item label="指定node-key">
          <el-select v-if="isDataModel" v-model="treeAttrs.nodeKey" placeholder="请选择">
            <el-option v-for="item in deliveryFieldsOption.options" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
          </el-select>
          <el-input v-else v-model="treeAttrs.nodeKey" placeholder="请输入"></el-input>
        </el-form-item>

        <el-form-item label="当前选中">
          <el-tooltip slot="label" class="item" effect="dark" content="匹配中的值会高亮" placement="top-start">
            <span style="cursor: pointer;font-size: 14px">当前选中</span>
          </el-tooltip>
          <el-input v-model="treeAttrs.currentNodeKey" placeholder="请输入类似5格式， 其中5是当前选中的nodekey的值"></el-input>
        </el-form-item>

        <el-form-item label="默认展开">
          <el-input v-model="treeAttrs.defaultExpandedKeys" placeholder="请输入类似[2, 3]格式， 其中2和3是默认展开的nodekey的值"></el-input>
        </el-form-item>

        <el-form-item label="传递字段">
          <el-tooltip slot="label" class="item" effect="dark" content="选中某个节点后传递给右侧列表刷新接口的字段" placement="top-start">
            <span style="cursor: pointer;font-size: 14px">传递字段</span>
          </el-tooltip>
          <el-select v-if="isDataModel" v-model="treeAttrs.deliveryField" placeholder="请选择">
            <el-option v-for="item in deliveryFieldsOption.options" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
          </el-select>
          <el-input v-else v-model="treeAttrs.deliveryField" placeholder="请输入"></el-input>
        </el-form-item>

        <el-form-item label="配置props" prop="props">
          <el-input v-model="treeAttrs.props" type="textarea" :rows="2" placeholder="请输入{children: 'children', label: 'label'}格式,如果不输入，默认使用上述配置"></el-input>
        </el-form-item>
        <el-form-item label="" prop="props">
          <el-tooltip slot="label" class="item" effect="dark" content="单位支持px和%，不填单位默认px" placement="top-start">
            <span style="cursor: pointer;font-size: 14px">宽度（px|%）</span>
          </el-tooltip>
          <el-input v-model="treeAttrs.width" placeholder="请输入宽度"></el-input>
        </el-form-item>

        <el-form-item label="自定义图标">
          <el-tooltip slot="label" class="fontSize14" effect="dark" content="如果选择图标，则会替换原本▶的icon" placement="top-start">
            <span>自定义图标<i style="width: 20px" class="el-icon-question"></i></span>
          </el-tooltip>
          <icon-picker v-model="treeAttrs.iconClass"></icon-picker>
        </el-form-item>

        <el-form-item label="基础配置" prop="showCheckbox">
          <el-checkbox v-model="treeAttrs.showCheckbox">复选框</el-checkbox>
          <el-checkbox v-model="treeAttrs.filter">过滤框</el-checkbox>
          <el-tooltip
            class="item"
            effect="dark"
            content="是否在点击节点的时候展开或者收缩节点， 默认值为 true，如果为 false，则只有点箭头图标的时候才会展开或者收缩节点。"
            placement="top-start"
          >
            <el-checkbox v-model="treeAttrs.expandOnClickNode">
              <span style="cursor: pointer;font-size: 14px">点击节点可收缩</span>
            </el-checkbox>
          </el-tooltip>
          <el-checkbox v-model="treeAttrs.defaultExpandAll">默认展开所有节点</el-checkbox>
          <el-checkbox v-model="treeAttrs.lazy">懒加载</el-checkbox>
          <el-tooltip class="item" effect="dark" content="是否每次只打开一个同级树节点展开" placement="top-start">
            <el-checkbox v-model="treeAttrs.accordion">
              <span style="cursor: pointer;font-size: 14px">手风琴模式</span>
            </el-checkbox>
          </el-tooltip>
        </el-form-item>

        <el-form-item v-if="treeAttrs.showCheckbox" label="默认选中">
          <el-tooltip slot="label" class="item" effect="dark" content="只有显示复选框时才生效，匹配的节点复选框会被选中" placement="top-start">
            <span style="cursor: pointer;font-size: 14px">默认选中</span>
          </el-tooltip>
          <el-input v-model="treeAttrs.defaultCheckedKeys" placeholder="请输入类似[5]格式， 其中5是默认选中的nodekey的值"></el-input>
        </el-form-item>

        <el-form-item v-if="treeAttrs.lazy" label="懒加载函数">
          <el-input
            v-model="treeAttrs.loadFn"
            placeholder="请输入function(node, resolve){ if (node.level === 0) {
          return resolve([{ name: 'region' }]);
        }}格式"
            @focus="handleShow('loadFn', $event)"
          ></el-input>
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
        <el-form-item v-if="isDataModel" label="数据转换配置">
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

        <el-form-item label="点击事件">
          <el-input v-model="treeAttrs.nodeClick" placeholder="请输入function(data){ }格式" @focus="handleShow('nodeClick', $event)"></el-input>
        </el-form-item>

        <el-form-item label="自定义样式" prop="style">
          <el-input v-model="treeAttrs.style" type="textarea" :rows="2" placeholder="请输入样式"></el-input>
        </el-form-item>
      </el-form>
      <el-dialog :before-close="handleClose" title="代码编写" :visible="showCodeEditor" width="900px" :append-to-body="true">
        <js-code-editor ref="chEditor" mode="javascript" :readonly="false" :value="treeAttrs[curFn]" @input="handleEditorInput"></js-code-editor>
      </el-dialog>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleCloseTreeAttrs">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { TreeAttrs } from "/baseConfig/treeBaseConfig";
import IconPicker from "../setupBtnConfig/components/iconPicker";
import { cloneDeep } from "lodash";

export default {
  components: {
    IconPicker
  },
  data() {
    return {
      dialogVisibleTreeAttrs: false,
      showCodeEditor: false,
      treeAttrs: new TreeAttrs(),
      curFn: "",
      rules: {},
      deliveryFieldsOption: {
        options: []
      }
    };
  },

  inject: ["getPageInfo"],
  computed: {
    isDataModel() {
      return this.getPageInfo.isDataModel;
    }
  },

  methods: {
    showTreeAttrs(attrs) {
      this.treeAttrs = cloneDeep(attrs);
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
    handleConfirm() {
      this.$emit("changeTreeAttrs", this.treeAttrs);
      this.handleCloseTreeAttrs();
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
.marginR5 {
  margin-right: 5px;
}
</style>
