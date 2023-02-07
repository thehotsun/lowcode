<template>
  <div class="bottom_tree">
    <div class="bottom_left">
      <div class="left_button">
        <el-button type="primary" size="mini" @click="addGroup">
          新增分类
        </el-button>
        <el-button type="primary" size="mini" :disabled="!currentRow.id" @click="addsonGroup">
          新增子分类</el-button>
        <el-button type="primary" size="mini" :disabled="!currentRow.id" plain @click="updateGroup">
          修改
        </el-button>
        <el-button type="danger" size="mini" :disabled="!currentRow.id" plain @click="deleteGroup">
          删除
        </el-button>
      </div>
      <div class="left_tree">
        <el-tree ref="depTree" :data="frameTree" :accordion="true" :props="defaultProps"
          :default-expanded-keys="defaultExpandedKeys" class="tree_1" highlight-current node-key="sortID"
          @current-change="currentOrgChangeHandler">
          <template #default="{ data }">
            <span style="font-size:14px">
              {{ data.sortName }}[{{ data.sortCode }}]
            </span>
          </template>
        </el-tree>
      </div>
    </div>

    <!-- 增加 修改 -->
    <el-dialog v-dialogDrag title="新增" :visible.sync="editPersonDialog" :before-close="closeDialog"
      :close-on-click-modal="false" :close-on-press-escape="false" width="500px">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="分类ID" prop="sortCode">
          <el-input v-model="form.sortCode" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="分组名称" prop="sortName">
          <el-input v-model="form.sortName" maxlength="20" show-word-limit />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeDialog">取 消</el-button>
        <el-button v-if="submitType != 2" type="primary" @click="addConfirm">确 定</el-button>
        <el-button v-else type="primary" @click="updateConfirm">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>
import service from '@/CommonDP/service/listEngine-service';
import { mapState } from 'vuex';
const newForm = () => ({
  sortCode: '',
  sortName: '',
});
export default {
  data () {
    return {
      defaultProps: {
        children: 'treeList',
        label: 'sortName',
      },
      frameTree: [], // 树
      defaultExpandedKeys: [],
      form: newForm(),
      rules: {
        sortCode: [
          { required: true, message: 'ID必填', trigger: 'blur' },
        ],
        sortName: [
          { required: true, message: '分组名称必填', trigger: 'blur' },
        ],
      },
      editPersonDialog: false,
      submitType: '',
      currentRow: {},
    };
  },
  computed: {
    ...mapState({
      enterpriseId: (state) => state.enterprise.enterpriseId,
    }),
  },

  created () {
    // this.getFrameTree();
  },
  methods: {

    // 获取左侧模板
    getFrameTree () {
      this.frameTree = [];
      service.getElectronic(this.enterpriseId).then(({ data }) => {
        this.frameTree = data || [];
        if (this.frameTree.length > 0) {
          this.currentOrgChangeHandler(this.frameTree[0]);
          this.$nextTick(() => {
            this.$refs.depTree.setCurrentKey(this.frameTree[0].sortID); // 一定要加这个选中了否则样式没有出来
          });
        }
      });
    },

    // 选中左侧模板
    currentOrgChangeHandler (val) {
      this.currentRow = val;
    },

    // 选中的阶段
    addGroup () {
      this.editPersonDialog = true;
      this.submitType = 0;
      this.$nextTick(() => {
        this.$refs.form.resetFields();
        this.form = newForm();
      });
    },

    addsonGroup () {
      this.editPersonDialog = true;
      this.submitType = 1;
      this.$nextTick(() => {
        this.$refs.form.resetFields();
        this.form = newForm();
      });
    },


    updateGroup () {
      this.editPersonDialog = true;
      this.submitType = 2;
      this.form.sortCode = this.currentRow.sortCode;
      this.form.sortName = this.currentRow.sortName;
    },

    async addConfirm () {
      const {
        form: { sortCode, sortName },
        enterpriseId,
      } = this;
      const params = { sortCode, sortName, enterpriseId };
      await this.$refs.form.validate();
      if (this.submitType === 0) {
        await service.insertElectronic(params);
      } else {
        params.sortID = this.currentRow.sortID;
        await service.addElectronic(params);
      }
      await this.$message({ message: '新增成功', type: 'success' });
      this.getFrameTree();
      this.closeDialog();
    },

    async updateConfirm () {
      const {
        form: { sortCode, sortName },
        enterpriseId,
      } = this;
      const params = { sortCode, sortName, enterpriseId };
      params.sortID = this.currentRow.sortID;
      await this.$refs.form.validate();
      const res = await service.updateElectronic(params);
      if (res.result === '0') {
        this.$message({
          message: '修改成功',
          type: 'success',
        });
      }
      this.defaultExpandedKeys = [this.currentRow.sortID];
      this.getFrameTree();
      this.closeDialog();
    },

    closeDialog () {
      this.$refs.form.resetFields();
      this.editPersonDialog = false;
    },

    async deleteGroup () {
      const row = this.currentRow;
      await this.$updateConfirm('此操作将删除该分类，是否继续？', '提示', {
        updateConfirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      });
      if (row.pid === '0') {
        const res = await service.deleteElectronic(row.sortID);
        if (res.result === '0') this.$message.success('删除成功');
      } else {
        const result = await service.deleteChildnodes(row.sortID);
        if (result.result === '0') this.$message.success('删除成功');
      }
      this.getFrameTree(); // 刷新列表
    },
  },
};
</script>
<style lang="scss" scoped>
$top-button-height: 42px;

.bottom_tree {
  width: 100%;
  height: 100%;
  background-color: #fff;
  position: relative;
  min-width: 100%;

  .bottom_left {
    height: 100%;
    min-height: 600px;
    top: 0;
    bottom: 0;
    left: 0;
    padding-left: 12px;

    .left_button {
      height: $top-button-height;
      padding: 10px;
    }

    .left_tree {
      overflow: auto;
      left: 5px;
      top: 75px;
      bottom: 0;
      right: 0;

      .tree_1 {
        font-size: 14px;
      }
    }
  }
}

/deep/.el-tree-node__content {
  height: 31px;
  line-height: 31px;
}

/deep/.el-divider--horizontal {
  margin: 10px 0;
}
</style>
