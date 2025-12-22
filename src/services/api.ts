import axios from 'axios';

const apiClient = axios.create({
    baseURL: window.location.origin,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;
