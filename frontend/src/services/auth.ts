import API from "./api";

export const login = async (email: string, password: string): Promise<string> => {
  // FastAPI OAuth2 expects form data, not JSON
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);

  const response = await API.post("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return response.data.access_token;
};

export const register = async (
  email: string,
  password: string,
  name?: string
): Promise<void> => {
  await API.post("/auth/register", { email, password, name });
};

export const saveToken = (token: string) => {
  localStorage.setItem("access_token", token);
};

export const getToken = (): string | null => {
  return localStorage.getItem("access_token");
};

export const removeToken = () => {
  localStorage.removeItem("access_token");
};
