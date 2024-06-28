<template>
  <el-dialog
    title="表格属性设置"
    :visible.sync="dialogVisibleTableAttrs"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="900px"
    :before-close="handleCloseTableAttrs"
  >
    <div style="min-width: 60px;background: #fff;padding: 10px; margin-top: 60px;margin-bottom: 60px;">
      <el-form ref="ruleForm" :model="tableAttrs" :rules="rules" label-width="130px" style="padding-bottom: 20px">
        <el-form-item label="分页" prop="showPagination">
          <el-switch v-model="tableAttrs.showPagination" />
        </el-form-item>
        <el-form-item v-show="tableAttrs.showPagination" label="分页显示条数" prop="showPagination">
          <el-select v-model="tableAttrs.paginationSize" placeholder="请选择">
            <el-option v-for="item in paginationSizeOptions" :key="item.value" :label="item.label" :value="item.value"> </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="显示序号" prop="isShowIndex">
          <el-switch v-model="tableAttrs.isShowIndex" />
        </el-form-item>
        <el-form-item v-if="tableAttrs.isShowIndex" label="自定义索引函数">
          <el-input v-model="tableAttrs.index" placeholder="请输入function(index){ return index}格式" @focus="handleShow('index', $event)"></el-input>
        </el-form-item>
        <el-form-item label="多选" prop="isShowCheckbox">
          <el-switch v-model="tableAttrs.isShowCheckbox" />
        </el-form-item>
        <el-form-item label="斑马线" prop="stripe">
          <el-switch v-model="tableAttrs.stripe" />
        </el-form-item>
        <el-form-item label="边框" prop="border">
          <el-switch v-model="tableAttrs.border" />
        </el-form-item>
        <el-form-item label="合计" prop="showSummary">
          <el-switch v-model="tableAttrs.showSummary" />
        </el-form-item>
        <el-form-item v-if="tableAttrs.showSummary" label="合计函数" prop="summaryMethod">
          <el-input v-model="tableAttrs.summaryMethod" placeholder="请输入格式为Function({ columns, data })" @focus="handleShow('summaryMethod', $event)"></el-input>
        </el-form-item>
        <el-form-item label="合并" prop="isMerge">
          <el-switch v-model="tableAttrs.isMerge" />
        </el-form-item>
        <el-form-item v-if="tableAttrs.isMerge" label="合并函数" prop="spanMethod">
          <el-input v-model="tableAttrs.spanMethod" placeholder="请输入格式为Function({ row, column, rowIndex, columnIndex })" @focus="handleShow('spanMethod', $event)"></el-input>
        </el-form-item>
        <el-form-item label="树类型数据" prop="isTree">
          <el-switch v-model="tableAttrs.isTree" />
        </el-form-item>
        <el-form-item v-if="tableAttrs.isTree" label="配置tree-props" prop="treeProps">
          <el-input v-model="tableAttrs.treeProps" type="textarea" :rows="2" placeholder="请输入{children, hasChildren}格式"></el-input>
        </el-form-item>
        <el-form-item v-if="tableAttrs.isTree" label="指定row-key">
          <el-select v-model="tableAttrs.rowKey" placeholder="请选择">
            <el-option v-for="item in deliveryFieldsOption.options" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="tableAttrs.isTree" label="数据转换函数">
          <el-tooltip
            slot="label"
            class="item"
            effect="dark"
            content="由于当前通过sql查询很难直接生成树形结构所需的数据结构，因为通过此函数进行数据结构转换（优先级最高）"
            placement="top-start"
          >
            <span style="cursor: pointer;font-size: 14px">数据转换函数</span>
          </el-tooltip>
          <el-input v-model="tableAttrs.dataTransitionFn" placeholder="请输入数据转换函数" @focus="handleShow('dataTransitionFn', $event)"></el-input>
        </el-form-item>
        <el-form-item v-if="tableAttrs.isTree" label="数据转换配置">
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
          <el-select v-model="tableAttrs.dataTransitionParentField" placeholder="请选择">
            <el-option v-for="item in deliveryFieldsOption.options" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
          </el-select>
          <span>id字段：</span>
          <el-select v-model="tableAttrs.dataTransitionCurField" placeholder="请选择">
            <el-option v-for="item in deliveryFieldsOption.options" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="tableAttrs.isTree" label="懒加载" prop="lazy">
          <el-switch v-model="tableAttrs.lazy" />
        </el-form-item>
        <el-form-item v-if="tableAttrs.isTree && tableAttrs.lazy" label="传递字段">
          <el-tooltip slot="label" class="item" effect="dark" content="一般懒加载时的load函数需要传递当前row的某个字段当作参数获取下一级的tableData" placement="top-start">
            <span style="cursor: pointer;font-size: 14px">传递字段</span>
          </el-tooltip>
          <el-select v-model="tableAttrs.deliveryLoadFnField" placeholder="请选择">
            <el-option v-for="item in deliveryFieldsOption.options" :key="item.id" :label="item.cnName" :value="item.id"> </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="组件大小" prop="size">
          <el-select v-model="tableAttrs.size" placeholder="请选择">
            <el-option v-for="item in sizeOptions" :key="item.value" :label="item.label" :value="item.value"> </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="单击列展示详情" prop="clickRowShowDetialDialog">
          <el-tooltip
            slot="label"
            class="item"
            effect="dark"
            content="开启此功能后，单击列表的某行数据会调用其查看按钮相关功能（如果有），不开启此功能，则默认为双击时触发"
            placement="top-start"
          >
            <span style="cursor: pointer;font-size: 14px">单击列展示详情</span>
          </el-tooltip>
          <el-switch v-model="tableAttrs.clickRowShowDetialDialog" />
        </el-form-item>

        <el-form-item label="自定义样式" prop="style">
          <el-input v-model="tableAttrs.style" type="textarea" :rows="2" placeholder="请输入整体样式（包括列表、搜索区域和按钮区域）"></el-input>
        </el-form-item>

        <!-- <el-form-item label="列表自定义样式" prop="elTableStyle">
            <el-tooltip slot="label" class="item" effect="dark"
              content="开启此功能后，单击列表的某行数据会调用其查看按钮相关功能（如果有），不开启此功能，则默认为双击时触发" placement="top-start">
              <span style="cursor: pointer;font-size: 14px"></span>
            </el-tooltip>
            <el-input v-model="tableAttrs.elTableStyle" type="textarea" :rows="2"
              placeholder="请输入列表样式（包括列表、搜索区域和按钮区域）"></el-input>
          </el-form-item> -->
      </el-form>
      <el-dialog ref="chEditor" :before-close="handleClose" title="代码编写" :visible="showCodeEditor" width="900px" :append-to-body="true">
        <js-code-editor mode="javascript" :readonly="false" :value="tableAttrs[curFn]" @input="handleEditorInput"></js-code-editor>
      </el-dialog>
    </div>
  </el-dialog>
</template>

<script>
export default {
  props: {
    tableAttrs: {
      type: Object,
      default() {
        return {};
      }
    },
    deliveryFieldsOption: {
      type: Object,
      default() {
        return {
          options: []
        };
      }
    }
  },
  data() {
    return {
      dialogVisibleTableAttrs: false,
      showCodeEditor: false,
      curFn: '',
      rules: {},
      sizeOptions: [
        {
          value: "medium",
          label: "中等"
        },
        {
          value: "small",
          label: "小"
        },
        {
          value: "mimi",
          label: "迷你"
        }
      ],
        paginationSizeOptions: [
        {
          label: "10条/页",
          value: 10
        },
        {
          label: "20条/页",
          value: 20
        },
        {
          label: "50条/页",
          value: 50
        },
        {
          label: "100条/页",
          value: 100
        }
      ],
    };
  },
  methods: {
    showDlg() {
      this.dialogVisibleTableAttrs = true;
    },
    async handleShow(field) {
      this.curFn = field;
      this.showCodeEditor = true;
      await this.$nextTick();
      this.$refs.chEditor.aceEditor.setOptions({
        value: this.tableAttrs[this.curFn]
      });
      this.$refs.chEditor.codeValue = this.tableAttrs[this.curFn];
    },
    handleClose() {
      this.showCodeEditor = false;
    },
    handleEditorInput(value) {
      // 处理编辑器输入的逻辑
      this.tableAttrs[this.tableAttrs.curFn] = value;
    },
    handleCloseTableAttrs() {
      this.dialogVisibleTableAttrs = false;
    }
  }
};
</script>
