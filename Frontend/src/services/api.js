import axios from "axios";

const API = axios.create({
  baseURL:
    "https://working-code-am.onrender.com/api",
  withCredentials: false
});

export default API;