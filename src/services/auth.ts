import axiosInstance from '@/lib/axios';

export const authService = {
  login: async (username: string, password: string) => {
    const response = await axiosInstance.post('/auth/login', {
      username,
      password,
    });
    return response.data;
  },
};
