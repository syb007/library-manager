import axios from 'axios';

// In a production app, this URL would come from an environment variable.
// e.g., const API_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL;
const API_BASE_URL = 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default apiClient;
