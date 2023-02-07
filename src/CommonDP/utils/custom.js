import customSource from "@/CommonDP/customList.js";

const list = customSource.customList[0];

function reNameSource(source, isTest) {
  if (isTest) {
    return Object.values(list).find(ele => location.pathname.includes(ele));
  } else {
    let value = "";
    Object.keys(list).forEach(key => {
      if (key == source) {
        value = list[key];
      }
    });
    return process.env.VUE_APP_CUSTOM || value;
  }
}
function checkSource() {
  // 是否是测试环境
  const isTest = location.hostname == "58.56.31.20" && Object.values(list).some(ele => location.pathname.includes(ele));
  return reNameSource(location.origin, isTest);
}

export default {
  checkSource
};
