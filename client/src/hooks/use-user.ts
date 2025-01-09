import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InsertUser, SelectUser } from "@db/schema";
import { useToast } from '@/hooks/use-toast';

type UserResponse = {
  id: number;
  username: string;
  displayName?: string;
  education?: string;
  occupation?: string;
  bio?: string;
  xp: number;
  level: number;
};

type RequestResult = {
  ok: true;
  message?: string;
  user?: UserResponse;
} | {
  ok: false;
  message: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: Partial<InsertUser>
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status >= 500) {
        return { ok: false, message: response.statusText };
      }

      const message = await response.text();
      return { ok: false, message };
    }

    const data = await response.json();
    return { ok: true, ...data };
  } catch (e: any) {
    return { ok: false, message: e.toString() };
  }
}

export function useUser() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery<UserResponse | null, Error>({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          return null;
        }
        throw new Error(await response.text());
      }

      return response.json();
    },
    staleTime: Infinity,
    retry: false
  });

  const loginMutation = useMutation<RequestResult, Error, InsertUser>({
    mutationFn: (userData) => handleRequest('/api/login', 'POST', userData),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: ['user'] });
        toast({
          title: "Success",
          description: result.message || "Login successful"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message
        });
      }
    },
  });

  const registerMutation = useMutation<RequestResult, Error, InsertUser>({
    mutationFn: (userData) => handleRequest('/api/register', 'POST', userData),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: ['user'] });
        toast({
          title: "Success",
          description: result.message || "Registration successful"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message
        });
      }
    },
  });

  const logoutMutation = useMutation<RequestResult, Error>({
    mutationFn: () => handleRequest('/api/logout', 'POST'),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: ['user'] });
        toast({
          title: "Success",
          description: result.message || "Logout successful"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message
        });
      }
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}