<template>
  <div class="bottom_tree_table">
    <div class="bottom_left">
      <div class="left_tree">
        <tree @orgcurrent="currentOrgChangeHandler" ref="tree"></tree>
      </div>
    </div>
    <div class="bottom_right">
      <div class="right_button" style="display: inline-block">
        <el-form inline @submit.native.prevent>
          <el-form-item>
            <el-button type="primary" size="mini" @click="addList">
              新增表格
            </el-button>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="mini" @click="addBtn">
              新增功能按钮
            </el-button>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="mini" plain @click="updateList">
              修改
            </el-button>
          </el-form-item>
          <el-form-item>
            <el-button type="danger" plain size="mini" @click="deleteList">
              删除
            </el-button>
          </el-form-item>
          <el-form-item label="搜索：">
            <el-input v-model="searchQuery.keyword" placeholder="请输入列表编号或者列表名称" size="small" style="width: 200px"
              clearable @input="handleCurrentChange">
              <template #prefix>
                <i class="el-icon-search el-input__icon" @click="handleCurrentChange" />
              </template>
            </el-input>
          </el-form-item>
        </el-form>
      </div>
      <div class="right_table">
        <custom-table ref="table" @handleChange="handleChange"></custom-table>
      </div>
      <page :page="page" @handleSizeChange="handleSizeChange" @handleCurrentChange="handleCurrentChange" class="page-2">
      </page>
      <editTableDialog ref="editTableDialog" @refreshList="handleCurrentChange"></editTableDialog>
      <editBtnDialog ref="editBtnDialog" @refreshList="handleCurrentChange"></editBtnDialog>
    </div>
  </div>
</template>
<script>
import tree from './components/tree.vue';
import page from '@/CommonDP/components/paging';
import table from './components/table.vue';
import editTableDialog from './components/editTableDialog.vue';
import editBtnDialog from './components/editBtnDialog.vue';
import service from '@/CommonDP/service/listEngine-service';
import { mapState } from 'vuex';
export default {
  components: { tree, customTable: table, page, editTableDialog, editBtnDialog },
  data () {
    return {
      page: {
        pageNum: 1,
        pageSize: 10,
        totalCount: 0,
      },
      icon: require('@/CommonDP/assets/doc/folder_icon.png'),
      searchQuery: {
        keyword: '',
      },

    };
  },
  computed: {
    ...mapState({
      enterpriseId: (state) => state.enterprise.enterpriseId,
    }),
  },

  methods: {
    // TODO
    getParams () {
      const cur = this.$refs.tree.currentRow || {}
      const params = {
        ...this.page,
        id: cur.val,
        keyword: this.searchQuery.keyword
      }
      return params
    },
    currentOrgChangeHandler () {
      const params = this.getParams()
      this.$refs.table.getTableData(params);
    },
    handleCurrentChange () {
      const params = this.getParams()
      this.$refs.table.getTableData(params);
    },
    handleSizeChange (val) {
      this.page.pageSize = val;
      const params = this.getParams()
      this.$refs.table.getTableData(params);
    },

    handleChange (val) {

    },

    addList () {
      this.$refs.editTableDialog.expose_showDialog()
    },
    addBtn() {
      this.$refs.editBtnDialog.expose_showDialog()
    },
    updateList () { },
    deleteList () { },

  },
};
</script>
<style lang="scss" scoped>
$top-button-height: 52px;
$middle-height: 30px;
$left-width: 360px;

.bottom_tree_table {
  width: 100%;
  height: 100%;
  background-color: #fff;
  position: relative;
  min-width: 1080px;

  .bottom_left {
    position: absolute;
    height: 100%;
    top: 0;
    bottom: 0;
    left: 0;
    width: $left-width;
    padding-left: 12px;
    border-right: 1px solid #ebefff;

    .left_tree {
      overflow: auto;
      position: absolute;
      left: 0;
      top: 0;
      bottom: 10px;
      right: 0;
      display: flex;
      flex-direction: column;
    }
  }

  .bottom_right {
    position: relative;
    height: 100%;
    margin-left: $left-width + 20px;

    .right_button {
      // height: $top-button-height;
      padding: 10px 0;
    }

    .right_table {
      position: absolute;
      top: $top-button-height + 10px;
      left: 10px;
      bottom: 40px;
      right: 10px;
    }
  }
}

.page-2 {
  position: absolute;
  bottom: 0;
  right: 20px;
  height: 34px;
  padding: 2px;
}
</style>
