import request from "@/CommonDP/utils/request";

export default {
  messageList(params) {
    return request.post("/message/list", params);
  }
};
