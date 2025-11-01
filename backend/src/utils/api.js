import axios from "axios";

export const clickupAPI = axios.create({
  baseURL: "https://api.clickup.com/api/v2/",
});
