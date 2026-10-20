// Every call to the FastAPI backend goes through this file.
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

// fastapi-users returns short error codes; turn them into readable messages.
const FRIENDLY = {
  LOGIN_BAD_CREDENTIALS: "Wrong email or password.",
  LOGIN_USER_NOT_VERIFIED: "Please verify your email first.",
  REGISTER_USER_ALREADY_EXISTS: "An account with this email already exists.",
  Unauthorized: "Your session has expired. Please log in again.",
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function messageFrom(data, status) {
  const detail = data?.detail;
  if (typeof detail === "string") return FRIENDLY[detail] || detail;
  if (detail?.reason) return detail.reason;
  if (Array.isArray(detail) && detail.length) {
    // FastAPI validation errors (422) are a list of { loc, msg }.
    const first = detail[0];
    const field = first.loc?.[first.loc.length - 1];
    return field && field !== "body" ? `${field}: ${first.msg}` : first.msg;
  }
  return status ? `Something went wrong (${status}).` : "Can't reach the server. Is the backend running on port 8000?";
}

async function request(path, { token, headers, ...options } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...(token && { Authorization: `Bearer ${token}` }), ...headers },
    });
  } catch {
    throw new ApiError(0, messageFrom(null, 0));
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, messageFrom(data, res.status));
  return data;
}

export const api = {
  // The login route expects an OAuth2 form (username + password), not JSON.
  async login(email, password) {
    const data = await request("/auth/jwt/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: email, password }),
    });
    return data.access_token;
  },

  register: (email, password) =>
    request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),

  me: (token) => request("/users/me", { token }),

  feed: (token) => request("/feed", { token }).then((data) => data.posts),

  deletePost: (token, id) => request(`/posts/${id}`, { method: "DELETE", token }),

  // Uses XMLHttpRequest instead of fetch because only XHR reports upload progress.
  upload(token, file, caption, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}/upload`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.responseType = "json";
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(e.loaded / e.total);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
        else reject(new ApiError(xhr.status, messageFrom(xhr.response, xhr.status)));
      };
      xhr.onerror = () => reject(new ApiError(0, messageFrom(null, 0)));

      const form = new FormData();
      form.append("file", file);
      form.append("caption", caption);
      xhr.send(form);
    });
  },
};

// ImageKit resizes/crops on the fly when you add ?tr=... to a file URL.
export function imageUrl(url, transforms) {
  return transforms ? `${url}?tr=${transforms}` : url;
}
