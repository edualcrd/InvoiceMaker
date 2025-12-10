// Esta función sustituye al 'fetch' normal
export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('invoice_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['x-auth-token'] = token; // Pegamos el token aquí
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  // Si el token ha caducado (Error 401), echamos al usuario
  if (response.status === 401) {
    localStorage.removeItem('invoice_token');
    window.location.href = '/'; // Recargar para ir al login
  }

  return response;
};