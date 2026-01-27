import axios from "axios";

const API = axios.create({
  baseURL:"https://working-code-am.onrender.com"
   // process.env.REACT_APP_API_URL,
  //withCredentials: false
});

export default API;