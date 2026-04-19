import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';
import { createPost, deletePost, getMe, updateMe } from '../services/api';
import { CreatePostRequest, UpdateProfileRequest } from '../types';

export const useApi = () => {
  const { getAccessTokenSilently } = useAuth0();

  const withToken = useCallback(
    async <T>(fn: (token: string) => Promise<T>): Promise<T> => {
      const token = await getAccessTokenSilently();
      return fn(token);
    },
    [getAccessTokenSilently]
  );

  return {
    createPost: (body: CreatePostRequest) =>
      withToken((token) => createPost(token, body)),
    deletePost: (id: string) =>
      withToken((token) => deletePost(token, id)),
    getMe: () =>
      withToken((token) => getMe(token)),
    updateMe: (body: UpdateProfileRequest) =>
      withToken((token) => updateMe(token, body)),
  };
};
